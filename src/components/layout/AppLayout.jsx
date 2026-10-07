import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import BrandLogo from "../common/BrandLogo.jsx";
import SelectionSpeechControl from "../common/SelectionSpeechControl.jsx";

import useAuth from "../../hooks/useAuth.js";
import useAccessibility from "../../hooks/useAccessibility.js";
import useSystemSettings from "../../hooks/useSystemSettings.js";

import { messageService } from "../../services/messageService.js";

import {
  getRoleLabel,
  ROLES,
} from "../../utils/roles.js";

const menuItems = [
  {
    path: "/dashboard",
    number: "01",
    key: "dashboard",
    roles: [ROLES.ADMIN],
  },
  {
    path: "/news",
    number: "02",
    key: "news",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/ai-editor",
    number: "03",
    key: "aiEditor",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/rundowns",
    number: "04",
    key: "rundowns",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/on-air",
    number: "05",
    key: "onAir",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/studio-control",
    number: "06",
    key: "studioControl",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/teleprompter",
    number: "07",
    key: "teleprompter",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
      ROLES.PRESENTER,
    ],
  },
  {
    path: "/messages",
    number: "08",
    key: "messages",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
      ROLES.PRESENTER,
    ],
  },
  {
    path: "/admin/presenter-locations",
    number: "09",
    key: "presenterLocations",
    roles: [ROLES.ADMIN],
  },
  {
    path: "/admin/projections",
    number: "10",
    key: "projections",
    roles: [ROLES.ADMIN],
  },
  {
    path: "/admin/activity",
    number: "11",
    key: "activity",
    roles: [ROLES.ADMIN],
  },
  {
    path: "/admin/users",
    number: "12",
    key: "users",
    roles: [ROLES.ADMIN],
  },
  {
    path: "/trash",
    number: "13",
    key: "trash",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/admin/settings",
    number: "14",
    key: "settings",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
      ROLES.PRESENTER,
    ],
  },
];

const MENU_LABELS = {
  es: {
    trash: "Papelera",
    dashboard: "Vista general",
    news: "Noticias",
    aiEditor: "Redacción IA",
    rundowns: "Escaletas",
    onAir: "Control al aire",
    studioControl: "Control de estudio",
    teleprompter: "Teleprompter",
    messages: "Mensajería",
    users: "Usuarios",
    activity: "Historial",
    projections: "Proyecciones IA",
    presenterLocations: "Mapa operativo",
    settings: "Configuración",
  },
  en: {
    trash: "Recycle bin",
    dashboard: "Overview",
    news: "News",
    aiEditor: "AI writing",
    rundowns: "Rundowns",
    onAir: "On-air control",
    studioControl: "Studio control",
    teleprompter: "Teleprompter",
    messages: "Messages",
    users: "Users",
    activity: "Activity history",
    projections: "AI projections",
    presenterLocations: "Operations map",
    settings: "Settings",
  },
};

