import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { userService } from "../services/userService.js";
import { activityService } from "../services/activityService.js";
import { getRoleLabel } from "../utils/roles.js";

const SESSION_KEY = "onair_session";

export const AuthContext = createContext(null);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getSessionDetails() {
  try {
    const savedSession = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}");
    const startedAt = savedSession.sessionStartedAt || new Date().toISOString();

    return {
      sessionId: savedSession.sessionId || createSessionId(),
      sessionStartedAt: startedAt,
      sessionEndedAt: new Date().toISOString(),
      durationSeconds: Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)),
      userAgent: navigator.userAgent,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  } catch {
    const now = new Date().toISOString();
    return {
      sessionId: createSessionId(),
      sessionStartedAt: now,
      sessionEndedAt: now,
      durationSeconds: 0,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    setAuthLoading(true);

    try {
      // Elimina sesiones persistentes anteriores para volver a pedir acceso
      // al abrir una nueva sesión del navegador.
      localStorage.removeItem(SESSION_KEY);
      const savedSession = sessionStorage.getItem(SESSION_KEY);

      if (!savedSession) {
        setUser(null);
        return;
      }

      const parsedSession = JSON.parse(savedSession);

      if (!parsedSession.userId) {
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
        return;
      }

      if (!parsedSession.sessionId || !parsedSession.sessionStartedAt) {
        const updatedSession = {
          ...parsedSession,
          sessionId: parsedSession.sessionId || createSessionId(),
          sessionStartedAt: parsedSession.sessionStartedAt || new Date().toISOString(),
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
      }

      const storedUser = await userService.getById(
        parsedSession.userId
      );

      if (!storedUser.active) {
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
        return;
      }

      const {
        password: ignoredPassword,
        ...safeUser
      } = storedUser;

      setUser(safeUser);
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  async function login(email, password) {
    const normalizedEmail = normalizeEmail(email);

    const matchingUsers = await userService.getByEmail(
      normalizedEmail
    );

    const selectedUser = Array.isArray(matchingUsers)
      ? matchingUsers.find(
          (userItem) =>
            normalizeEmail(userItem.email) === normalizedEmail
        )
      : null;

    if (!selectedUser) {
      throw new Error(
        "El correo o la contraseña son incorrectos."
      );
    }

    if (!selectedUser.active) {
      throw new Error(
        "Esta cuenta está desactivada. Comunícate con el administrador."
      );
    }

    if (selectedUser.password !== password) {
      throw new Error(
        "El correo o la contraseña son incorrectos."
      );
    }

    const session = {
      userId: selectedUser.id,
      sessionId: createSessionId(),
      sessionStartedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    const {
      password: ignoredPassword,
      ...safeUser
    } = selectedUser;

    setUser(safeUser);

    // El registro es independiente: un fallo de n8n no bloquea el acceso.
    void activityService.registerLogin(
      safeUser,
      getRoleLabel(safeUser.role),
      {
        ...getSessionDetails(),
        sessionEndedAt: null,
        durationSeconds: null,
      }
    );

    return safeUser;
  }

  function logout() {
    if (user) {
      void activityService.registerLogout(user, getSessionDetails());
    }

    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      restoreSession,
    }),
    [user, authLoading, restoreSession]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
