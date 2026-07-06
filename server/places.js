// ─────────────────────────────────────────────────────────────────────────
// GEOAPIFY CONFIGURATION — EDIT THIS SECTION (or set in your .env file)
// ─────────────────────────────────────────────────────────────────────────
// Powers the "Vets & shelters" page with real, live nearby results.
// Geoapify's Places API has a free tier (3,000 requests/day, no credit
// card required): https://myprojects.geoapify.com/
//
// 1. Sign up at https://myprojects.geoapify.com/
// 2. Create a project, copy the API key it generates
// 3. Put it in your .env file at the project root:
//
//   GEOAPIFY_API_KEY=your_key_here
//
// Without a key set, this endpoint returns a clear error to the frontend
// instead of silently failing, so it's obvious during a demo what to fix.
// ─────────────────────────────────────────────────────────────────────────
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || "";
const GEOAPIFY_URL = "https://api.geoapify.com/v2/places";

const CATEGORY_BY_TYPE = {
  vet: "pet.veterinary",
  shelter: "pet.animal_shelter",
};

export async function findNearbyPlaces({ lat, lon, type, radiusMeters = 8000 }) {
  if (!GEOAPIFY_API_KEY) {
    const err = new Error(
      "No Geoapify API key configured. Add GEOAPIFY_API_KEY to your .env file — see server/places.js for setup instructions."
    );
    err.code = "NO_API_KEY";
    throw err;
  }

  const categories = CATEGORY_BY_TYPE[type];
  if (!categories) throw new Error(`Unknown place type: ${type}`);

  const params = new URLSearchParams({
    categories,
    filter: `circle:${lon},${lat},${radiusMeters}`,
    bias: `proximity:${lon},${lat}`,
    limit: "20",
    apiKey: GEOAPIFY_API_KEY,
  });

  const res = await fetch(`${GEOAPIFY_URL}?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Geoapify request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();

  return (data.features || []).map((f) => {
    const p = f.properties;
    const distanceMeters = p.distance ?? null;
    return {
      id: p.place_id,
      name: p.name || (type === "vet" ? "Veterinary clinic" : "Animal shelter"),
      type,
      address: p.formatted || [p.address_line1, p.address_line2].filter(Boolean).join(", "),
      distance:
        distanceMeters == null
          ? "—"
          : distanceMeters < 1000
          ? `${Math.round(distanceMeters)} m`
          : `${(distanceMeters / 1609.34).toFixed(1)} mi`,
      lat: f.geometry?.coordinates?.[1] ?? null,
      lon: f.geometry?.coordinates?.[0] ?? null,
      // Geoapify's free Places dataset (OpenStreetMap) does not include
      // ratings or phone numbers consistently, so these are surfaced only
      // when present rather than faked.
      rating: null,
      phone: p.contact?.phone || p.datasource?.raw?.phone || null,
      website: p.website || p.datasource?.raw?.website || null,
    };
  });
}