function AppLayout() {
  const [auditWarning, setAuditWarning] = useState(false);
  useEffect(() => {
    const warn = () => setAuditWarning(true);
    window.addEventListener("onair:audit-error", warn);
    return () => window.removeEventListener("onair:audit-error", warn);
  }, []);
  const { channelName } = useSystemSettings();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const { language } = useAccessibility();

  const isEnglish = language === "en";

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);

  useEffect(() => {
    function updateUnreadMessageCount(event) {
      const messages = Array.isArray(event.detail)
        ? event.detail
        : [];

      const unreadMessages = messages.filter(
        (message) =>
          message.receiverId === user.id &&
          !message.read
      );

      setUnreadMessageCount(unreadMessages.length);
    }

    window.addEventListener(
      "onair:messages-updated",
      updateUnreadMessageCount
    );

    return () => {
      window.removeEventListener(
        "onair:messages-updated",
        updateUnreadMessageCount
      );
    };
  }, [user.id]);

  useEffect(() => {
    if (location.pathname === "/messages") {
      return undefined;
    }

    let stopped = false;
    let controller;

    async function loadUnreadMessages() {
      controller?.abort();
      controller = new AbortController();

      try {
        const messages = await messageService.getAll(
          controller.signal
        );

        if (stopped) {
          return;
        }

        const unreadMessages = Array.isArray(messages)
          ? messages.filter(
              (message) =>
                message.receiverId === user.id &&
                !message.read
            )
          : [];

        setUnreadMessageCount(unreadMessages.length);
      } catch (error) {
        if (!stopped && error.name !== "AbortError") {
          console.error(
            "No fue posible consultar los mensajes pendientes.",
            error
          );
        }
      }
    }

    loadUnreadMessages();

    const intervalId = window.setInterval(
      loadUnreadMessages,
      3000
    );

    return () => {
      stopped = true;
      controller?.abort();
      window.clearInterval(intervalId);
    };
  }, [location.pathname, user.id]);

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const userInitial =
    user.name?.trim().charAt(0).toUpperCase() || "U";

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {isEnglish ? "Skip to content" : "Saltar al contenido"}
      </a>

      <aside
        id="main-sidebar"
        className={`sidebar ${
          isMenuOpen ? "sidebar-open" : ""
        }`}
        aria-label={isEnglish ? "Main menu" : "Menú principal"}
      >
        <div className="sidebar-heading">
          <NavLink
            to="/"
            className="brand"
            aria-label={
              isEnglish
                ? "OnAir Studio AI, home page"
                : "OnAir Studio IA, página principal"
            }
          >
            <BrandLogo
              compact
              className="sidebar-brand-logo"
            />
          </NavLink>

          <button
            type="button"
            className="mobile-close-button"
            onClick={closeMenu}
            aria-label={isEnglish ? "Close menu" : "Cerrar menú"}
          >
            ×
          </button>
        </div>

        <p className="navigation-label">
          {isEnglish ? "WORKSPACE" : "ESPACIO DE TRABAJO"}
        </p>

        <nav
          className="main-navigation"
          aria-label={
            isEnglish
              ? "Main navigation"
              : "Navegación principal"
          }
        >
          {visibleMenuItems.map((item) => {
            const isMessagesItem = item.path === "/messages";
            const label =
              MENU_LABELS[isEnglish ? "en" : "es"][item.key];

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `navigation-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <span
                  className="navigation-number"
                  aria-hidden="true"
                >
                  {item.number}
                </span>

                <span className="navigation-link-label">
                  {label}
                </span>

                {isMessagesItem && unreadMessageCount > 0 && (
                  <span
                    className="navigation-unread-badge"
                    aria-label={
                      isEnglish
                        ? `${unreadMessageCount} unread messages`
                        : `${unreadMessageCount} mensajes sin leer`
                    }
                  >
                    {unreadMessageCount > 99
                      ? "99+"
                      : unreadMessageCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className="system-status">
            <span
              className="status-indicator"
              aria-hidden="true"
            />
            {isEnglish ? "ACTIVE SESSION" : "SESIÓN ACTIVA"}
          </span>

          <p>
            {isEnglish ? "Signed in as" : "Acceso como"}{" "}
            {getRoleLabel(user.role, language)}.
          </p>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            {isEnglish ? "Log out" : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={closeMenu}
          aria-label={
            isEnglish ? "Close sidebar" : "Cerrar menú lateral"
          }
        />
      )}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setIsMenuOpen(true)}
              aria-label={
                isEnglish
                  ? "Open main menu"
                  : "Abrir menú principal"
              }
              aria-expanded={isMenuOpen}
              aria-controls="main-sidebar"
            >
              <span aria-hidden="true">☰</span>
            </button>

            <div>
              <span className="topbar-label">
                {isEnglish ? "EDITORIAL DESK" : "MESA EDITORIAL"}
              </span>

              <span
                className="topbar-separator"
                aria-hidden="true"
              >
                /
              </span>

              <span className="topbar-section">
                {channelName}
              </span>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="demo-badge">
              {isEnglish
                ? "ACADEMIC ENVIRONMENT"
                : "ENTORNO ACADÉMICO"}
            </span>

            <div className="user-preview">
              <span
                className="user-avatar"
                aria-hidden="true"
              >
                {userInitial}
              </span>

              <div>
                <strong>{user.name}</strong>
                <span>
                  {getRoleLabel(user.role, language)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="main-content"
          tabIndex="-1"
        >
          {auditWarning && <div className="form-alert" role="alert">{isEnglish ? "Your change was saved, but its activity log could not be recorded." : "El cambio se guardó, pero no fue posible registrarlo en Historial."} <button type="button" className="button button-secondary" onClick={() => setAuditWarning(false)}>{isEnglish ? "Dismiss" : "Cerrar aviso"}</button></div>}
          <Outlet />
          <SelectionSpeechControl />
        </main>

        <footer className="main-footer">
          <span>{channelName}</span>

          <span>
            {isEnglish
              ? "Academic project · FWD Academy"
              : "Proyecto académico · FWD Academy"}
          </span>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;
