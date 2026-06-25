import { useEffect, useMemo, useRef } from "react";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MonitoredUser, TrackingPoint } from "@shared/types";
import { formatCoordinate, formatTime } from "@renderer/utils/format";

interface LiveMapProps {
  users: MonitoredUser[];
  trackingHistory: TrackingPoint[];
  selectedUserId?: string;
  onSelectUser: (userId: string) => void;
}

function statusColor(status: MonitoredUser["status"]): string {
  switch (status) {
    case "sos":
      return "#ff3b5c";
    case "active":
      return "#36d399";
    case "idle":
      return "#fbbf24";
    default:
      return "#8aa0bd";
  }
}

function createMarkerIcon(user: MonitoredUser): L.DivIcon {
  return L.divIcon({
    className: "user-map-marker",
    html: `<span style="background:${statusColor(user.status)}"></span><strong>${user.callSign}</strong>`,
    iconSize: [96, 34],
    iconAnchor: [16, 16]
  });
}

export function LiveMap({
  users,
  trackingHistory,
  selectedUserId,
  onSelectUser
}: LiveMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const selectedHistory = useMemo(
    () =>
      trackingHistory
        .filter((point) => point.userId === selectedUser?.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-40),
    [selectedUser?.id, trackingHistory]
  );

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    mapRef.current = L.map(mapElementRef.current, {
      zoomControl: false,
      attributionControl: true
    }).setView([40.7128, -74.006], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(mapRef.current);

    L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) {
      return;
    }

    layerRef.current.clearLayers();

    users.forEach((user) => {
      const marker = L.marker([user.location.latitude, user.location.longitude], {
        icon: createMarkerIcon(user),
        riseOnHover: true
      })
        .bindPopup(
          `<strong>${user.name}</strong><br/>${user.callSign}<br/>${formatCoordinate(
            user.location.latitude
          )}, ${formatCoordinate(user.location.longitude)}<br/>Last GPS ${formatTime(
            user.location.timestamp
          )}`
        )
        .on("click", () => onSelectUser(user.id));

      marker.addTo(layerRef.current as L.LayerGroup);
    });

    if (selectedHistory.length > 1) {
      L.polyline(
        selectedHistory.map((point) => [point.latitude, point.longitude]),
        {
          color: "#38bdf8",
          weight: 4,
          opacity: 0.85
        }
      ).addTo(layerRef.current);
    }

    if (selectedUser) {
      mapRef.current.setView(
        [selectedUser.location.latitude, selectedUser.location.longitude],
        Math.max(mapRef.current.getZoom(), 14),
        { animate: true }
      );
    }
  }, [onSelectUser, selectedHistory, selectedUser, users]);

  return (
    <section className="panel map-panel">
      <div className="panel-heading map-heading">
        <div>
          <p className="eyebrow">Live Map Dashboard</p>
          <h2>GPS Monitoring</h2>
        </div>
        {selectedUser ? (
          <div className="selected-user-summary">
            <strong>{selectedUser.callSign}</strong>
            <span>{selectedUser.location.speedKph} kph · {selectedUser.location.accuracyMeters}m accuracy</span>
          </div>
        ) : null}
      </div>
      <div className="map-container" ref={mapElementRef} role="application" aria-label="Live GPS map" />
    </section>
  );
}
