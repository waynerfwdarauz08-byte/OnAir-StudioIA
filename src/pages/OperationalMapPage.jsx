import { useEffect, useMemo, useRef, useState } from "react";
import useTranslation from "../hooks/useTranslation.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import PageHeader from "../components/common/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/common/FeedbackStates.jsx";
import useAccessibility from "../hooks/useAccessibility.js";
import { userService } from "../services/userService.js";
import { operationalMapService } from "../services/operationalMapService.js";
import { estimateTrip, PUBLIC_REPORTING_SITES, validCoordinates } from "../utils/operationalMap.js";
import { ROLES } from "../utils/roles.js";

const STATUS = {
  pending: { es: "Pendiente", en: "Pending" },
  assigned: { es: "Presentador asignado", en: "Presenter assigned" },
  en_route: { es: "En traslado", en: "En route" },
  on_site: { es: "Reportaje en sitio", en: "On site" },
};

function mapIcon(kind, selected) {
  return L.divIcon({
    className: "operational-marker-wrap",
    html: `<span class="operational-marker operational-marker--${kind}${selected ? " is-selected" : ""}" aria-hidden="true">${kind === "headquarters" ? "H" : kind === "presenter" ? "P" : "S"}</span>`,
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
}

function OperationalMap({ headquarters, incidents, selectedId, setSelectedId, language, selectHeadquarters, draftPoint, onPointSelected }) {
  const container = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  const initialized = useRef(false);
  const onPointSelectedRef = useRef(onPointSelected);

  useEffect(() => { onPointSelectedRef.current = onPointSelected; }, [onPointSelected]);

  useEffect(() => {
    if (!container.current || map.current) return;
    map.current = L.map(container.current, { scrollWheelZoom: false }).setView([9.9, -84.1], 8);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    map.current.on("click", (event) => onPointSelectedRef.current(event.latlng));
    layer.current = L.layerGroup().addTo(map.current);
    return () => { map.current?.remove(); map.current = null; layer.current = null; initialized.current = false; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const points = [];
    if (validCoordinates(headquarters)) {
      const origin = [Number(headquarters.latitude), Number(headquarters.longitude)];
      points.push(origin);
      L.marker(origin, { icon: mapIcon("headquarters", selectedId === "headquarters"), title: "OnAir Studios", keyboard: true, bubblingMouseEvents: false })
        .on("click", selectHeadquarters).addTo(layer.current);
    }
    incidents.forEach((incident) => {
      if (!validCoordinates(incident)) return;
      const destination = [Number(incident.latitude), Number(incident.longitude)];
      points.push(destination);
      const title = language === "en" && incident.titleEn ? incident.titleEn : incident.title;
      L.marker(destination, { icon: mapIcon("incident", selectedId === incident.id), title, keyboard: true, bubblingMouseEvents: false })
        .on("click", () => setSelectedId(incident.id)).addTo(layer.current);
      if (incident.presenterId) {
        L.marker(destination, { icon: mapIcon("presenter", selectedId === incident.id), title: language === "en" ? `Assigned presenter: ${title}` : `Presentador asignado: ${title}`, keyboard: true, bubblingMouseEvents: false })
          .on("click", () => setSelectedId(incident.id)).addTo(layer.current);
      }
      if (selectedId === incident.id && validCoordinates(headquarters)) {
        L.polyline([[Number(headquarters.latitude), Number(headquarters.longitude)], destination], {
          color: "#7148d4", weight: 3, dashArray: "7 8", opacity: 0.85,
        }).addTo(layer.current);
      }
    });
    if (validCoordinates(draftPoint)) {
      L.marker([Number(draftPoint.latitude), Number(draftPoint.longitude)], {
        icon: mapIcon("draft", false), title: language === "en" ? "Selected simulation point" : "Punto de simulación seleccionado", keyboard: true,
      }).addTo(layer.current);
    }
    if (!initialized.current && points.length) {
      map.current.fitBounds(L.latLngBounds(points).pad(0.18), { maxZoom: 12 });
      initialized.current = true;
    } else {
      const incident = incidents.find((item) => item.id === selectedId);
      if (incident && validCoordinates(incident)) map.current.panTo([Number(incident.latitude), Number(incident.longitude)]);
      else if (selectedId === "headquarters" && validCoordinates(headquarters)) map.current.panTo([Number(headquarters.latitude), Number(headquarters.longitude)]);
    }
  }, [headquarters, incidents, language, selectedId, selectHeadquarters, setSelectedId, draftPoint]);

  return <div className="operational-map" ref={container} role="region" aria-label={language === "en" ? "Interactive Costa Rica operations map" : "Mapa operativo interactivo de Costa Rica"} />;
}

function OperationalMapPage() {
  const { translate } = useTranslation();
  const { language } = useAccessibility();
  const en = language === "en";
  const t = (es, english) => en ? english : es;
  const [settings, setSettings] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState("demo-cultural-coverage");
  const [presenterId, setPresenterId] = useState("");
  const [siteId, setSiteId] = useState("theatre");
  const [draftPoint, setDraftPoint] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [headquartersForm, setHeadquartersForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [editingHeadquarters, setEditingHeadquarters] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      operationalMapService.getSettings(controller.signal),
      operationalMapService.getIncidents(controller.signal),
      userService.getAll(controller.signal),
    ]).then(([settingRows, incidentRows, userRows]) => {
      if (controller.signal.aborted) return;
      const first = settingRows[0] || null;
      setSettings(first);
      setHeadquartersForm(first ? { latitude: String(first.latitude), longitude: String(first.longitude), averageSpeedKmh: String(first.averageSpeedKmh) } : null);
      setIncidents(incidentRows);
      setUsers(userRows);
      setError("");
    }).catch((cause) => {
      if (!controller.signal.aborted && cause.name !== "AbortError") setError(cause.message || "JSON Server");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);

  const presenters = useMemo(() => users.filter((user) => user.role === ROLES.PRESENTER && user.active), [users]);
  const selected = incidents.find((incident) => incident.id === selectedId) || null;
  const occupiedIds = new Set(incidents.filter((incident) => incident.presenterId).map((incident) => incident.presenterId));
  const available = presenters.filter((presenter) => !occupiedIds.has(presenter.id));
  const assignedPresenter = presenters.find((presenter) => presenter.id === selected?.presenterId);
  const selectedSite = PUBLIC_REPORTING_SITES.find((site) => site.id === selected?.siteId);
  const trip = selected ? estimateTrip(settings, selected, settings?.averageSpeedKmh) : null;
  const site = PUBLIC_REPORTING_SITES.find((item) => item.id === siteId);
  const destination = siteId === "custom" ? draftPoint : site;

  async function perform(action, success) {
    setBusy(true); setError(""); setNotice("");
    try {
      await action();
      setNotice(success);
    } catch (cause) { setError(cause.message || "JSON Server"); }
    finally { setBusy(false); }
  }

  function selectHeadquarters() { setSelectedId("headquarters"); setEditingHeadquarters(true); }

  async function createIncident(event) {
    event.preventDefault();
    if (!validCoordinates(destination) || !title.trim()) {
      setError(t("Indica un título y selecciona un sitio o punto del mapa.", "Enter a title and choose a site or map point.")); return;
    }
    await perform(async () => {
      const created = await operationalMapService.createIncident({ title: title.trim(), description: description.trim(), siteId, latitude: destination.latitude, longitude: destination.longitude, status: "pending", presenterId: null, isSimulated: true });
      setIncidents((current) => [...current, created]); setSelectedId(created.id); setTitle(""); setDescription("");
    }, t("Suceso simulado creado.", "Simulated event created."));
  }

  async function saveHeadquarters(event) {
    event.preventDefault();
    if (!validCoordinates(headquartersForm) || !Number.isFinite(Number(headquartersForm.averageSpeedKmh)) || Number(headquartersForm.averageSpeedKmh) < 10 || Number(headquartersForm.averageSpeedKmh) > 130) {
      setError(t("Revisa coordenadas y velocidad (10–130 km/h).", "Check coordinates and speed (10–130 km/h).")); return;
    }
    await perform(async () => {
      const updated = await operationalMapService.updateSettings(settings.id, {
        latitude: Number(headquartersForm.latitude), longitude: Number(headquartersForm.longitude), averageSpeedKmh: Number(headquartersForm.averageSpeedKmh), isSimulated: true,
      });
      setSettings(updated); setEditingHeadquarters(false);
    }, t("Sede simulada actualizada.", "Simulated headquarters updated."));
  }

  async function updateIncident(changes, success) {
    if (!selected) return;
    await perform(async () => {
      const updated = await operationalMapService.updateIncident(selected.id, changes);
      setIncidents((current) => current.map((item) => item.id === updated.id ? updated : item));
      setPresenterId("");
    }, success);
  }

  return <>
    <PageHeader eyebrow={t("COORDINACIÓN SIMULADA", "SIMULATED COORDINATION")} title={t("Mapa operativo", "Operations map")}
      description={t("Planifica coberturas académicas desde OnAir Studios. No se contacta ni rastrea a personas reales.", "Plan academic reporting from OnAir Studios. No real people are contacted or tracked.")} />
    {loading && <LoadingState message={t("Cargando mapa y simulaciones...", "Loading map and simulations...")} />}
    {!loading && error && !settings && <ErrorState message={t("No se pudo conectar con JSON Server.", "Could not connect to JSON Server.")} onRetry={() => { setLoading(true); setReload((value) => value + 1); }} />}
    {!loading && settings && <main className="operational-workspace">
      <div className="operational-map-panel">
        <div className="operational-map-heading"><div><strong>{t("Costa Rica · mapa de cobertura", "Costa Rica · coverage map")}</strong><span>{t("Marcadores y trayecto esquemático; no es una ruta vial.", "Markers and schematic line; not a road route.")}</span></div><span className="operational-simulation-tag">{t("SIMULACIÓN", "SIMULATION")}</span></div>
        <OperationalMap headquarters={settings} incidents={incidents} selectedId={selectedId} setSelectedId={setSelectedId} language={language} selectHeadquarters={selectHeadquarters} draftPoint={siteId === "custom" ? draftPoint : null} onPointSelected={(point) => { setDraftPoint({ latitude: Number(point.lat.toFixed(5)), longitude: Number(point.lng.toFixed(5)) }); setSiteId("custom"); }} />
        <div className="operational-legend"><span><i className="operational-marker operational-marker--headquarters">H</i>{t("Sede", "HQ")}</span><span><i className="operational-marker operational-marker--incident">S</i>{t("Suceso", "Event")}</span><span><i className="operational-marker operational-marker--presenter">P</i>{t("Presentador asignado (destino, no posición real)", "Assigned presenter (destination, not real position)")}</span><span><i className="operational-marker operational-marker--draft">+</i>{t("Punto a crear", "New point")}</span></div>
      </div>
      <div className="operational-side">
        <section className="operational-card">
          <div className="operational-section-heading"><h2>OnAir Studios</h2><button type="button" className="button button-secondary" onClick={selectHeadquarters}>{t("Editar sede", "Edit HQ")}</button></div>
          <p>{t("Sede de demostración en Costa Rica; no representa una dirección real.", "Demo headquarters in Costa Rica; not a real business address.")}</p>
          <p className="operational-coordinate">{settings.latitude}, {settings.longitude}</p>
          {editingHeadquarters && <form className="operational-form" onSubmit={saveHeadquarters}>
            <label>{t("Latitud", "Latitude")}<input type="number" step="any" min="-90" max="90" required value={headquartersForm.latitude} onChange={(event) => setHeadquartersForm({ ...headquartersForm, latitude: event.target.value })} /></label>
            <label>{t("Longitud", "Longitude")}<input type="number" step="any" min="-180" max="180" required value={headquartersForm.longitude} onChange={(event) => setHeadquartersForm({ ...headquartersForm, longitude: event.target.value })} /></label>
            <label>{t("Velocidad media simulada (km/h)", "Simulated average speed (km/h)")}<input type="number" min="10" max="130" required value={headquartersForm.averageSpeedKmh} onChange={(event) => setHeadquartersForm({ ...headquartersForm, averageSpeedKmh: event.target.value })} /></label>
            <div className="operational-actions"><button className="button button-primary" disabled={busy}>{t("Guardar sede", "Save HQ")}</button><button type="button" className="button button-secondary" onClick={() => setEditingHeadquarters(false)}>{t("Cancelar", "Cancel")}</button></div>
          </form>}
        </section>
        <section className="operational-card">
          <h2>{t("Sucesos simulados", "Simulated events")}</h2>
          {incidents.length === 0 && <EmptyState title={t("No hay sucesos", "No events")} description={t("Crea uno para iniciar la simulación.", "Create one to start the simulation.")} />}
          <div className="operational-event-list">{incidents.map((incident) => <button type="button" key={incident.id} className={selectedId === incident.id ? "is-selected" : ""} onClick={() => setSelectedId(incident.id)}><strong>{en && incident.titleEn ? incident.titleEn : incident.title}</strong><small>{STATUS[incident.status]?.[language] || incident.status} · {t("Simulado", "Simulated")}</small></button>)}</div>
          <form className="operational-form" onSubmit={createIncident}>
            <h3>{t("Crear suceso de demostración", "Create demonstration event")}</h3>
            <label>{t("Título", "Title")}<input value={title} maxLength="120" required onChange={(event) => setTitle(event.target.value)} /></label>
            <label>{t("Descripción breve", "Short description")}<textarea value={description} maxLength="300" rows="2" onChange={(event) => setDescription(event.target.value)} /></label>
            <label>{t("Sitio público aproximado", "Approximate public site")}<select value={siteId} onChange={(event) => setSiteId(event.target.value)}>{PUBLIC_REPORTING_SITES.map((item) => <option key={item.id} value={item.id}>{item[language]}</option>)}<option value="custom" disabled={!draftPoint}>{t("Punto seleccionado en el mapa", "Point selected on map")}</option></select></label>
            <small>{t("También puedes pulsar un punto público del mapa. No selecciones domicilios particulares.", "You can also click a public point on the map. Do not select private homes.")}{siteId === "custom" && draftPoint ? ` (${draftPoint.latitude}, ${draftPoint.longitude})` : ""}</small>
            <button className="button button-primary" disabled={busy}>{t("Crear suceso simulado", "Create simulated event")}</button>
          </form>
        </section>
      </div>
      <section className="operational-card operational-detail">
        {!selected && <EmptyState title={t("Selecciona un suceso", "Select an event")} description={t("Elige un marcador o un suceso para ver su planificación.", "Choose a marker or event to see its plan.")} />}
        {selected && <>
          <div className="operational-section-heading"><div><span className="operational-simulation-tag">{t("SUCESO SIMULADO", "SIMULATED EVENT")}</span><h2>{en && selected.titleEn ? selected.titleEn : selected.title}</h2></div><strong className="operational-status">{STATUS[selected.status]?.[language] || selected.status}</strong></div>
          <p>{en && selected.descriptionEn ? selected.descriptionEn : selected.description || t("Sin descripción.", "No description.")}</p>
          <div className="operational-facts"><div><span>{t("Ubicación pública", "Public location")}</span><strong>{selectedSite?.[language] || (validCoordinates(selected) ? t("Punto elegido en el mapa (simulado)", "Map-selected point (simulated)") : t("Ubicación no disponible", "Location unavailable"))}</strong><small>{validCoordinates(selected) ? `${selected.latitude}, ${selected.longitude}` : ""}</small></div><div><span>{t("Distancia aproximada por carretera", "Approximate road distance")}</span><strong>{trip ? `≈ ${trip.roadKm} km` : t("Ubicación no disponible", "Location unavailable")}</strong><small>{trip ? `${t("Línea recta", "Straight line")}: ≈ ${trip.straightKm} km` : ""}</small></div><div><span>{t("Traslado simulado", "Simulated travel")}</span><strong>{trip ? `≈ ${trip.minutes} min` : t("Ubicación no disponible", "Location unavailable")}</strong><small>{t("Sin tráfico ni ruta real", "No traffic or actual route")}</small></div><div><span>{t("Presentador asignado", "Assigned presenter")}</span><strong>{assignedPresenter?.name || t("Ninguno", "None")}</strong><small>{assignedPresenter ? t("Marcador P en el destino; no indica GPS real", "P marker at destination; not real GPS") : ""}</small></div></div>
          <p className="operational-assumption">{t(`Estimación: distancia geodésica × 1,3 como aproximación de carretera; velocidad media configurable ${settings.averageSpeedKmh} km/h; tiempo redondeado a 5 min. No usa rutas ni tráfico en vivo.`, `Estimate: great-circle distance × 1.3 as an approximate road factor; configurable average speed ${settings.averageSpeedKmh} km/h; time rounded to 5 min. No live routes or traffic.`)}</p>
          <div className="operational-assignment"><h3>{t("Asignación manual", "Manual assignment")}</h3><p>{t("Disponibilidad de demostración según asignaciones simuladas activas; no refleja agendas reales.", "Demo availability based on active simulated assignments; not real schedules.")}</p>
            {presenters.length === 0 ? <p>{t("No hay presentadores activos registrados.", "No active presenters are registered.")}</p> : <><label>{t("Presentador disponible", "Available presenter")}<select value={presenterId} disabled={busy || !!selected.presenterId} onChange={(event) => setPresenterId(event.target.value)}><option value="">{t("Seleccionar presentador", "Select presenter")}</option>{available.map((presenter) => <option key={presenter.id} value={presenter.id}>{presenter.name}</option>)}</select></label><div className="operational-availability">{presenters.map((presenter) => <span key={presenter.id}>{presenter.name}: {occupiedIds.has(presenter.id) ? t("ocupado en simulación", "busy in simulation") : t("disponible (simulado)", "available (simulated)")}</span>)}</div></>}
            <div className="operational-actions"><button type="button" className="button button-primary" disabled={busy || !presenterId || !!selected.presenterId || !trip} onClick={() => updateIncident({ presenterId, status: "assigned" }, t("Reportaje asignado en la simulación.", "Report assigned in the simulation."))}>{t("Asignar reportaje", "Assign report")}</button>
            {selected.presenterId && selected.status === "assigned" && <button type="button" className="button button-secondary" disabled={busy} onClick={() => updateIncident({ status: "en_route" }, t("Estado simulado actualizado.", "Simulated status updated."))}>{t("Marcar en traslado", "Mark en route")}</button>}
            {selected.presenterId && selected.status === "en_route" && <button type="button" className="button button-secondary" disabled={busy} onClick={() => updateIncident({ status: "on_site" }, t("Estado simulado actualizado.", "Simulated status updated."))}>{t("Marcar en sitio", "Mark on site")}</button>}
            {(selected.presenterId || selected.status !== "pending") && <button type="button" className="button button-secondary" disabled={busy} onClick={() => updateIncident({ presenterId: null, status: "pending" }, t("Suceso reiniciado.", "Event reset."))}>{t("Reiniciar suceso", "Reset event")}</button>}</div>
          </div>
        </>}
      </section>
      {(notice || error) && <p className={error ? "operational-message is-error" : "operational-message"} role={error ? "alert" : "status"}>{error ? `${t("No se pudo guardar en JSON Server.", "Could not save to JSON Server.")} ${translate(error)}` : translate(notice)}</p>}
    </main>}
  </>;
}

export default OperationalMapPage;
