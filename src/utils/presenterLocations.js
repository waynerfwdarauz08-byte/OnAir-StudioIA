const EDITORIAL_LOCATION_TYPES = {
  work: "work",
  trabajo: "work",
  studio: "studio",
  estudio: "studio",
  coverage: "coverage",
  cobertura: "coverage",
};

export const PUBLIC_COVERAGE_SITES = [
  {
    id: "national-theatre",
    latitude: 9.9335,
    longitude: -84.0767,
    type: "coverage",
    labels: {
      es: "Teatro Nacional de Costa Rica, San José",
      en: "National Theatre of Costa Rica, San José",
    },
  },
  {
    id: "national-stadium",
    latitude: 9.9364,
    longitude: -84.1037,
    type: "coverage",
    labels: {
      es: "Estadio Nacional, San José",
      en: "National Stadium, San José",
    },
  },
  {
    id: "convention-centre",
    latitude: 10.0032,
    longitude: -84.2088,
    type: "coverage",
    labels: {
      es: "Centro de Convenciones de Costa Rica, Heredia",
      en: "Costa Rica Convention Center, Heredia",
    },
  },
];

function getCoordinate(value, minimum, maximum) {
  if (
    value === null ||
    value === undefined ||
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return null;
  }

  const coordinate = Number(value);

  return Number.isFinite(coordinate) &&
    coordinate >= minimum &&
    coordinate <= maximum
    ? coordinate
    : null;
}

function getEditorialLocationType(value) {
  if (typeof value !== "string") {
    return "";
  }

  const type = value.trim().toLowerCase();
  return Object.hasOwn(EDITORIAL_LOCATION_TYPES, type)
    ? EDITORIAL_LOCATION_TYPES[type]
    : "";
}

export function normalizeEditorialLocation(location) {
  if (!location || typeof location !== "object") {
    return null;
  }

  const latitude = getCoordinate(location.latitude, -90, 90);
  const longitude = getCoordinate(location.longitude, -180, 180);
  const label =
    typeof location.label === "string"
      ? location.label.trim()
      : "";
  const type = getEditorialLocationType(location.type);

  if (
    latitude === null ||
    longitude === null ||
    !label ||
    label.length > 160 ||
    (location.isSimulated !== undefined && typeof location.isSimulated !== "boolean") ||
    !type
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    label,
    type,
    isSimulated: location.isSimulated === true,
  };
}

export function getRegisteredEditorialLocation(location) {
  const normalizedLocation = normalizeEditorialLocation(location);

  return normalizedLocation && !normalizedLocation.isSimulated
    ? normalizedLocation
    : null;
}

export function getSimulatedEditorialLocation(location) {
  const normalizedLocation = normalizeEditorialLocation(location);

  return normalizedLocation?.isSimulated
    ? normalizedLocation
    : null;
}

function getPublicCoverageSite(location) {
  return PUBLIC_COVERAGE_SITES.find(
    (site) =>
      site.latitude === location.latitude &&
      site.longitude === location.longitude &&
      site.type === location.type
  );
}

export function getPublicCoverageSimulation(location) {
  const simulatedLocation = getSimulatedEditorialLocation(location);

  return simulatedLocation && getPublicCoverageSite(simulatedLocation)
    ? simulatedLocation
    : null;
}

export function resolvePresenterEditorialLocation(
  savedLocation,
  sessionSimulation
) {
  const registeredLocation =
    getRegisteredEditorialLocation(savedLocation);

  if (registeredLocation) {
    return {
      ...registeredLocation,
      source: "registered",
    };
  }

  const currentSessionSimulation =
    getPublicCoverageSimulation(sessionSimulation);

  if (currentSessionSimulation) {
    return {
      ...currentSessionSimulation,
      source: "simulated-session",
    };
  }

  const savedSimulation =
    getPublicCoverageSimulation(savedLocation);

  return savedSimulation
    ? {
        ...savedSimulation,
        source: "simulated-saved",
      }
    : null;
}

export function createCoverageSimulation(optionId, language) {
  const coverageSite = PUBLIC_COVERAGE_SITES.find(
    (site) => site.id === optionId
  );

  if (!coverageSite) {
    return null;
  }

  return {
    latitude: coverageSite.latitude,
    longitude: coverageSite.longitude,
    label: coverageSite.labels[language === "en" ? "en" : "es"],
    type: coverageSite.type,
    isSimulated: true,
  };
}

export function getSimulationLocationLabel(location, language) {
  const simulatedLocation = getPublicCoverageSimulation(location);

  if (!simulatedLocation) {
    return "";
  }

  const coverageSite = getPublicCoverageSite(simulatedLocation);

  return coverageSite
    ? coverageSite.labels[language === "en" ? "en" : "es"]
    : simulatedLocation.label;
}

export function getEditorialLocationTypeLabel(type, language) {
  const labels = {
    work: {
      es: "Trabajo",
      en: "Work",
    },
    studio: {
      es: "Estudio",
      en: "Studio",
    },
    coverage: {
      es: "Cobertura",
      en: "Coverage",
    },
  };

  return (
    labels[type]?.[language === "en" ? "en" : "es"] ||
    ""
  );
}
