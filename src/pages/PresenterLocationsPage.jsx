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
import {
  createCoverageSimulation,
  getEditorialLocationTypeLabel,
  getPublicCoverageSimulation,
  getSimulationLocationLabel,
  PUBLIC_COVERAGE_SITES,
  resolvePresenterEditorialLocation,
} from "../utils/presenterLocations.js";

const SESSION_STORAGE_KEY =
  "onair-presenter-location-simulations";

function readSessionSimulations() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedLocations = window.sessionStorage.getItem(
      SESSION_STORAGE_KEY
    );

    if (!storedLocations) {
      return {};
    }

    const parsedLocations = JSON.parse(storedLocations);

    if (
      !parsedLocations ||
      typeof parsedLocations !== "object" ||
      Array.isArray(parsedLocations)
    ) {
      return {};
    }

    return Object.entries(parsedLocations).reduce(
      (validLocations, [presenterId, location]) => {
        const simulatedLocation =
          getPublicCoverageSimulation(location);

        if (simulatedLocation) {
          validLocations[presenterId] = simulatedLocation;
        }

        return validLocations;
      },
      {}
    );
  } catch {
    return {};
  }
}

function saveSessionSimulations(locations) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(locations)
    );
  } catch {
    // La simulación sigue disponible mientras la página esté abierta.
  }
}

function getGoogleMapsEmbedUrl(location, language) {
  const coordinates = `${location.latitude},${location.longitude}`;

  return `https://www.google.com/maps?q=${encodeURIComponent(
    coordinates
  )}&z=13&output=embed&hl=${language === "en" ? "en" : "es"}`;
}

