import { useContext } from "react";

import {
  AccessibilityContext,
} from "../context/AccessibilityContext.jsx";

function useAccessibility() {
  const context = useContext(AccessibilityContext);

  if (!context) {
    throw new Error(
      "useAccessibility debe utilizarse dentro de AccessibilityProvider."
    );
  }

  return context;
}

export default useAccessibility;