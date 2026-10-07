import { AuthProvider } from "./context/AuthContext.jsx";
import AccessibilityProvider from "./context/AccessibilityContext.jsx";
import ThemeProvider from "./context/ThemeContext.jsx";
import SystemSettingsProvider from "./context/SystemSettingsContext.jsx";

import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <SystemSettingsProvider><AppRoutes /></SystemSettingsProvider>
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

export default App;
