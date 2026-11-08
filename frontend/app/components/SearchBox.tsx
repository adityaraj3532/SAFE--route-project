"use client";

import { Search, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { searchPlaces, type Place } from "../data/routeApi";

function AddressField({ label, value, onChange }: {
  label: string;
  value: string | Place;
  onChange: (value: string | Place) => void;
}) {
  const [choices, setChoices] = useState<Place[]>([]);
  const [message, setMessage] = useState("");
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused || typeof value !== "string" || value.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const places = await searchPlaces(value.trim(), controller.signal);
        if (controller.signal.aborted) return;
        setChoices(places);
        setMessage(places.length ? "" : "No matches. Include the city name.");
      } catch {
        if (!controller.signal.aborted) setMessage("Suggestions unavailable. You can still enter an address.");
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, focused]);
  return (
    <div className="input-wrapper" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
    }}>
      <MapPin size={20} className="input-icon" />
      <input type="text" placeholder={label} aria-label={label} autoComplete="off"
        maxLength={160} value={typeof value === "string" ? value : value.label}
        onFocus={() => setFocused(true)}
        onKeyDown={(event) => { if (event.key === "Escape") setFocused(false); }}
        onChange={(event) => {
          setChoices([]); setMessage(""); setFocused(true); onChange(event.target.value);
        }} />
      {focused && typeof value === "string" && value.trim().length >= 3 && (
        <div className="location-suggestions">
          {choices.map((place, index) => (
            <button type="button" key={index} onClick={() => {
              onChange(place); setChoices([]); setFocused(false);
            }}>{place.label}</button>
          ))}
          {message && <span role="status">{message}</span>}
        </div>
      )}
    </div>
  );
}

export default function SearchBox({ onSearch, pending }: {
  onSearch: (from: string | Place, to: string | Place) => void;
  pending: boolean;
}) {
  const [from, setFrom] = useState<string | Place>("");
  const [to, setTo] = useState<string | Place>("");
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState("");
  const requestId = useRef(0);
  useEffect(() => () => { requestId.current++; }, []);

  function locate() {
    if (!navigator.geolocation) { setMessage("Location is unavailable in this browser."); return; }
    const id = ++requestId.current;
    setLocating(true);
    setMessage("Getting your location…");
    navigator.geolocation.getCurrentPosition(position => {
      if (id !== requestId.current) return;
      const { latitude, longitude, accuracy } = position.coords;
      setFrom({lat: latitude, lon: longitude, label: "Current location"});
      setLocating(false);
      setMessage(`Location accuracy approximately ${Math.round(accuracy)} metres.`);
    }, error => {
      if (id !== requestId.current) return;
      setLocating(false);
      setMessage(error.code === 1 ? "Allow location access in your browser settings, or enter your address."
        : error.code === 3 ? "Location timed out. Try again near a window, or enter your address."
        : "Location could not be determined. Try again or enter your address.");
    }, {enableHighAccuracy: true, timeout: 15000, maximumAge: 0});
  }

  return (
    <div>
      <form className="search-box" onSubmit={event => {
        event.preventDefault();
        if (!pending && !locating) onSearch(from, to);
      }}>
        <AddressField label="Starting location" value={from} onChange={value => {
          requestId.current++; setLocating(false); setMessage(""); setFrom(value);
        }} />
        <AddressField label="Destination" value={to} onChange={setTo} />
        <button type="submit" className="search-button" disabled={pending || locating}>
          <Search size={20} />{pending ? "Finding routes…" : "Find Safe Route"}
        </button>
      </form>
      <div className="location-actions">
        <button type="button" onClick={locate} disabled={locating || pending}>
          <MapPin size={16} />{locating ? "Locating…" : "Use my location"}
        </button>
        <span role="status">{message}</span>
      </div>
    </div>
  );
}
