import useTranslation from "../hooks/useTranslation.js";
import useAuth from "../hooks/useAuth.js";
import { useEffect, useState } from "react";
import PageHeader from "../components/common/PageHeader.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/common/FeedbackStates.jsx";
import useAccessibility from "../hooks/useAccessibility.js";
import { trashService } from "../services/trashService.js";
import "../styles/trash.css";

export default function TrashPage() {
  const { translate } = useTranslation();
  const { user } = useAuth();
  const { language } = useAccessibility();
  const en = language === "en";
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [reload, setReload] = useState(0);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const labels = en ? { news: "News", rundowns: "Rundowns", categories: "Categories" }
    : { news: "Noticias", rundowns: "Escaletas", categories: "Categorías" };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    trashService.getAll(controller.signal).then((items) => {
      if (!controller.signal.aborted) setEntries(items);
    }).catch((error) => {
      if (!controller.signal.aborted) setError(error.message);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [reload]);

  async function restore({ resource, item }) {
    setBusy(`${resource}:${item.id}`);
    setError("");
    setNotice("");
    try {
      await trashService.restore(resource, item.id, user);
      setEntries((items) => items.filter((entry) => entry.resource !== resource || entry.item.id !== item.id));
      setNotice(en ? "Item restored to its original module." : "Elemento restaurado en su módulo original.");
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy("");
    }
  }

  const visible = entries.filter(({ resource, item }) =>
    (filter === "all" || resource === filter) &&
    String(item.title || item.name || item.id).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  );

  return <>
    <PageHeader eyebrow={en ? "RECOVERY" : "RECUPERACIÓN"} title={en ? "Recycle bin" : "Papelera"}
      description={en ? "Recover deleted news, rundowns and categories. Only items deleted after enabling the recycle bin appear here."
        : "Recupera noticias, escaletas y categorías eliminadas. Aquí aparecen los elementos eliminados desde que se habilitó la papelera."} />
    <div className="trash-toolbar">
      <label className="trash-field trash-search">{en ? "Search" : "Buscar"} <input type="search" placeholder={en ? "Search by title or name" : "Buscar por título o nombre"} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
      <label className="trash-field">{en ? "Type" : "Tipo"} <select value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="all">{en ? "All" : "Todos"}</option>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <button className="button button-secondary" disabled={loading || Boolean(busy)} onClick={() => setReload((value) => value + 1)}>{en ? "Refresh" : "Actualizar"}</button>
    </div>
    {notice && <p className="trash-notice" role="status">{translate(notice)}</p>}
    {error && <ErrorState message={error} onRetry={() => setReload((value) => value + 1)} />}
    {loading && <LoadingState message={en ? "Loading recycle bin..." : "Cargando papelera..."} />}
    {!loading && !error && !visible.length && <EmptyState title={en ? "No deleted items found" : "No hay elementos eliminados que mostrar"}
      description={en ? "Deleted editorial content will appear here for recovery." : "El contenido editorial que elimines aparecerá aquí para recuperarlo."} />}
    {!loading && !error && <p className="trash-results" role="status">{en ? `${visible.length} of ${entries.length} items` : `${visible.length} de ${entries.length} elementos`}</p>}
    {!loading && <section className="trash-grid" aria-label={en ? "Deleted items" : "Elementos eliminados"}>
      {visible.map((entry) => <article className="trash-card" key={`${entry.resource}:${entry.item.id}`}>
        <span className="trash-type">{labels[entry.resource]}</span>
        <h2>{entry.item.title || entry.item.name || entry.item.id}</h2>
        <p className="trash-date">{en ? "Deleted:" : "Eliminado:"} <time dateTime={entry.item.deletedAt}>{new Intl.DateTimeFormat(en ? "en-US" : "es-CR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.item.deletedAt))}</time></p>
        <button className="button button-primary" disabled={Boolean(busy)} onClick={() => restore(entry)}>
          {busy === `${entry.resource}:${entry.item.id}` ? (en ? "Restoring..." : "Restaurando...") : (en ? "Restore" : "Restaurar")}
        </button>
      </article>)}
    </section>}
  </>;
}
