export const PUBLIC_REPORTING_SITES = [
  { id: "theatre", es: "Teatro Nacional, San José", en: "National Theatre, San José", latitude: 9.9335, longitude: -84.0767 },
  { id: "stadium", es: "Estadio Nacional, San José", en: "National Stadium, San José", latitude: 9.9364, longitude: -84.1037 },
  { id: "convention", es: "Centro de Convenciones, Heredia", en: "Convention Center, Heredia", latitude: 10.0032, longitude: -84.2088 },
  { id: "alajuela", es: "Centro público de Alajuela", en: "Alajuela public center", latitude: 10.0162, longitude: -84.2116 },
  { id: "cartago", es: "Centro público de Cartago", en: "Cartago public center", latitude: 9.8644, longitude: -83.9194 },
  { id: "puntarenas", es: "Centro público de Puntarenas", en: "Puntarenas public center", latitude: 9.9763, longitude: -84.8384 },
  { id: "liberia", es: "Centro público de Liberia", en: "Liberia public center", latitude: 10.6333, longitude: -85.4333 },
  { id: "limon", es: "Centro público de Limón", en: "Limón public center", latitude: 9.9907, longitude: -83.0357 },
];

export function validCoordinates(location) {
  return location?.latitude !== "" && location?.longitude !== "" && location?.latitude != null && location?.longitude != null && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)) && Math.abs(Number(location.latitude)) <= 90 && Math.abs(Number(location.longitude)) <= 180;
}

export function estimateTrip(origin, destination, speedKmh = 50) {
  if (!validCoordinates(origin) || !validCoordinates(destination) || !Number.isFinite(Number(speedKmh)) || Number(speedKmh) <= 0) return null;
  const rad = (value) => Number(value) * Math.PI / 180;
  const dLat = rad(Number(destination.latitude) - Number(origin.latitude));
  const dLng = rad(Number(destination.longitude) - Number(origin.longitude));
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(origin.latitude)) * Math.cos(rad(destination.latitude)) * Math.sin(dLng / 2) ** 2;
  const straightKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadKm = straightKm * 1.3;
  return { straightKm: Math.round(straightKm), roadKm: Math.round(roadKm), minutes: Math.max(5, Math.ceil((roadKm / Number(speedKmh) * 60) / 5) * 5) };
}
