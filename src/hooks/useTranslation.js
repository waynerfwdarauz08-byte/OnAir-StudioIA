import { useCallback } from "react";
import useAccessibility from "./useAccessibility.js";
import { translateInterface } from "../utils/translations.js";

export default function useTranslation() {
  const { language } = useAccessibility();
  const translate = useCallback((text, values) => translateInterface(text, language, values), [language]);
  return { translate, language };
}
