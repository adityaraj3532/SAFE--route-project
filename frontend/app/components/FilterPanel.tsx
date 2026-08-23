"use client";

import {
  SlidersHorizontal,
  ShieldCheck,
  Lightbulb,
  RotateCcw,
} from "lucide-react";

type FilterPanelProps = {
  minSafety: number;
  setMinSafety: (value: number) => void;
  wellLitOnly: boolean;
  setWellLitOnly: (value: boolean) => void;
};

export default function FilterPanel({
  minSafety,
  setMinSafety,
  wellLitOnly,
  setWellLitOnly,
}: FilterPanelProps) {
  const resetFilters = () => {
    setMinSafety(0);
    setWellLitOnly(false);
  };

  const getSafetyLabel = () => {
    if (minSafety >= 90) return "Excellent";
    if (minSafety >= 75) return "Good";
    if (minSafety >= 50) return "Moderate";
    return "Any safety level";
  };

  return (
    <div className="filter-panel">

      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      <div className="filter-header">

        <div className="filter-title">

          <div className="filter-icon">
            <SlidersHorizontal size={16} />
          </div>

          <div>
            <h3>Route Filters</h3>

            <span>
              Customize your journey
            </span>
          </div>

        </div>

        <button
          type="button"
          className="filter-reset"
          onClick={resetFilters}
          title="Reset filters"
        >
          <RotateCcw size={14} />
        </button>

      </div>

      {/* ================================= */}
      {/* SAFETY SCORE */}
      {/* ================================= */}

      <div className="filter-section">

        <div className="filter-label-row">

          <div className="filter-label">

            <ShieldCheck size={15} />

            <span>
              Minimum safety
            </span>

          </div>

          <div className="safety-value">
            {minSafety}
          </div>

        </div>

        <div className="safety-status">
          {getSafetyLabel()}
        </div>

        <input
          className="safety-slider"
          type="range"
          min="0"
          max="100"
          value={minSafety}
          style={{
            background: `linear-gradient(
              to right,
              #22c55e 0%,
              #22c55e ${minSafety}%,
              var(--slider-track) ${minSafety}%,
              var(--slider-track) 100%
            )`,
          }}
          onChange={(event) =>
            setMinSafety(Number(event.target.value))
          }
          aria-label="Minimum safety score"
        />

        <div className="slider-labels">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>

      </div>

      {/* ================================= */}
      {/* LIGHTING */}
      {/* ================================= */}

      <div className="filter-section lighting-section">

        <div className="lighting-content">

          <div className="lighting-icon">
            <Lightbulb size={17} />
          </div>

          <div className="lighting-text">

            <strong>
              Well-lit routes
            </strong>

            <span>
              Prefer streets with better lighting
            </span>

          </div>

          <label className="switch">

            <input
              type="checkbox"
              checked={wellLitOnly}
              onChange={(event) =>
                setWellLitOnly(event.target.checked)
              }
            />

            <span className="switch-slider" />

          </label>

        </div>

      </div>

      {/* ================================= */}
      {/* ACTIVE FILTERS */}
      {/* ================================= */}

      {(minSafety > 0 || wellLitOnly) && (
        <div className="active-filters">

          <span className="active-filters-title">
            Active filters
          </span>

          <div className="filter-tags">

            {minSafety > 0 && (
              <span className="filter-tag">
                Safety ≥ {minSafety}
              </span>
            )}

            {wellLitOnly && (
              <span className="filter-tag">
                Well lit
              </span>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
