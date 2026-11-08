"use client";

import { Search, MapPin } from "lucide-react";
import { FormEvent, useState } from "react";

type SearchBoxProps = {
  onSearch: (from: string, to: string) => void;
  pending: boolean;
};

export default function SearchBox({ onSearch, pending }: SearchBoxProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!pending) onSearch(from, to);
  };

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <MapPin size={20} className="input-icon" />

        <input
          type="text"
          placeholder="Starting location"
          aria-label="Starting location"
          maxLength={160}
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div className="input-wrapper">
        <MapPin size={20} className="input-icon destination" />

        <input
          type="text"
          placeholder="Destination"
          aria-label="Destination"
          maxLength={160}
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <button type="submit" className="search-button" disabled={pending}>
        <Search size={20} />
        {pending ? "Finding routes…" : "Find Safe Route"}
      </button>
    </form>
  );
}
