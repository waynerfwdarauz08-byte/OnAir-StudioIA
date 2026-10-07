import useTranslation from "../../hooks/useTranslation.js";
import "../../styles/broadcast-transitions.css";
import useSystemSettings from "../../hooks/useSystemSettings.js";
import { useState } from "react";

import BroadcastMonitor from "./BroadcastMonitor.jsx";

const TRANSITION_TYPES = [
  { id: "mix", label: "MIX" },
  { id: "wipe", label: "WIPE" },
  { id: "dip", label: "DIP" },
  { id: "cut", label: "CUT" },
];

const TRANSITION_RATES = [
  { value: 500, label: "0.5s" },
  { value: 1000, label: "1s" },
  { value: 1500, label: "1.5s" },
  { value: 2000, label: "2s" },
];

function BroadcastSwitcher({
  sources = [],
  programSourceId,
  previewSourceId,
  lowerThird = "",
  title = "",
  transitioning = false,
  transition = null,
  onPreview,
  onTake,
  onCut,
  onAuto,
}) {
  const { translate } = useTranslation();
  const { channelName } = useSystemSettings();
  const [transitionType, setTransitionType] =
    useState("mix");

  const [transitionRate, setTransitionRate] =
    useState(1000);

  const [tBarValue, setTBarValue] = useState(0);

  const [keyers, setKeyers] = useState({
    lowerThird: true,
    breaking: false,
    ticker: true,
    stationBug: true,
  });

  const [fadeToBlack, setFadeToBlack] =
    useState(false);

  const programSource =
    sources.find(
      (source) => source.id === programSourceId
    ) || sources[0];

  const previewSource =
    sources.find(
      (source) => source.id === previewSourceId
    ) ||
    sources[1] ||
    sources[0];

  function toggleKeyer(key) {
    setKeyers((currentKeyers) => ({
      ...currentKeyers,
      [key]: !currentKeyers[key],
    }));
  }

  function handleTBarChange(event) {
    const value = Number(event.target.value);

    setTBarValue(value);

    if (value >= 100) {
      onTake(previewSourceId);

      window.setTimeout(() => {
        setTBarValue(0);
      }, 180);
    }
  }

  function handleAuto() {
    onAuto({
      type: transitionType,
      duration: transitionRate,
    });
  }

  if (!programSource || !previewSource) {
    return null;
  }

  return (
    <section
      className="broadcast-switcher"
      aria-labelledby="switcher-title"
    >
      <header className="broadcast-section-heading">
        <div>
          <span>{translate("SWITCHER PRINCIPAL")}</span>

          <h2 id="switcher-title">{translate("Control de programa y preview")}</h2>
        </div>

        <div className="broadcast-switcher-status">
          <span>
            PGM: {programSource.code}
          </span>

          <span>
            PVW: {previewSource.code}
          </span>
        </div>
      </header>

      <div className="broadcast-main-monitors">
        <div className="broadcast-main-monitor">
          <div className="broadcast-main-label is-preview">
            <div>
              <i />
              <strong>PREVIEW</strong>
              <span>(PVW)</span>
            </div>

            <small>{translate(previewSource.name)}</small>
          </div>

          <BroadcastMonitor
            source={previewSource}
            mode="preview"
            large
          />
        </div>

        <div
          className={`broadcast-main-monitor ${
            fadeToBlack ? "is-black" : ""
          }`}
        >
          <div className="broadcast-main-label is-program">
            <div>
              <i />
              <strong>PROGRAM</strong>
              <span>(PGM)</span>
            </div>

            <small>{translate(programSource.name)}</small>
          </div>

          <div className="broadcast-program-screen">
            <BroadcastMonitor
              source={programSource}
              mode="program"
              large
              lowerThird={
                keyers.lowerThird
                  ? lowerThird
                  : ""
              }
              title={title}
            />

            {transition && <div className={`broadcast-transition broadcast-transition--${transition.type}`} style={{ "--transition-duration": `${transition.duration}ms` }} aria-hidden="true"><BroadcastMonitor source={sources.find((source) => source.id === transition.sourceId)} mode="program" large lowerThird={keyers.lowerThird ? lowerThird : ""} title={title} /></div>}
            {transition?.type === "dip" && <div className="broadcast-transition-dip" style={{ "--transition-duration": `${transition.duration}ms` }} aria-hidden="true" />}
            {fadeToBlack && (
              <div className="broadcast-blackout">
                <span>FADE TO BLACK</span>
              </div>
            )}

            {keyers.stationBug &&
              !fadeToBlack && (
                <span className="broadcast-station-bug">
                  {channelName}
                </span>
              )}

            {keyers.breaking &&
              !fadeToBlack && (
                <span className="broadcast-breaking-bug">{translate("ÚLTIMA HORA")}</span>
              )}

            {keyers.ticker &&
              !fadeToBlack && (
                <div className="broadcast-ticker">
                  <span>{channelName}</span>

                  <p>
                    {title ||
                      translate("Sistema de transmisión preparado")}
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>

      <div className="broadcast-control-rack">
        <section className="broadcast-bus-panel">
          <header>
            <span className="bus-dot program-dot" />

            <strong>
              PROGRAM BUS
            </strong>

            <small>{translate("CORTE DIRECTO AL AIRE")}</small>
          </header>

          <div className="broadcast-source-buttons">
            {sources.map((source) => (
              <button
                key={source.id}
                className={
                  source.id === programSourceId
                    ? "is-program"
                    : ""
                }
                type="button"
                disabled={transitioning}
                onClick={() =>
                  onTake(source.id)
                }
              >
                <strong>{source.code}</strong>
                <small>{source.shortName}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="broadcast-bus-panel">
          <header>
            <span className="bus-dot preview-dot" />

            <strong>
              PREVIEW BUS
            </strong>

            <small>{translate("SEÑAL PREPARADA")}</small>
          </header>

          <div className="broadcast-source-buttons">
            {sources.map((source) => (
              <button
                key={source.id}
                className={
                  source.id === previewSourceId
                    ? "is-preview"
                    : ""
                }
                type="button"
                disabled={transitioning}
                onClick={() =>
                  onPreview(source.id)
                }
              >
                <strong>{source.code}</strong>
                <small>{source.shortName}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="broadcast-keyers">
          <header>
            <strong>KEYERS / DSK</strong>

            <small>{translate("ELEMENTOS GRÁFICOS")}</small>
          </header>

          <div>
            <button
              className={
                keyers.lowerThird
                  ? "is-active"
                  : ""
              }
              type="button"
              onClick={() =>
                toggleKeyer("lowerThird")
              }
            >
              DSK 1
              <small>{translate("CINTILLO")}</small>
            </button>

            <button
              className={
                keyers.breaking
                  ? "is-active"
                  : ""
              }
              type="button"
              onClick={() =>
                toggleKeyer("breaking")
              }
            >
              DSK 2
              <small>{translate("ÚLTIMA HORA")}</small>
            </button>

            <button
              className={
                keyers.ticker
                  ? "is-active"
                  : ""
              }
              type="button"
              onClick={() =>
                toggleKeyer("ticker")
              }
            >
              DSK 3
              <small>TICKER</small>
            </button>

            <button
              className={
                keyers.stationBug
                  ? "is-active"
                  : ""
              }
              type="button"
              onClick={() =>
                toggleKeyer("stationBug")
              }
            >
              DSK 4
              <small>LOGO</small>
            </button>

            <button
              className={`broadcast-ftb ${
                fadeToBlack ? "is-active" : ""
              }`}
              type="button"
              onClick={() =>
                setFadeToBlack(
                  (currentValue) =>
                    !currentValue
                )
              }
            >
              FTB
              <small>FADE TO BLACK</small>
            </button>
          </div>
        </section>

        <section className="broadcast-transition-panel">
          <div className="broadcast-transition-settings">
            <div>
              <span>{translate("TIPO DE TRANSICIÓN")}</span>

              <div className="broadcast-option-buttons">
                {TRANSITION_TYPES.map(
                  (transition) => (
                    <button
                      key={transition.id}
                      disabled={transitioning}
                      className={
                        transitionType ===
                        transition.id
                          ? "is-selected"
                          : ""
                      }
                      type="button"
                      onClick={() =>
                        setTransitionType(
                          transition.id
                        )
                      }
                    >
                      {transition.label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <span>{translate("VELOCIDAD")}</span>

              <div className="broadcast-option-buttons">
                {TRANSITION_RATES.map((rate) => (
                  <button
                    key={rate.value}
                    disabled={transitioning}
                    className={
                      transitionRate ===
                      rate.value
                        ? "is-selected"
                        : ""
                    }
                    type="button"
                    onClick={() =>
                      setTransitionRate(
                        rate.value
                      )
                    }
                  >
                    {rate.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="broadcast-transition-actions">
            <button
              className="broadcast-cut-button"
              type="button"
              disabled={transitioning}
              onClick={onCut}
            >
              CUT
              <small>{translate("CORTE DIRECTO")}</small>
            </button>

            <button
              className="broadcast-auto-button"
              type="button"
              disabled={transitioning}
              onClick={handleAuto}
            >
              {transitioning ? "..." : "AUTO"}
              <small>
                {transitionType.toUpperCase()}{" "}
                {transitionRate / 1000}s
              </small>
            </button>

            <div className="broadcast-tbar">
              <label htmlFor="broadcast-tbar">
                T-BAR
              </label>

              <strong>{tBarValue}%</strong>

              <input
                id="broadcast-tbar"
                type="range"
                min="0"
                max="100"
                step="1"
                value={tBarValue}
                disabled={transitioning}
                onChange={handleTBarChange}
              />
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

export default BroadcastSwitcher;
