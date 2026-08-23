"use client";

import { Search, MapPin } from "lucide-react";
import { FormEvent, useState } from "react";

type SearchBoxProps = {
  onSearch: (from: string, to: string) => void;
};

export default function SearchBox({ onSearch }: SearchBoxProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!from || !to) {
      alert("Please enter both starting point and destination.");
      return;
    }

    onSearch(from, to);
  };

  return (
    <form className="search-box" onSubmit={handleSubmit}>
      <div className="input-wrapper">
        <MapPin size={20} className="input-icon" />

        <input
          type="text"
          placeholder="Starting location"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div className="input-wrapper">
        <MapPin size={20} className="input-icon destination" />

        <input
          type="text"
          placeholder="Destination"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <button type="submit" className="search-button">
        <Search size={20} />
        Find Safe Route
      </button>
    </form>
  );
}
