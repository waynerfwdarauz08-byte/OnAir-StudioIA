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
  getRoleLabel,
  ROLES,
} from "../../utils/roles.js";

const menuItems = [
  {
    path: "/dashboard",
    number: "01",
    label: "Vista general",
    roles: [ROLES.ADMIN],
  },
  {
    path: "/news",
    number: "02",
    label: "Noticias",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/ai-editor",
    number: "03",
    label: "Redacción IA",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/rundowns",
    number: "04",
    label: "Escaletas",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/on-air",
    number: "05",
    label: "Control al aire",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/studio-control",
    number: "06",
    label: "Control de estudio",
    roles: [ROLES.ADMIN, ROLES.MODERATOR],
  },
  {
    path: "/teleprompter",
    number: "07",
    label: "Teleprompter",
    roles: [ROLES.ADMIN, ROLES.PRESENTER],
  },
  {
    path: "/admin/users",
    number: "08",
    label: "Usuarios",
    roles: [ROLES.ADMIN],
  },
];

function AppLayout() {
  const [isMenuOpen, setIsMenuOpen] =
    useState(false);

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

  const visibleMenuItems = menuItems.filter(
    (item) => item.roles.includes(user.role)
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
          isMenuOpen ? "sidebar-open" : ""
        }`}
        aria-label="Menú principal"
      >
        <div className="sidebar-heading">
          <NavLink
            to="/"
            className="brand"
            aria-label="OnAir Studio AI, página principal"
          >
            <BrandLogo className="sidebar-brand-logo" />
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
          {visibleMenuItems.map((item) => (
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

              <span>{item.label}</span>
            </NavLink>
          ))}
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
                <strong>{user.name}</strong>

                <span>
                  {getRoleLabel(user.role)}
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
          <span>ONAIR STUDIO AI</span>

          <span>
            Proyecto académico · FWD Academy
          </span>
        </footer>
      </div>
    </div>
  );
}

export default AppLayout;