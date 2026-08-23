"use client";

import { useMemo, useState } from "react";

import {
  ShieldCheck,
  Navigation,
  Users,
  MapPinned,
  Sparkles,
  ArrowRight,
  Route as RouteIcon,
} from "lucide-react";

import { demoRoutes } from "./data/demoRoutes";

import Navbar from "./components/Navbar";
import Map from "./components/Map";
import SearchBox from "./components/SearchBox";
import RouteCard from "./components/RouteCard";
import FilterPanel from "./components/FilterPanel";

export default function Home() {
  /* ========================================= */
  /* STATE */
  /* ========================================= */

  const [minSafety, setMinSafety] = useState(0);

  const [wellLitOnly, setWellLitOnly] =
    useState(false);

  const [selectedRoute, setSelectedRoute] =
    useState(0);

  const [searchMessage, setSearchMessage] =
    useState("");

  /* ========================================= */
  /* FILTER ROUTES */
  /* ========================================= */

  const filteredRoutes = useMemo(() => {
    return demoRoutes.filter((route) => {
      const safetyMatch =
        route.safetyScore >= minSafety;

      const lightingMatch =
        !wellLitOnly || route.lighting >= 70;

      return safetyMatch && lightingMatch;
    });
  }, [minSafety, wellLitOnly]);

  /* ========================================= */
  /* SEARCH */
  /* ========================================= */

  const handleSearch = (
    from: string,
    to: string
  ) => {
    if (!from.trim() || !to.trim()) {
      setSearchMessage(
        "Please enter both your starting point and destination."
      );

      return;
    }

    setSearchMessage(
      `Finding safer routes from ${from} to ${to}...`
    );
  };

  /* ========================================= */
  /* SELECT ROUTE */
  /* ========================================= */

  const handleSelectRoute = (index: number) => {
    setSelectedRoute(index);
  };

  /* ========================================= */
  /* RESET SELECTED ROUTE WHEN FILTER CHANGES */
  /* ========================================= */

  const safeSelectedRoute =
    selectedRoute < filteredRoutes.length
      ? selectedRoute
      : 0;

  /* ========================================= */
  /* RENDER */
  /* ========================================= */

  return (
    <main className="saferoutes-app">

      {/* ===================================== */}
      {/* NAVBAR */}
      {/* ===================================== */}

      <Navbar />

      {/* ===================================== */}
      {/* HERO */}
      {/* ===================================== */}

      <section
        className="hero"
        id="home"
      >
        <div className="hero-content">

          {/* Badge */}

          <div className="badge">
            <ShieldCheck size={15} />

            <span>
              Safety-first navigation
            </span>
          </div>

          {/* Heading */}

          <h1>
            Find a route
            <br />

            <span>
              you can trust.
            </span>
          </h1>

          {/* Description */}

          <p>
            Find safer routes with intelligent
            safety scores, lighting information,
            and community insights.
          </p>

          {/* Search */}

          <SearchBox
            onSearch={handleSearch}
          />

          {/* Search status */}

          {searchMessage && (
            <div className="search-message">
              <Sparkles size={15} />

              <span>
                {searchMessage}
              </span>
            </div>
          )}

        </div>
      </section>

      {/* ===================================== */}
      {/* ROUTE DASHBOARD */}
      {/* ===================================== */}

      <section
        className="dashboard"
        id="routes"
      >

        {/* Dashboard heading */}

        <div className="dashboard-header">

          <div>
            <span className="section-label">
              SMART NAVIGATION
            </span>

            <h2>
              Choose your safest route
            </h2>

            <p>
              Compare routes based on safety,
              lighting, travel time and activity.
            </p>
          </div>

          <div className="route-count">

            <RouteIcon size={17} />

            <span>
              {filteredRoutes.length}
            </span>

            <small>
              routes available
            </small>

          </div>

        </div>

        {/* =================================== */}
        {/* DASHBOARD GRID */}
        {/* =================================== */}

        <div className="dashboard-grid">

          {/* ================================= */}
          {/* MAP */}
          {/* ================================= */}

          <div className="map-section">

            <div className="map-header">

              <div className="map-title">

                <div className="map-title-icon">
                  <MapPinned size={17} />
                </div>

                <div>
                  <strong>
                    Live route map
                  </strong>

                  <span>
                    Compare available routes
                  </span>
                </div>

              </div>

              <div className="map-status">

                <span className="map-status-dot" />

                Live

              </div>

            </div>

            <div className="map-container-wrapper">

              <Map
                selectedRoute={safeSelectedRoute}
              />

              {/* Map overlay */}

              <div className="map-overlay">

                <div className="map-overlay-icon">
                  <Navigation size={14} />
                </div>

                <div>
                  <strong>
                    Safety optimized
                  </strong>

                  <span>
                    Routes ranked by safety
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* ================================= */}
          {/* SIDEBAR */}
          {/* ================================= */}

          <aside className="sidebar">

            {/* Filters */}

            <FilterPanel
              minSafety={minSafety}
              setMinSafety={setMinSafety}
              wellLitOnly={wellLitOnly}
              setWellLitOnly={setWellLitOnly}
            />

            {/* Routes */}

            <div className="routes-list">

              <div className="routes-list-header">

                <div>

                  <h3>
                    Recommended routes
                  </h3>

                  <span>
                    Based on your preferences
                  </span>

                </div>

                <div className="routes-number">
                  {filteredRoutes.length}
                </div>

              </div>

              {/* Empty state */}

              {filteredRoutes.length === 0 && (
                <div className="empty-state">

                  <div className="empty-state-icon">
                    <ShieldCheck size={22} />
                  </div>

                  <h3>
                    No routes found
                  </h3>

                  <p>
                    Try lowering the safety score
                    or disabling the lighting filter.
                  </p>

                </div>
              )}

              {/* Route cards */}

              {filteredRoutes.map(
                (route, index) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    selected={
                      safeSelectedRoute === index
                    }
                    onSelect={() =>
                      handleSelectRoute(index)
                    }
                  />
                )
              )}

            </div>

          </aside>

        </div>

      </section>

      {/* ===================================== */}
      {/* SAFETY FEATURES */}
      {/* ===================================== */}

      <section
        className="features"
        id="safety"
      >

        <div className="section-heading">

          <div className="section-heading-icon">
            <ShieldCheck size={20} />
          </div>

          <span className="section-label">
            SAFETY BEYOND DIRECTIONS
          </span>

          <h2>
            Navigation that thinks about safety.
          </h2>

          <p>
            SafeRoutes doesn't simply calculate
            the shortest path. It helps you choose
            a route that feels safer.
          </p>

        </div>

        <div className="feature-grid">

          {/* Feature 1 */}

          <div className="feature">

            <div className="feature-icon">
              <ShieldCheck size={24} />
            </div>

            <div className="feature-number">
              01
            </div>

            <h3>
              Safety Scores
            </h3>

            <p>
              Quickly compare routes using a
              simple safety score based on
              multiple route indicators.
            </p>

            <span className="feature-link">
              Explore safety
              <ArrowRight size={14} />
            </span>

          </div>

          {/* Feature 2 */}

          <div className="feature">

            <div className="feature-icon">
              <Users size={24} />
            </div>

            <div className="feature-number">
              02
            </div>

            <h3>
              Community Insights
            </h3>

            <p>
              Understand activity and community
              patterns around different areas.
            </p>

            <span className="feature-link">
              View insights
              <ArrowRight size={14} />
            </span>

          </div>

          {/* Feature 3 */}

          <div className="feature">

            <div className="feature-icon">
              <Navigation size={24} />
            </div>

            <div className="feature-number">
              03
            </div>

            <h3>
              Smarter Navigation
            </h3>

            <p>
              Compare multiple routes and choose
              the option that fits your journey.
            </p>

            <span className="feature-link">
              Compare routes
              <ArrowRight size={14} />
            </span>

          </div>

        </div>

      </section>

      {/* ===================================== */}
      {/* ABOUT */}
      {/* ===================================== */}

      <section
        className="about-section"
        id="about"
      >

        <div className="about-content">

          <div className="about-icon">
            <ShieldCheck size={28} />
          </div>

          <span className="section-label">
            ABOUT SAFEROUTES
          </span>

          <h2>
            Every journey should feel safer.
          </h2>

          <p>
            SafeRoutes combines real map data,
            route information and safety indicators
            into one simple navigation experience.
          </p>

          <a
            href="#routes"
            className="about-button"
          >
            Explore routes

            <ArrowRight size={16} />
          </a>

        </div>

      </section>

      {/* ===================================== */}
      {/* FOOTER */}
      {/* ===================================== */}

      <footer>

        <div className="footer-content">

          <div className="footer-brand">

            <div className="footer-logo">
              <ShieldCheck size={20} />
            </div>

            <div>
              <strong>
                SafeRoutes
              </strong>

              <span>
                Safer journeys, smarter navigation.
              </span>
            </div>

          </div>

          <div className="footer-links">

            <a href="#home">
              Home
            </a>

            <a href="#routes">
              Routes
            </a>

            <a href="#safety">
              Safety
            </a>

            <a href="#about">
              About
            </a>

          </div>

          <div className="footer-copy">
            © {new Date().getFullYear()} SafeRoutes
          </div>

        </div>

      </footer>

    </main>
  );
}
