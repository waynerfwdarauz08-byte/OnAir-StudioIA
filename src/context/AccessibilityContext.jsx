import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export const AccessibilityContext = createContext(null);

const STORAGE_KEY = "onair-studio-accessibility";

const DEFAULT_PREFERENCES = {
  language: "es",
  fontScale: 100,
  colorVision: "standard",
  reduceMotion: false,
  speechRate: 1,
};

const FONT_SCALES = [100, 125, 150, 175, 200];
const COLOR_VISION_MODES = ["standard", "colorblind"];
const SPEECH_RATES = [0.75, 1, 1.25, 1.5];

function isValidPreferences(value) {
  return (
    value &&
    typeof value === "object" &&
    ["es", "en"].includes(value.language) &&
    FONT_SCALES.includes(Number(value.fontScale)) &&
    COLOR_VISION_MODES.includes(value.colorVision) &&
    typeof value.reduceMotion === "boolean" &&
    SPEECH_RATES.includes(Number(value.speechRate))
  );
}

function getInitialPreferences() {
  try {
    const savedPreferences = localStorage.getItem(STORAGE_KEY);

    if (!savedPreferences) {
      return DEFAULT_PREFERENCES;
    }

    const parsedPreferences = JSON.parse(savedPreferences);

    if (isValidPreferences(parsedPreferences)) {
      return {
        ...DEFAULT_PREFERENCES,
        ...parsedPreferences,
      };
    }
  } catch {
    // Si el almacenamiento no está disponible o los datos
    // no son válidos, se utilizan las preferencias iniciales.
  }

  return DEFAULT_PREFERENCES;
}

function AccessibilityProvider({ children }) {
  const [preferences, setPreferences] = useState(
    getInitialPreferences
  );

  useEffect(() => {
    const root = document.documentElement;

    root.lang = preferences.language;
    root.dataset.fontScale = String(preferences.fontScale);
    root.dataset.colorVision = preferences.colorVision;
    root.dataset.reduceMotion = String(
      preferences.reduceMotion
    );
    root.dataset.speechRate = String(
      preferences.speechRate
    );

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(preferences)
      );
    } catch {
      // La aplicación sigue funcionando si el navegador
      // no permite guardar preferencias.
    }
  }, [preferences]);

  const updatePreference = useCallback((name, value) => {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [name]: value,
    }));
  }, []);

  const contextValue = useMemo(
    () => ({
      ...preferences,
      updatePreference,
      setLanguage: (language) =>
        updatePreference("language", language),
      setFontScale: (fontScale) =>
        updatePreference("fontScale", Number(fontScale)),
      setColorVision: (colorVision) =>
        updatePreference("colorVision", colorVision),
      setReduceMotion: (reduceMotion) =>
        updatePreference("reduceMotion", Boolean(reduceMotion)),
      setSpeechRate: (speechRate) =>
        updatePreference("speechRate", Number(speechRate)),
    }),
    [preferences, updatePreference]
  );

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export default AccessibilityProvider;