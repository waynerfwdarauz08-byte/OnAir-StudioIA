import { AuthProvider } from "./context/AuthContext.jsx";
import AccessibilityProvider from "./context/AccessibilityContext.jsx";
import ThemeProvider from "./context/ThemeContext.jsx";

import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  return (
    <ThemeProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
}

export default App;