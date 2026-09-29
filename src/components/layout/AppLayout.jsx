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

import useAuth from "../../hooks/useAuth.js";

import {
  messageService,
} from "../../services/messageService.js";

import {
  getRoleLabel,
  ROLES,
} from "../../utils/roles.js";

const menuItems = [
  {
    path: "/dashboard",
    number: "01",
    label: "Vista general",
    roles: [
      ROLES.ADMIN,
    ],
  },
  {
    path: "/news",
    number: "02",
    label: "Noticias",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
    ],
  },
  {
    path: "/ai-editor",
    number: "03",
    label: "Redacción IA",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
    ],
  },
  {
    path: "/rundowns",
    number: "04",
    label: "Escaletas",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
    ],
  },
  {
    path: "/on-air",
    number: "05",
    label: "Control al aire",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
    ],
  },
  {
    path: "/studio-control",
    number: "06",
    label: "Control de estudio",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
    ],
  },
  {
    path: "/teleprompter",
    number: "07",
    label: "Teleprompter",
    roles: [
      ROLES.ADMIN,
      ROLES.PRESENTER,
    ],
  },
  {
    path: "/messages",
    number: "08",
    label: "Mensajería",
    roles: [
      ROLES.ADMIN,
      ROLES.MODERATOR,
      ROLES.PRESENTER,
    ],
  },
  {
    path: "/admin/users",
    number: "09",
    label: "Usuarios",
    roles: [
      ROLES.ADMIN,
    ],
  },
  {
    path: "/admin/activity",
    number: "10",
    label: "Historial",
    roles: [
      ROLES.ADMIN,
    ],
  },
  {
    path: "/admin/settings",
    number: "11",
    label: "Configuración",
    roles: [
      ROLES.ADMIN,
    ],
  },
];

function AppLayout() {
  const [
    isMenuOpen,
    setIsMenuOpen,
  ] = useState(false);

  const [
    unreadMessageCount,
    setUnreadMessageCount,
  ] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, []);

  useEffect(() => {
    let stopped = false;
    let controller;

    async function loadUnreadMessages() {
      controller?.abort();
      controller = new AbortController();

      try {
        const messages =
          await messageService.getAll(
            controller.signal
          );

        if (stopped) {
          return;
        }

        const unreadMessages =
          Array.isArray(messages)
            ? messages.filter(
                (message) =>
                  message.receiverId ===
                    user.id &&
                  !message.read
              )
            : [];

        setUnreadMessageCount(
          unreadMessages.length
        );
      } catch (error) {
        if (
          !stopped &&
          error.name !== "AbortError"
        ) {
          console.error(
            "No fue posible consultar los mensajes pendientes.",
            error
          );
        }
      }
    }

    loadUnreadMessages();

    const intervalId =
      window.setInterval(
        loadUnreadMessages,
        3000
      );

    return () => {
      stopped = true;
      controller?.abort();

      window.clearInterval(
        intervalId
      );
    };
  }, [user.id]);

  const visibleMenuItems =
    menuItems.filter(
      (item) =>
        item.roles.includes(user.role)
    );

  const userInitial =
    user.name
      ?.trim()
      .charAt(0)
      .toUpperCase() || "U";

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
      >
        Saltar al contenido
      </a>

      <aside
        id="main-sidebar"
        className={`sidebar ${
          isMenuOpen
            ? "sidebar-open"
            : ""
        }`}
        aria-label="Menú principal"
      >
        <div className="sidebar-heading">
          <NavLink
            to="/"
            className="brand"
            aria-label="OnAir Studio IA, página principal"
          >
            <BrandLogo
              compact
              className="sidebar-brand-logo"
            />
          </NavLink>

          <button
            type="button"
            className="mobile-close-button"
            onClick={() =>
              setIsMenuOpen(false)
            }
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>

        <p className="navigation-label">
          ESPACIO DE TRABAJO
        </p>

        <nav
          className="main-navigation"
          aria-label="Navegación principal"
        >
          {visibleMenuItems.map(
            (item) => {
              const isMessagesItem =
                item.path === "/messages";

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({
                    isActive,
                  }) =>
                    `navigation-link ${
                      isActive
                        ? "active"
                        : ""
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
                    {item.label}
                  </span>

                  {isMessagesItem &&
                    unreadMessageCount >
                      0 && (
                      <span
                        className="navigation-unread-badge"
                        aria-label={`${unreadMessageCount} mensajes sin leer`}
                      >
                        {unreadMessageCount >
                        99
                          ? "99+"
                          : unreadMessageCount}
                      </span>
                    )}
                </NavLink>
              );
            }
          )}
        </nav>

        <div className="sidebar-footer">
          <span className="system-status">
            <span
              className="status-indicator"
              aria-hidden="true"
            />

            SESIÓN ACTIVA
          </span>

          <p>
            Acceso como{" "}
            {getRoleLabel(user.role)}.
          </p>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {isMenuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() =>
            setIsMenuOpen(false)
          }
          aria-label="Cerrar menú lateral"
        />
      )}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() =>
                setIsMenuOpen(true)
              }
              aria-label="Abrir menú principal"
              aria-expanded={isMenuOpen}
              aria-controls="main-sidebar"
            >
              <span aria-hidden="true">
                ☰
              </span>
            </button>

            <div>
              <span className="topbar-label">
                MESA EDITORIAL
              </span>

              <span
                className="topbar-separator"
                aria-hidden="true"
              >
                /
              </span>

              <span className="topbar-section">
                ON AIR STUDIO
              </span>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="demo-badge">
              ENTORNO ACADÉMICO
            </span>

            <div className="user-preview">
              <span
                className="user-avatar"
                aria-hidden="true"
              >
                {userInitial}
              </span>

              <div>
                <strong>
                  {user.name}
                </strong>

                <span>
                  {getRoleLabel(
                    user.role
                  )}
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
          <Outlet />
        </main>

        <footer className="main-footer">
          <span>ONAIR STUDIO IA</span>

          <span>
            Proyecto académico · FWD Academy
          </span>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;