function getGoogleMapsUrl(location, language) {
  const coordinates = `${location.latitude},${location.longitude}`;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    coordinates
  )}&hl=${language === "en" ? "en" : "es"}`;
}

function getLocationStatus(location) {
  if (!location) {
    return "pending";
  }

  return location.source === "registered"
    ? "registered"
    : "simulated";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [simulatedLocations, setSimulatedLocations] =
    useState(readSessionSimulations);
  const [simulationOptions, setSimulationOptions] =
    useState({});
  const [sessionNotice, setSessionNotice] = useState(null);

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
          loadError?.name !== "AbortError"
        ) {
          setError(
            typeof loadError?.message === "string" &&
              loadError.message.trim()
              ? loadError.message.trim()
              : "request_failed"
          );
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
          mapLocation: resolvePresenterEditorialLocation(
            user.location,
            simulatedLocations[user.id]
          ),
        })),
    [simulatedLocations, users]
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visiblePresenters = presenters.filter((presenter) =>
    [presenter.name, presenter.email].some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  );

  const selectedPresenter =
    visiblePresenters.find(
      (presenter) => presenter.id === selectedPresenterId
    ) || visiblePresenters[0] || null;

  const selectedLocation = selectedPresenter?.mapLocation || null;
  const registeredPresenters = presenters.filter(
    (presenter) =>
      getLocationStatus(presenter.mapLocation) === "registered"
  ).length;
  const simulatedPresenters = presenters.filter(
    (presenter) =>
      getLocationStatus(presenter.mapLocation) === "simulated"
  ).length;
  const pendingPresenters =
    presenters.length -
    registeredPresenters -
    simulatedPresenters;
  const selectedSimulationOption = selectedPresenter
    ? simulationOptions[selectedPresenter.id] || ""
    : "";
  const errorMessage = isEnglish
    ? "The presenter directory could not be loaded."
    : "No fue posible cargar el directorio de presentadores.";
  const technicalErrorMessage =
    error === "request_failed"
      ? isEnglish
        ? "The client did not provide additional error details."
        : "El cliente no proporcionó detalles adicionales del error."
      : error;
  const sessionNoticeText =
    sessionNotice?.type === "added"
      ? isEnglish
        ? `Coverage simulation added for ${sessionNotice.presenterName}.`
        : `Se agregó una simulación de cobertura para ${sessionNotice.presenterName}.`
      : sessionNotice?.type === "removed"
        ? isEnglish
          ? `Coverage simulation removed for ${sessionNotice.presenterName}.`
          : `Se eliminó la simulación de cobertura de ${sessionNotice.presenterName}.`
        : "";

  function handleSimulateCoverage(event) {
    event.preventDefault();

    if (!selectedPresenter || !selectedSimulationOption) {
      return;
    }

    const simulatedLocation = createCoverageSimulation(
      selectedSimulationOption,
      language
    );

    if (!simulatedLocation) {
      return;
    }

    setSimulatedLocations((currentLocations) => {
      const nextLocations = {
        ...currentLocations,
        [selectedPresenter.id]: simulatedLocation,
      };

      saveSessionSimulations(nextLocations);

      return nextLocations;
    });

    setSimulationOptions((currentOptions) => {
      const nextOptions = { ...currentOptions };

      delete nextOptions[selectedPresenter.id];

      return nextOptions;
    });

    setSessionNotice({
      type: "added",
      presenterName: selectedPresenter.name,
    });
  }

  function handleRemoveSimulation() {
    if (!selectedPresenter) {
      return;
    }

    setSimulatedLocations((currentLocations) => {
      const nextLocations = { ...currentLocations };

      delete nextLocations[selectedPresenter.id];
      saveSessionSimulations(nextLocations);

      return nextLocations;
    });

    setSessionNotice({
      type: "removed",
      presenterName: selectedPresenter.name,
    });
  }

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
            ? "Review only explicitly registered work, studio, or coverage locations. Simulations remain in this browser session."
            : "Consulta únicamente ubicaciones registradas explícitamente para trabajo, estudio o cobertura. Las simulaciones se mantienen en esta sesión del navegador."
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
        <>
          <ErrorState
            message={errorMessage}
            onRetry={() =>
              setReloadKey((currentValue) => currentValue + 1)
            }
          />

          <details className="presenter-location-error-detail">
            <summary>
              {isEnglish
                ? "Technical details"
                : "Detalles técnicos"}
            </summary>
            <p>{technicalErrorMessage}</p>
          </details>
        </>
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
            <div className="presenter-location-summary-item">
              <span>
                {isEnglish
                  ? "ACTIVE PRESENTERS"
                  : "PRESENTADORES ACTIVOS"}
              </span>
              <strong>{presenters.length}</strong>
            </div>

            <div className="presenter-location-summary-item is-registered">
              <span>
                {isEnglish
                  ? "REGISTERED"
                  : "REGISTRADAS"}
              </span>
              <strong>{registeredPresenters}</strong>
            </div>

            <div className="presenter-location-summary-item is-simulated">
              <span>
                {isEnglish
                  ? "SIMULATED"
                  : "SIMULADAS"}
              </span>
              <strong>{simulatedPresenters}</strong>
            </div>

            <div className="presenter-location-summary-item is-pending">
              <span>
                {isEnglish
                  ? "PENDING"
                  : "PENDIENTES"}
              </span>
              <strong>{pendingPresenters}</strong>
            </div>

            <p>
              {isEnglish
                ? "Only explicitly editorial locations are shown. Device location is never requested."
                : "Solo se muestran ubicaciones editoriales explícitas. Nunca se solicita la ubicación del dispositivo."}
            </p>
          </header>

          <div className="presenter-location-tools">
            <div className="presenter-location-search">
              <label htmlFor="presenter-location-search">
                {isEnglish
                  ? "Search presenter"
                  : "Buscar presentador"}
              </label>

              <input
                id="presenter-location-search"
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder={
                  isEnglish
                    ? "Name or email"
                    : "Nombre o correo"
                }
              />

              {searchQuery && (
                <button
                  type="button"
                  className="presenter-location-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  {isEnglish ? "Clear" : "Limpiar"}
                </button>
              )}
            </div>

            <p
              className="presenter-location-results"
              role="status"
            >
              {isEnglish
                ? `${visiblePresenters.length} of ${presenters.length} presenters shown`
                : `${visiblePresenters.length} de ${presenters.length} presentadores mostrados`}
            </p>
          </div>

          {sessionNoticeText && (
            <p
              className="presenter-location-session-notice"
              role="status"
            >
              {sessionNoticeText}
            </p>
          )}

          <div className="presenter-locations-layout">
            <div
              className="presenter-location-list"
              role="group"
              aria-labelledby="presenter-location-list-title"
            >
              <h2 id="presenter-location-list-title">
                {isEnglish
                  ? "Presenters"
                  : "Presentadores"}
              </h2>

              {visiblePresenters.length === 0 && (
                <div
                  className="presenter-location-search-empty"
                  role="status"
                >
                  <h3>
                    {isEnglish
                      ? "No matching presenters"
                      : "No hay presentadores coincidentes"}
                  </h3>

                  <p>
                    {isEnglish
                      ? "Try a different name or clear the search."
                      : "Prueba con otro nombre o limpia la búsqueda."}
                  </p>
                </div>
              )}

              {visiblePresenters.map((presenter) => {
                const isSelected =
                  presenter.id === selectedPresenter?.id;
                const locationStatus = getLocationStatus(
                  presenter.mapLocation
                );
                const locationLabel =
                  locationStatus === "simulated"
                    ? getSimulationLocationLabel(
                        presenter.mapLocation,
                        language
                      )
                    : presenter.mapLocation?.label || "";

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
                        {locationLabel ||
                          (isEnglish
                            ? "Editorial location pending"
                            : "Ubicación editorial pendiente")}
                      </span>
                    </span>

                    <span
                      className={`presenter-location-status is-${locationStatus}`}
                    >
                      {locationStatus === "registered"
                        ? isEnglish
                          ? "REGISTERED"
                          : "REGISTRADA"
                        : locationStatus === "simulated"
                          ? isEnglish
                            ? "SIMULATED"
                            : "SIMULADA"
                          : isEnglish
                            ? "PENDING"
                            : "PENDIENTE"}
                    </span>
                  </button>
                );
              })}
            </div>

            <article
              className="presenter-map-card"
              aria-live="polite"
              aria-atomic="true"
            >
              {selectedPresenter ? (
                selectedLocation ? (
                  <>
                    <header className="presenter-map-heading">
                      <div>
                        <p className="eyebrow">
                          {selectedLocation.source === "registered"
                            ? isEnglish
                              ? "REGISTERED EDITORIAL LOCATION"
                              : "UBICACIÓN EDITORIAL REGISTRADA"
                            : isEnglish
                              ? "SIMULATED COVERAGE"
                              : "COBERTURA SIMULADA"}
                        </p>

                        <h2>{selectedPresenter.name}</h2>

                        <p className="presenter-map-location-label">
                          {selectedLocation.source !== "registered"
                            ? getSimulationLocationLabel(
                                selectedLocation,
                                language
                              )
                            : selectedLocation.label}
                        </p>

                        <span className="presenter-map-type">
                          {getEditorialLocationTypeLabel(
                            selectedLocation.type,
                            language
                          )}
                        </span>
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
                            ? `Editorial location map for ${selectedPresenter.name}`
                            : `Mapa de ubicación editorial para ${selectedPresenter.name}`
                        }
                        src={getGoogleMapsEmbedUrl(
                          selectedLocation,
                          language
                        )}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    </div>

                    <footer className="presenter-map-footer">
                      <span
                        className={`presenter-map-source ${
                          selectedLocation.source === "registered"
                            ? "is-registered"
                            : "is-simulated"
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M12 21s7-6.03 7-12A7 7 0 1 0 5 9c0 5.97 7 12 7 12Z" />
                          <circle cx="12" cy="9" r="2.25" />
                        </svg>
                        {selectedLocation.source === "registered"
                          ? isEnglish
                            ? "Registered editorial location"
                            : "Ubicación editorial registrada"
                          : selectedLocation.source === "simulated-session"
                            ? isEnglish
                              ? "Simulated in this browser session"
                              : "Simulada en esta sesión del navegador"
                            : isEnglish
                              ? "Saved simulation at a public site"
                              : "Simulación guardada en un sitio público"}
                      </span>

                      <div className="presenter-map-actions">
                        {selectedLocation.source === "simulated-session" && (
                          <button
                            type="button"
                            className="button button-secondary presenter-map-remove-button"
                            onClick={handleRemoveSimulation}
                          >
                            {isEnglish
                              ? "Remove simulation"
                              : "Quitar simulación"}
                          </button>
                        )}

                        <a
                          href={getGoogleMapsUrl(
                            selectedLocation,
                            language
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="text-link"
                        >
                          {isEnglish
                            ? "Open in Google Maps"
                            : "Abrir en Google Maps"}
                        </a>
                      </div>
                    </footer>
                  </>
                ) : (
                  <div className="presenter-map-pending">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M12 21s7-6.03 7-12A7 7 0 1 0 5 9c0 5.97 7 12 7 12Z" />
                      <circle cx="12" cy="9" r="2.25" />
                    </svg>

                    <p className="eyebrow">
                      {isEnglish
                        ? "EDITORIAL LOCATION PENDING"
                        : "UBICACIÓN EDITORIAL PENDIENTE"}
                    </p>

                    <h2>{selectedPresenter.name}</h2>

                    <p>
                      {isEnglish
                        ? "No work, studio, or coverage location has been explicitly registered for this presenter."
                        : "No se ha registrado explícitamente una ubicación de trabajo, estudio o cobertura para este presentador."}
                    </p>

                    <div className="presenter-location-simulation">
                      <div>
                        <span>
                          {isEnglish
                            ? "SIMULATE COVERAGE"
                            : "SIMULAR COBERTURA"}
                        </span>

                        <p>
                          {isEnglish
                            ? "Choose a public editorial site. This change is only stored for this browser session."
                            : "Elige un sitio editorial público. Este cambio solo se guarda durante esta sesión del navegador."}
                        </p>
                      </div>

                      <form onSubmit={handleSimulateCoverage}>
                        <label htmlFor="presenter-coverage-site">
                          {isEnglish
                            ? "Public editorial site"
                            : "Sitio editorial público"}
                        </label>

                        <select
                          id="presenter-coverage-site"
                          value={selectedSimulationOption}
                          onChange={(event) =>
                            setSimulationOptions((currentOptions) => ({
                              ...currentOptions,
                              [selectedPresenter.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">
                            {isEnglish
                              ? "Select a site"
                              : "Selecciona un sitio"}
                          </option>

                          {PUBLIC_COVERAGE_SITES.map((site) => (
                            <option key={site.id} value={site.id}>
                              {site.labels[
                                isEnglish ? "en" : "es"
                              ]}
                            </option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          className="button button-primary"
                          disabled={!selectedSimulationOption}
                        >
                          {isEnglish
                            ? "Simulate coverage"
                            : "Simular cobertura"}
                        </button>
                      </form>
                    </div>
                  </div>
                )
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
                      ? "No presenter selected"
                      : "No hay un presentador seleccionado"}
                  </h2>

                  <p>
                    {isEnglish
                      ? "Clear or adjust the search to select a presenter."
                      : "Limpia o ajusta la búsqueda para seleccionar un presentador."}
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
