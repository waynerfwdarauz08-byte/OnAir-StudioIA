import useTranslation from "../hooks/useTranslation.js";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
} from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import useAuth from "../hooks/useAuth.js";
import { userService } from "../services/userService.js";

import {
  getRoleLabel,
  ROLES,
} from "../utils/roles.js";

function formatUserDate(dateValue, language) {
  if (!dateValue) {
    return language === "en" ? "Unavailable" : "No disponible";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return language === "en" ? "Unavailable" : "No disponible";
  }

  return new Intl.DateTimeFormat(language === "en" ? "en-US" : "es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Costa_Rica",
  }).format(date);
}

function UsersPage() {
  const { translate, language } = useTranslation();
  const { user: authenticatedUser } = useAuth();
  const location = useLocation();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    location.state?.message || ""
  );

  const [selectedUser, setSelectedUser] =
    useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const userData = await userService.getAll();

      setUsers(
        Array.isArray(userData) ? userData : []
      );
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleDelete() {
    if (!selectedUser) {
      return;
    }

    if (selectedUser.id === authenticatedUser.id) {
      setSelectedUser(null);
      setError(
        "No puedes eliminar el usuario de tu propia sesión."
      );
      return;
    }

    const activeAdministrators = users.filter(
      (userItem) =>
        userItem.role === ROLES.ADMIN &&
        userItem.active
    );

    const isLastActiveAdministrator =
      selectedUser.role === ROLES.ADMIN &&
      selectedUser.active &&
      activeAdministrators.length <= 1;

    if (isLastActiveAdministrator) {
      setSelectedUser(null);
      setError(
        "No puedes eliminar al último administrador activo."
      );
      return;
    }

    setDeleteLoading(true);
    setError("");

    try {
      await userService.remove(selectedUser.id);

      setUsers((currentUsers) =>
        currentUsers.filter(
          (userItem) =>
            userItem.id !== selectedUser.id
        )
      );

      setMessage(
        `El usuario ${selectedUser.name} fue eliminado.`
      );

      setSelectedUser(null);
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  const activeUsers = users.filter(
    (userItem) => userItem.active
  ).length;

  return (
    <>
      <PageHeader
        eyebrow={translate("ADMINISTRACIÓN")}
        title={translate("Gestión de usuarios")}
        description={translate("Registra usuarios, asigna roles y controla el acceso a la plataforma.")}
      >
        <Link
          className="button button-primary"
          to="/admin/users/new"
        >{translate("Registrar usuario")}<span aria-hidden="true">+</span>
        </Link>
      </PageHeader>

      {message && (
        <div className="success-message" role="status">
          <span aria-hidden="true">✓</span>
          <p>{message}</p>

          <button
            type="button"
            aria-label={translate("Cerrar mensaje")}
            onClick={() => setMessage("")}
          >
            ×
          </button>
        </div>
      )}

      {!loading && error && (
        <div className="inline-error" role="alert">
          <p>{translate(error)}</p>

          <button
            type="button"
            onClick={() => setError("")}
          >{translate("Cerrar")}</button>
        </div>
      )}

      <section className="users-summary">
        <article>
          <span>{translate("USUARIOS TOTALES")}</span>
          <strong>{users.length}</strong>
        </article>

        <article>
          <span>{translate("USUARIOS ACTIVOS")}</span>
          <strong>{activeUsers}</strong>
        </article>

        <article>
          <span>{translate("ROLES DISPONIBLES")}</span>
          <strong>3</strong>
        </article>
      </section>

      {loading && (
        <LoadingState message={translate("Cargando usuarios registrados...")} />
      )}

      {!loading && error && users.length === 0 && (
        <ErrorState
          message={error}
          onRetry={loadUsers}
        />
      )}

      {!loading && !error && users.length === 0 && (
        <EmptyState
          title={translate("No hay usuarios registrados")}
          description={translate("Registra el primer usuario de la plataforma.")}
        />
      )}

      {!loading && users.length > 0 && (
        <section
          className="users-grid"
          aria-label={translate("Usuarios registrados")}
        >
          {users.map((userItem) => {
            const isCurrentUser =
              userItem.id === authenticatedUser.id;

            return (
              <article
                className="user-card"
                key={userItem.id}
              >
                <header className="user-card-heading">
                  <span
                    className="user-card-avatar"
                    aria-hidden="true"
                  >
                    {userItem.name
                      .trim()
                      .charAt(0)
                      .toUpperCase()}
                  </span>

                  <div>
                    <div className="user-name-row">
                      <h2>{userItem.name}</h2>

                      {isCurrentUser && (
                        <span className="current-user-label">{translate("TÚ")}</span>
                      )}
                    </div>

                    <p>{userItem.email}</p>
                  </div>
                </header>

                <dl className="user-information">
                  <div>
                    <dt>{translate("Rol")}</dt>
                    <dd>
                      {getRoleLabel(userItem.role, language)}
                    </dd>
                  </div>

                  <div>
                    <dt>{translate("Estado")}</dt>
                    <dd>
                      <span
                        className={
                          userItem.active
                            ? "account-status account-active"
                            : "account-status account-inactive"
                        }
                      >
                        <span aria-hidden="true" />
                        {userItem.active
                          ? translate("Activo")
                          : translate("Inactivo")}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt>{translate("Registro")}</dt>
                    <dd>
                      {formatUserDate(
                        userItem.createdAt, language
                      )}
                    </dd>
                  </div>
                </dl>

                <footer className="user-card-actions">
                  <Link
                    className="button button-secondary"
                    to={`/admin/users/${userItem.id}/edit`}
                  >{translate("Editar")}</Link>

                  <button
                    type="button"
                    className="button button-text-danger"
                    disabled={isCurrentUser}
                    title={
                      isCurrentUser
                        ? translate("No puedes eliminar tu propia sesión")
                        : undefined
                    }
                    onClick={() =>
                      setSelectedUser(userItem)
                    }
                  >{translate("Eliminar")}</button>
                </footer>
              </article>
            );
          })}
        </section>
      )}

      <ConfirmDialog
        open={Boolean(selectedUser)}
        title={translate("Eliminar usuario")}
        message={
          selectedUser
            ? `¿Deseas eliminar a ${selectedUser.name}? Esta acción no se puede deshacer.`
            : ""
        }
        confirmText={translate("Eliminar")}
        danger
        loading={deleteLoading}
        onCancel={() => setSelectedUser(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}

export default UsersPage;
