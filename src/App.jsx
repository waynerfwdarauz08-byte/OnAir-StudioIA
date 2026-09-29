import { AuthProvider } from "./context/AuthContext.jsx";
import ThemeProvider from "./context/ThemeContext.jsx";

import AppRoutes from "./routes/AppRoutes.jsx";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;