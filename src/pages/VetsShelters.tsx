import { useEffect, useState } from "react";
import { MapPin, Phone, Star, Globe, LocateFixed, AlertCircle } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { EmptyState } from "../components/ui/EmptyState";
import { PlacesMap } from "../components/ui/PlacesMap";
import type { VetPlace } from "../types";
import { cn } from "../utils/cn";

type LocationState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "ready"; lat: number; lon: number }
  | { status: "denied" }
  | { status: "error"; message: string };

export default function VetsShelters() {
  const [tab, setTab] = useState<"vet" | "shelter">("vet");
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [places, setPlaces] = useState<VetPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation({ status: "error", message: "Your browser doesn't support location lookup." });
      return;
    }
    setLocation({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ status: "ready", lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setLocation({ status: "denied" });
        else setLocation({ status: "error", message: "Couldn't determine your location." });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (location.status !== "ready") return;
    let cancelled = false;
    setLoadingPlaces(true);
    setPlacesError(null);
    api
      .get(`/places?lat=${location.lat}&lon=${location.lon}&type=${tab}`)
      .then((res) => !cancelled && setPlaces(res.places))
      .catch((err) => {
        if (cancelled) return;
        setPlaces([]);
        setPlacesError(err instanceof ApiError ? err.message : "Couldn't load nearby places.");
      })
      .finally(() => !cancelled && setLoadingPlaces(false));
    return () => {
      cancelled = true;
    };
  }, [location, tab]);

  return (
    <div className="space-y-6">
      <div>
        <p className="stamp-label border-ink-soft text-ink-soft">Nearby</p>
        <h1 className="mt-3 font-display text-3xl text-ink">Vets and shelters</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft">
          Live results near your current location, powered by OpenStreetMap data.
        </p>
      </div>

      <div className="flex gap-0.5">
        <button
          onClick={() => setTab("vet")}
          className={cn(
            "border px-4 py-2 font-mono text-xs uppercase tracking-wide",
            tab === "vet" ? "border-leather bg-paper-raised text-ink" : "border-rule text-ink-soft hover:bg-paper-raised"
          )}
        >
          Nearby vets
        </button>
        <button
          onClick={() => setTab("shelter")}
          className={cn(
            "border px-4 py-2 font-mono text-xs uppercase tracking-wide",
            tab === "shelter" ? "border-leather bg-paper-raised text-ink" : "border-rule text-ink-soft hover:bg-paper-raised"
          )}
        >
          Shelters
        </button>
      </div>

      {location.status === "locating" && (
        <div className="flex items-center gap-2 border border-rule bg-paper-raised px-4 py-3 text-sm text-ink-soft">
          <LocateFixed size={15} className="animate-pulse text-leather" />
          Finding your location…
        </div>
      )}

      {location.status === "denied" && (
        <div className="flex items-start gap-2 border border-clay/50 bg-clay/5 px-4 py-3 text-sm text-ink-soft">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-clay" />
          Location access was denied, so nearby results can't be shown. Allow location access in your
          browser's site settings and reload this page.
        </div>
      )}

      {location.status === "error" && (
        <div className="flex items-start gap-2 border border-stamp-red/40 bg-stamp-red/5 px-4 py-3 text-sm text-stamp-red">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {location.message}
        </div>
      )}

      {placesError && (
        <div className="flex items-start gap-2 border border-stamp-red/40 bg-stamp-red/5 px-4 py-3 text-sm text-stamp-red">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <div>
            <p>{placesError}</p>
            {placesError.includes("GEOAPIFY_API_KEY") && (
              <p className="mt-1 text-xs text-ink-soft">
                Add a free Geoapify API key to your .env file — see server/places.js for the exact steps.
              </p>
            )}
          </div>
        </div>
      )}

      {location.status === "ready" && (
        <PlacesMap center={{ lat: location.lat, lon: location.lon }} places={places} />
      )}

      {loadingPlaces ? (
        <p className="font-mono text-xs text-ink-soft">Loading nearby {tab === "vet" ? "vets" : "shelters"}…</p>
      ) : location.status === "ready" && places.length === 0 && !placesError ? (
        <EmptyState message={`No ${tab === "vet" ? "vets" : "shelters"} found nearby.`} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {places.map((place) => (
            <div key={place.id} className="border border-rule bg-paper-raised p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-lg text-ink">{place.name}</p>
                {place.rating && (
                  <span className="flex shrink-0 items-center gap-1 font-mono text-xs text-ink-soft">
                    <Star size={13} className="text-clay" fill="currentColor" />
                    {place.rating}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-soft">{place.address}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 font-mono text-xs text-ink-soft">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {place.distance}
                </span>
                {place.phone && (
                  <a href={`tel:${place.phone}`} className="flex items-center gap-1 hover:text-ink">
                    <Phone size={13} /> {place.phone}
                  </a>
                )}
                {place.website && (
                  <a href={place.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink">
                    <Globe size={13} /> Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
