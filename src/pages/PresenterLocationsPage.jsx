import {
  useEffect,
  useMemo,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import useAccessibility from "../hooks/useAccessibility.js";
import { userService } from "../services/userService.js";
import { ROLES } from "../utils/roles.js";

const REFERENCE_LOCATIONS = {
  "user-presenter-001": {
    latitude: 9.9281,
    longitude: -84.0907,
    label: "San José, Costa Rica",
  },
  "lxbPRO13z-I": {
    latitude: 10.0163,
    longitude: -84.2116,
    label: "Alajuela, Costa Rica",
  },
  "BGBDrMcaENY": {
    latitude: 9.8644,
    longitude: -83.9194,
    label: "Cartago, Costa Rica",
  },
};

function getLocationFromUser(user) {
  const savedLocation = user.location || {};
  const latitude = Number(
    savedLocation.latitude ?? user.latitude
  );
  const longitude = Number(
    savedLocation.longitude ?? user.longitude
  );

  if (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  ) {
    return {
      latitude,
      longitude,
      label: savedLocation.label || user.locationLabel || "",
      isReference: false,
    };
  }

  const referenceLocation = REFERENCE_LOCATIONS[user.id];

  return referenceLocation
    ? {
        ...referenceLocation,
        isReference: true,
      }
    : null;
}

function getGoogleMapsEmbedUrl(location) {
  const coordinates = `${location.latitude},${location.longitude}`;

  return `https://www.google.com/maps?q=${encodeURIComponent(
    coordinates
  )}&z=13&output=embed`;
}

function getGoogleMapsUrl(location) {
  const coordinates = `${location.latitude},${location.longitude}`;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    coordinates
  )}`;
}

function PresenterLocationsPage() {
  const { language } = useAccessibility();
  const isEnglish = language === "en";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedPresenterId, setSelectedPresenterId] =
    useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadPresenters() {
      setLoading(true);
      setError("");

      try {
        const userData = await userService.getAll(
          controller.signal
        );

        if (!controller.signal.aborted) {
          setUsers(Array.isArray(userData) ? userData : []);
        }
      } catch (loadError) {
        if (
          !controller.signal.aborted &&
          loadError.name !== "AbortError"
        ) {
          setError(loadError.message || "");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadPresenters();

    return () => controller.abort();
  }, [reloadKey]);

  const presenters = useMemo(
    () =>
      users
        .filter(
          (user) =>
            user.role === ROLES.PRESENTER && user.active
        )
        .map((user) => ({
          ...user,
          mapLocation: getLocationFromUser(user),
        })),
    [users]
  );

  const selectedPresenter =
    presenters.find(
      (presenter) => presenter.id === selectedPresenterId
    ) || presenters[0] || null;

  const selectedLocation = selectedPresenter?.mapLocation || null;
  const mappedPresenters = presenters.filter(
    (presenter) => presenter.mapLocation
  ).length;

  const errorMessage =
    error ||
    (isEnglish
      ? "The presenter directory could not be loaded."
      : "No fue posible cargar el directorio de presentadores.");

  return (
    <>
      <PageHeader
        eyebrow={
          isEnglish
            ? "PRESENTER LOCATIONS"
            : "UBICACIÓN DE PRESENTADORES"
        }
        title={
          isEnglish
            ? "Presenter location map"
            : "Mapa de ubicación de presentadores"
        }
        description={
          isEnglish
            ? "Review the reference location assigned to each active presenter from one administrator view."
            : "Consulta la ubicación de referencia asignada a cada presentador activo desde una sola vista administrativa."
        }
      />

      {loading && (
        <LoadingState
          message={
            isEnglish
              ? "Loading presenter locations..."
              : "Cargando ubicaciones de presentadores..."
          }
        />
      )}

      {!loading && error && (
        <ErrorState
          message={errorMessage}
          onRetry={() =>
            setReloadKey((currentValue) => currentValue + 1)
          }
        />
      )}

      {!loading && !error && presenters.length === 0 && (
        <EmptyState
          title={
            isEnglish
              ? "No active presenters"
              : "No hay presentadores activos"
          }
          description={
            isEnglish
              ? "Active presenter accounts will appear here when they are available."
              : "Las cuentas de presentadores activas aparecerán aquí cuando estén disponibles."
          }
        />
      )}

      {!loading && !error && presenters.length > 0 && (
        <section
          className="presenter-locations"
          aria-label={
            isEnglish
              ? "Presenter location workspace"
              : "Espacio de ubicaciones de presentadores"
          }
        >
          <header className="presenter-locations-summary">
            <div>
              <span>
                {isEnglish
                  ? "ACTIVE PRESENTERS"
                  : "PRESENTADORES ACTIVOS"}
              </span>
              <strong>{presenters.length}</strong>
            </div>

            <div>
              <span>
                {isEnglish
                  ? "MAP REFERENCES"
                  : "REFERENCIAS EN MAPA"}
              </span>
              <strong>{mappedPresenters}</strong>
            </div>

            <p>
              {isEnglish
                ? "Reference locations are displayed in this client-side view; no location data is collected or saved."
                : "Las ubicaciones de referencia se muestran solo en esta vista del cliente; no se recopilan ni guardan datos de ubicación."}
            </p>
          </header>

          <div className="presenter-locations-layout">
            <div
              className="presenter-location-list"
              aria-label={
                isEnglish
                  ? "Select a presenter"
                  : "Selecciona un presentador"
              }
            >
              {presenters.map((presenter) => {
                const isSelected =
                  presenter.id === selectedPresenter?.id;
                const hasLocation = Boolean(
                  presenter.mapLocation
                );

                return (
                  <button
                    key={presenter.id}
                    type="button"
                    className={`presenter-location-card ${
                      isSelected ? "is-selected" : ""
                    }`}
                    onClick={() =>
                      setSelectedPresenterId(presenter.id)
                    }
                    aria-pressed={isSelected}
                  >
                    <span
                      className="presenter-location-avatar"
                      aria-hidden="true"
                    >
                      {presenter.name
                        ?.trim()
                        .charAt(0)
                        .toUpperCase() || "P"}
                    </span>

                    <span className="presenter-location-card-content">
                      <strong>{presenter.name}</strong>

                      <span>
                        {hasLocation
                          ? presenter.mapLocation.label ||
                            (isEnglish
                              ? "Location available"
                              : "Ubicación disponible")
                          : isEnglish
                            ? "Location unavailable"
                            : "Ubicación no disponible"}
                      </span>
                    </span>

                    <span
                      className={`presenter-location-status ${
                        hasLocation ? "is-available" : "is-unavailable"
                      }`}
                    >
                      {hasLocation
                        ? isEnglish
                          ? "MAP"
                          : "MAPA"
                        : isEnglish
                          ? "PENDING"
                          : "PENDIENTE"}
                    </span>
                  </button>
                );
              })}
            </div>

            <article className="presenter-map-card">
              {selectedPresenter && selectedLocation ? (
                <>
                  <header className="presenter-map-heading">
                    <div>
                      <p className="eyebrow">
                        {selectedLocation.isReference
                          ? isEnglish
                            ? "REFERENCE MAP"
                            : "MAPA DE REFERENCIA"
                          : isEnglish
                            ? "PRESENTER LOCATION"
                            : "UBICACIÓN DEL PRESENTADOR"}
                      </p>

                      <h2>{selectedPresenter.name}</h2>

                      <p>{selectedLocation.label}</p>
                    </div>

                    <span className="presenter-map-coordinates">
                      {selectedLocation.latitude.toFixed(4)}, {" "}
                      {selectedLocation.longitude.toFixed(4)}
                    </span>
                  </header>

                  <div className="presenter-map-frame">
                    <iframe
                      title={
                        isEnglish
                          ? `Map reference for ${selectedPresenter.name}`
                          : `Mapa de referencia para ${selectedPresenter.name}`
                      }
                      src={getGoogleMapsEmbedUrl(selectedLocation)}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>

                  <footer className="presenter-map-footer">
                    <span>
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M12 21s7-6.03 7-12A7 7 0 1 0 5 9c0 5.97 7 12 7 12Z" />
                        <circle cx="12" cy="9" r="2.25" />
                      </svg>
                      {selectedLocation.isReference
                        ? isEnglish
                          ? "Reference location"
                          : "Ubicación de referencia"
                        : isEnglish
                          ? "Available location"
                          : "Ubicación disponible"}
                    </span>

                    <a
                      href={getGoogleMapsUrl(selectedLocation)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-link"
                    >
                      {isEnglish
                        ? "Open in Google Maps"
                        : "Abrir en Google Maps"}
                    </a>
                  </footer>
                </>
              ) : (
                <div className="presenter-map-unavailable">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M12 21s7-6.03 7-12A7 7 0 1 0 5 9c0 5.97 7 12 7 12Z" />
                    <circle cx="12" cy="9" r="2.25" />
                  </svg>

                  <h2>
                    {isEnglish
                      ? "Location unavailable"
                      : "Ubicación no disponible"}
                  </h2>

                  <p>
                    {isEnglish
                      ? "A map reference has not been assigned to this presenter."
                      : "A este presentador aún no se le ha asignado una referencia en el mapa."}
                  </p>
                </div>
              )}
            </article>
          </div>
        </section>
      )}
    </>
  );
}

export default PresenterLocationsPage;
