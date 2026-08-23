"use client";

import {
  Clock3,
  MapPin,
  Users,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import { Route } from "../data/demoRoutes";
import SafetyScore from "./SafetyScore";

type RouteCardProps = {
  route: Route;
  selected: boolean;
  onSelect: () => void;
};

export default function RouteCard({
  route,
  selected,
  onSelect,
}: RouteCardProps) {
  return (
    <article
      className={`route-card ${selected ? "selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {/* ================================= */}
      {/* TOP */}
      {/* ================================= */}

      <div className="route-card-header">
        <div className="route-title-area">
          <div className="route-name-row">
            {selected && (
              <div className="route-selected-icon">
                <ShieldCheck size={14} />
              </div>
            )}

            <h3>{route.name}</h3>
          </div>

          <p>{route.description}</p>
        </div>

        <SafetyScore score={route.safetyScore} />
      </div>

      {/* ================================= */}
      {/* ROUTE INFORMATION */}
      {/* ================================= */}

      <div className="route-details">

        <div className="route-detail">
          <div className="route-detail-icon">
            <MapPin size={14} />
          </div>

          <div>
            <span className="route-detail-label">
              Distance
            </span>

            <strong>
              {route.distance}
            </strong>
          </div>
        </div>

        <div className="route-detail">
          <div className="route-detail-icon">
            <Clock3 size={14} />
          </div>

          <div>
            <span className="route-detail-label">
              Time
            </span>

            <strong>
              {route.duration}
            </strong>
          </div>
        </div>

        <div className="route-detail">
          <div className="route-detail-icon">
            <Lightbulb size={14} />
          </div>

          <div>
            <span className="route-detail-label">
              Lighting
            </span>

            <strong>
              {route.lighting}%
            </strong>
          </div>
        </div>

        <div className="route-detail">
          <div className="route-detail-icon">
            <Users size={14} />
          </div>

          <div>
            <span className="route-detail-label">
              Activity
            </span>

            <strong>
              {route.crowdLevel}
            </strong>
          </div>
        </div>

      </div>

      {/* ================================= */}
      {/* SAFETY BAR */}
      {/* ================================= */}

      <div className="route-safety-bar">

        <div className="route-safety-label">
          <span>Safety level</span>

          <strong>
            {route.safetyScore >= 90
              ? "Excellent"
              : route.safetyScore >= 75
              ? "Good"
              : "Moderate"}
          </strong>
        </div>

        <div className="route-progress">
          <div
            className="route-progress-fill"
            style={{
              width: `${route.safetyScore}%`,
            }}
          />
        </div>

      </div>

      {/* ================================= */}
      {/* BUTTON */}
      {/* ================================= */}

      <button
        type="button"
        className="route-button"
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <span>
          {selected ? "Route Selected" : "Select Route"}
        </span>

        <ArrowRight size={16} />
      </button>

    </article>
  );
}
