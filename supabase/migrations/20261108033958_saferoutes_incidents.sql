begin;

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;

-- Resolve PostGIS even on projects where it was already installed in another schema.
do $$
declare
    postgis_schema name;
begin
    select n.nspname into strict postgis_schema
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
    where e.extname = 'postgis';

    execute format('grant usage on schema %I to service_role', postgis_schema);
    perform set_config('search_path', 'pg_catalog, ' || quote_ident(postgis_schema), true);
end;
$$;

create schema saferoutes;
revoke all on schema saferoutes from public, anon, authenticated;
grant usage on schema saferoutes to service_role;

create table saferoutes.incidents (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null references auth.users(id) on delete cascade,
    category text not null check (
        category in ('poor_lighting', 'harassment', 'obstruction', 'other')
    ),
    lon double precision not null check (lon between -180 and 180),
    lat double precision not null check (lat between -90 and 90),
    location geography(point, 4326) generated always as (
        st_setsrid(st_makepoint(lon, lat), 4326)::geography
    ) stored,
    created_at timestamptz not null default now()
);

create index incidents_location_idx on saferoutes.incidents using gist (location);
create index incidents_reporter_created_idx on saferoutes.incidents (reporter_id, created_at);

create table saferoutes.confirmations (
    incident_id uuid not null references saferoutes.incidents(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    primary key (incident_id, user_id)
);

create index confirmations_user_idx on saferoutes.confirmations (user_id);

alter table saferoutes.incidents enable row level security;
alter table saferoutes.confirmations enable row level security;

revoke all on all tables in schema saferoutes from public, anon, authenticated;
grant select, insert on saferoutes.incidents, saferoutes.confirmations to service_role;

create function public.saferoutes_report_incident(
    p_reporter uuid, p_category text, p_lon double precision, p_lat double precision
)
returns jsonb
language plpgsql
set search_path from current
as $$
declare
    report saferoutes.incidents;
begin
    -- Serialize this account's writes so simultaneous requests share the same daily limit.
    perform pg_advisory_xact_lock(hashtextextended(p_reporter::text, 691570));
    if (
        select count(*) from saferoutes.incidents
        where reporter_id = p_reporter and created_at > now() - interval '24 hours'
    ) >= 10 then
        raise sqlstate 'PT429' using message = 'Daily incident report limit reached';
    end if;

    insert into saferoutes.incidents (reporter_id, category, lon, lat)
    values (p_reporter, p_category, p_lon, p_lat)
    returning * into report;

    return jsonb_build_object(
        'id', report.id, 'category', report.category, 'lon', report.lon, 'lat', report.lat,
        'created_at', report.created_at, 'confirmations', 0, 'community_confirmed', false
    );
end;
$$;

create function public.saferoutes_confirm_incident(p_incident uuid, p_user uuid)
returns text
language plpgsql
set search_path from current
as $$
declare
    reporter uuid;
begin
    select reporter_id into reporter
    from saferoutes.incidents
    where id = p_incident and created_at > now() - interval '7 days';

    if not found then
        return 'missing';
    end if;
    if reporter = p_user then
        return 'own_report';
    end if;

    insert into saferoutes.confirmations (incident_id, user_id)
    values (p_incident, p_user)
    on conflict do nothing;
    return 'confirmed';
end;
$$;

create function public.saferoutes_nearby_incidents(
    p_lat double precision, p_lon double precision, p_radius_m integer
)
returns table (
    id uuid, category text, lon double precision, lat double precision,
    created_at timestamptz, confirmations bigint, community_confirmed boolean
)
language sql stable
set search_path from current
as $$
    select i.id, i.category, i.lon, i.lat, i.created_at, c.total, c.total >= 2
    from (
        select incident.*
        from saferoutes.incidents incident
        where incident.created_at > now() - interval '7 days'
          and st_dwithin(
            incident.location,
            st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography,
            p_radius_m
          )
        order by incident.created_at desc, incident.id
        limit 100
    ) i
    cross join lateral (
        select count(*) as total from saferoutes.confirmations
        where incident_id = i.id
    ) c
    order by i.created_at desc, i.id;
$$;

create function public.saferoutes_route_incidents(p_lines jsonb)
returns jsonb
language sql stable
set search_path from current
as $$
    select coalesce(jsonb_agg(route.matches order by input.ordinality), '[]'::jsonb)
    from jsonb_array_elements(p_lines) with ordinality as input(geojson, ordinality)
    cross join lateral (
        select st_setsrid(st_makeline(
            st_makepoint((point.coords ->> 0)::double precision, (point.coords ->> 1)::double precision)
            order by point.ordinality
        ), 4326) as line
        from jsonb_array_elements(input.geojson -> 'coordinates')
            with ordinality as point(coords, ordinality)
    ) g
    cross join lateral (
        select coalesce(jsonb_agg(
            jsonb_build_object(
                'id', i.id, 'category', i.category,
                'segment', least(10, 1 + floor(10 * st_linelocatepoint(
                    g.line, i.location::geometry
                ))::integer)
            ) order by i.created_at desc, i.id
        ), '[]'::jsonb) as matches
        from saferoutes.incidents i
        where i.created_at > now() - interval '7 days'
          and st_dwithin(i.location, g.line::geography, 100)
          and exists (
            select 1 from saferoutes.confirmations c
            where c.incident_id = i.id
            offset 1 limit 1
          )
    ) route;
$$;

revoke execute on function
    public.saferoutes_report_incident(uuid, text, double precision, double precision),
    public.saferoutes_confirm_incident(uuid, uuid),
    public.saferoutes_nearby_incidents(double precision, double precision, integer),
    public.saferoutes_route_incidents(jsonb)
from public, anon, authenticated;

grant execute on function
    public.saferoutes_report_incident(uuid, text, double precision, double precision),
    public.saferoutes_confirm_incident(uuid, uuid),
    public.saferoutes_nearby_incidents(double precision, double precision, integer),
    public.saferoutes_route_incidents(jsonb)
to service_role;

notify pgrst, 'reload schema';

commit;
