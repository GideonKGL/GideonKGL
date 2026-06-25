import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { createSocket } from "../api/socket";

type Location = {
  id: string;
  latitude: string;
  longitude: string;
  recordedAt: string;
};

type DeviceWithLocation = {
  id: string;
  name: string;
  user: { firstName: string; lastName: string; email: string };
  locations: Location[];
};

const mapContainerStyle = { width: "100%", height: "620px" };

export function Tracking() {
  const [devices, setDevices] = useState<DeviceWithLocation[]>([]);
  const { isLoaded } = useLoadScript({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "" });
  const center = useMemo(() => ({ lat: -26.2041, lng: 28.0473 }), []);

  useEffect(() => {
    api<DeviceWithLocation[]>("/locations/live").then(setDevices).catch(console.error);
    const socket = createSocket();
    socket.on("location.created", () => {
      api<DeviceWithLocation[]>("/locations/live").then(setDevices).catch(console.error);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <section>
      <h2>Live Tracking Map</h2>
      <div className="card map-card">
        {isLoaded ? (
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={10}>
            {devices.map((device) => {
              const latest = device.locations[0];
              if (!latest) return null;
              return (
                <Marker
                  key={device.id}
                  position={{ lat: Number(latest.latitude), lng: Number(latest.longitude) }}
                  title={`${device.name} - ${device.user.firstName} ${device.user.lastName}`}
                />
              );
            })}
          </GoogleMap>
        ) : (
          <p>Loading Google Maps...</p>
        )}
      </div>
    </section>
  );
}
