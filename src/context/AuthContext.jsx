import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { userService } from "../services/userService.js";

const SESSION_KEY = "onair_session";

export const AuthContext = createContext(null);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    setAuthLoading(true);

    try {
      const savedSession = localStorage.getItem(SESSION_KEY);

      if (!savedSession) {
        setUser(null);
        return;
      }

      const parsedSession = JSON.parse(savedSession);

      if (!parsedSession.userId) {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        return;
      }

      const storedUser = await userService.getById(
        parsedSession.userId
      );

      if (!storedUser.active) {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        return;
      }

      const {
        password: ignoredPassword,
        ...safeUser
      } = storedUser;

      setUser(safeUser);
    } catch {
      localStorage.removeItem(SESSION_KEY);
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

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: selectedUser.id,
      })
    );

    const {
      password: ignoredPassword,
      ...safeUser
    } = selectedUser;

    setUser(safeUser);

    return safeUser;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
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