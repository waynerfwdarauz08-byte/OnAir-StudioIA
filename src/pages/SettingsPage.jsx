import {
  useEffect,
  useState,
} from "react";

import PageHeader from "../components/common/PageHeader.jsx";

import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import GeneralSettingsForm from "../components/settings/GeneralSettingsForm.jsx";

import { settingsService } from "../services/settingsService.js";
import { activityService } from "../services/activityService.js";

import useAuth from "../hooks/useAuth.js";
import useTheme from "../hooks/useTheme.js";

function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const [settings, setSettings] = useState({
    channelName: "",
    wordsPerMinute: 150,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSettings() {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const data = await settingsService.get(
          controller.signal
        );

        if (controller.signal.aborted) {
          return;
        }

        setSettings({
          channelName:
            data.channelName || "OnAir Studio AI",
          wordsPerMinute:
            Number(data.wordsPerMinute) || 150,
        });

        if (
          ["dark", "light", "contrast"].includes(
            data.theme
          )
        ) {
          setTheme(data.theme);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError.message ||
              "No fue posible cargar la configuración."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      controller.abort();
    };
  }, [reloadKey, setTheme]);

  function validateSettings() {
    if (settings.channelName.trim().length < 3) {
      return "El nombre del canal debe tener al menos 3 caracteres.";
    }

    const wordsPerMinute = Number(
      settings.wordsPerMinute
    );

    if (
      !Number.isFinite(wordsPerMinute) ||
      wordsPerMinute < 80 ||
      wordsPerMinute > 250
    ) {
      return "Las palabras por minuto deben estar entre 80 y 250.";
    }

    return "";
  }

  async function handleSave() {
    const validationMessage =
      validateSettings();

    if (validationMessage) {
      setError(validationMessage);
      setSuccessMessage("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const savedSettings =
        await settingsService.update({
          channelName:
            settings.channelName.trim(),
          wordsPerMinute: Number(
            settings.wordsPerMinute
          ),
          theme,
        });

      setSettings({
        channelName: savedSettings.channelName,
        wordsPerMinute: Number(
          savedSettings.wordsPerMinute
        ),
      });

      setSuccessMessage(
        "La configuración se guardó correctamente."
      );

      try {
        await activityService.create({
          action: "update",
          description: `${user.name} actualizó la configuración general del sistema.`,
          userId: user.id,
          userName: user.name,
          module: "settings",
          createdAt: new Date().toISOString(),
        });
      } catch {
        // La configuración permanece guardada aunque
        // el historial no pueda registrar el evento.
      }
    } catch (saveError) {
      setError(
        saveError.message ||
          "No fue posible guardar la configuración."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleThemeChange(newTheme) {
    setTheme(newTheme);
    setSuccessMessage("");
    setError("");
  }

  function handleSettingsChange(newSettings) {
    setSettings(newSettings);
    setSuccessMessage("");
    setError("");
  }

  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRACIÓN"
        title="Configuración del sistema"
        description="Personaliza la identidad, el funcionamiento y la apariencia de OnAir Studio AI."
      />

      {loading && (
        <LoadingState message="Cargando la configuración general..." />
      )}

      {!loading && error && !settings.channelName && (
        <ErrorState
          message={error}
          onRetry={() =>
            setReloadKey(
              (currentValue) => currentValue + 1
            )
          }
        />
      )}

      {!loading && settings.channelName && (
        <>
          {successMessage && (
            <div
              className="settings-message settings-message-success"
              role="status"
            >
              <span aria-hidden="true">✓</span>

              <p>{successMessage}</p>
            </div>
          )}

          {error && (
            <div
              className="settings-message settings-message-error"
              role="alert"
            >
              <span aria-hidden="true">!</span>

              <p>{error}</p>
            </div>
          )}

          <GeneralSettingsForm
            settings={settings}
            theme={theme}
            saving={saving}
            onSettingsChange={
              handleSettingsChange
            }
            onThemeChange={handleThemeChange}
            onSubmit={handleSave}
          />
        </>
      )}
    </>
  );
}

export default SettingsPage;