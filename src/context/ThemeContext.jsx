import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

export const ThemeContext = createContext(null);

const STORAGE_KEY = "onair-studio-theme";

const AVAILABLE_THEMES = [
  "dark",
  "light",
  "contrast",
];

function getInitialTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (AVAILABLE_THEMES.includes(savedTheme)) {
      return savedTheme;
    }
  } catch {
    // El tema sigue disponible cuando el navegador bloquea el almacenamiento.
  }

  return "dark";
}

function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(
    getInitialTheme
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Conserva el tema en memoria si no se puede persistir.
    }
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    if (!AVAILABLE_THEMES.includes(newTheme)) {
      return;
    }

    setThemeState(newTheme);
  }, []);

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      availableThemes: AVAILABLE_THEMES,
    }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
