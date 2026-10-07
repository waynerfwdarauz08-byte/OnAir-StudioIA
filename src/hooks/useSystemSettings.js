import { useContext } from "react";
import { SystemSettingsContext } from "../context/SystemSettingsContext.jsx";

export default function useSystemSettings() {
  return useContext(SystemSettingsContext);
}
