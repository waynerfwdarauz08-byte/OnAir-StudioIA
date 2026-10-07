import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth.js";
import { settingsService } from "../services/settingsService.js";

const DEFAULTS = { channelName: "OnAir Studio AI", wordsPerMinute: 150 };
export const SystemSettingsContext = createContext(DEFAULTS);

export default function SystemSettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULTS);
  const applySettings = useCallback((data) => {
    setSettings({
      channelName: String(data.channelName || DEFAULTS.channelName).trim(),
      wordsPerMinute: Number(data.wordsPerMinute) >= 80 && Number(data.wordsPerMinute) <= 250
        ? Number(data.wordsPerMinute) : DEFAULTS.wordsPerMinute,
    });
  }, []);
  useEffect(() => {
    if (!user) { setSettings(DEFAULTS); return; }
    const controller = new AbortController();
    settingsService.get(controller.signal).then((data) => {
      if (!controller.signal.aborted) applySettings(data);
    }).catch(() => { /* Los módulos mantienen los valores iniciales si no hay conexión. */ });
    return () => controller.abort();
  }, [user?.id, applySettings]);
  useEffect(() => { document.title = settings.channelName; }, [settings.channelName]);
  const value = useMemo(() => ({ ...settings, applySettings }), [settings, applySettings]);
  return <SystemSettingsContext.Provider value={value}>{children}</SystemSettingsContext.Provider>;
}
