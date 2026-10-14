/*
 * Straight-line distance between two GPS points, in meters (Haversine
 * formula). Used to check a guest's reported location against the café's
 * fixed coordinates before letting them place an order.
 */
export function distanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/*
 * Café's fixed coordinates + how far (in meters) a guest may be from them
 * and still order. Set CAFE_LAT / CAFE_LNG in .env to your real coordinates
 * — an easy way to find them is to open Google Maps, right-click your café,
 * and copy the lat,lng shown at the top of the context menu.
 *
 * If CAFE_LAT/CAFE_LNG are not set, location checks are skipped entirely
 * (rather than blocking every guest due to a missing config value).
 */
export const CAFE_LAT = process.env.CAFE_LAT ? parseFloat(process.env.CAFE_LAT) : null;
export const CAFE_LNG = process.env.CAFE_LNG ? parseFloat(process.env.CAFE_LNG) : null;
export const MAX_ORDER_DISTANCE_M = process.env.MAX_ORDER_DISTANCE_M
  ? parseFloat(process.env.MAX_ORDER_DISTANCE_M)
  : 150; // ~150m default radius — covers the building + a bit of margin (GPS drift)

export const locationCheckEnabled = CAFE_LAT !== null && CAFE_LNG !== null;

/*
 * Validates a guest-submitted location against the café's coordinates.
 * Returns { ok: true } or { ok: false, status, message } for the caller to
 * respond with directly.
 */
export function verifyGuestLocation(latitude, longitude) {
  if (!locationCheckEnabled) return { ok: true }; // not configured — skip

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return {
      ok: false,
      status: 400,
      message: "Location is required to place an order. Please enable location access and try again.",
    };
  }

  const distance = distanceInMeters(lat, lng, CAFE_LAT, CAFE_LNG);
  if (distance > MAX_ORDER_DISTANCE_M) {
    return {
      ok: false,
      status: 403,
      message: "You must be at the café to place an order.",
    };
  }

  return { ok: true };
}
