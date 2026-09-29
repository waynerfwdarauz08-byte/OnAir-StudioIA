import { useContext } from "react";

import {
  ThemeContext,
} from "../context/ThemeContext.jsx";

function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme debe utilizarse dentro de ThemeProvider."
    );
  }

  return context;
}

export default useTheme;