import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import type { VetPlace } from "../../types";

// Leaflet's default marker icons reference image files by relative path,
// which breaks under bundlers like Vite. Rebuild the icon URLs from the
// installed package so pins render correctly in both dev and production.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const youIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:50%;background:#6B4A32;border:2px solid #F6F1E7;box-shadow:0 0 0 4px rgba(107,74,50,0.25)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lon]);
  return null;
}

export function PlacesMap({
  center,
  places,
}: {
  center: { lat: number; lon: number };
  places: VetPlace[];
}) {
  return (
    <div className="h-52 w-full overflow-hidden border border-rule">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <Recenter lat={center.lat} lon={center.lon} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[center.lat, center.lon]} icon={youIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {places
          .filter((p) => p.lat !== null && p.lon !== null)
          .map((p) => (
            <Marker key={p.id} position={[p.lat as number, p.lon as number]}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {p.address}
                <br />
                {p.distance}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
