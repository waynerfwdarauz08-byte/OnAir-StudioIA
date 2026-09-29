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
  const savedTheme =
    localStorage.getItem(STORAGE_KEY);

  if (AVAILABLE_THEMES.includes(savedTheme)) {
    return savedTheme;
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

    localStorage.setItem(
      STORAGE_KEY,
      theme
    );
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