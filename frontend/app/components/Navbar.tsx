"use client";

import {
  ShieldCheck,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("saferoutes-theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;

    setDarkMode(newMode);

    if (newMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("saferoutes-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("saferoutes-theme", "light");
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-container">

        <div className="logo">
          <ShieldCheck size={30} />
          <span>SafeRoutes</span>
        </div>

        <div className={`nav-links ${open ? "show" : ""}`}>
          <a href="#home" onClick={() => setOpen(false)}>
            Home
          </a>

          <a href="#routes" onClick={() => setOpen(false)}>
            Routes
          </a>

          <a href="#safety" onClick={() => setOpen(false)}>
            Safety
          </a>

          <a href="#about" onClick={() => setOpen(false)}>
            About
          </a>
        </div>

        <div className="nav-actions">

          <button
            className="theme-button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {darkMode ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

          <button
            className="menu-button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X /> : <Menu />}
          </button>

        </div>

      </div>
    </nav>
  );
}
