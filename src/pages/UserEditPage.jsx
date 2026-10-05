import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import UserForm from "../components/users/UserForm.jsx";

import {
  ErrorState,
  LoadingState,
} from "../components/common/FeedbackStates.jsx";

import useAuth from "../hooks/useAuth.js";
import { userService } from "../services/userService.js";
import { ROLES } from "../utils/roles.js";

function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user: authenticatedUser, restoreSession } = useAuth();

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [serverError, setServerError] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      setLoading(true);
      setLoadError("");

      try {
        const userData =
          await userService.getById(
            id,
            controller.signal
          );

        if (!controller.signal.aborted) {
          setSelectedUser(userData);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(error.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      controller.abort();
    };
  }, [id, reloadKey]);

  async function handleUpdate(formData) {
    setSubmitting(true);
    setServerError("");

    try {
      const matchingUsers =
        await userService.getByEmail(
          formData.email
        );

      const duplicatedEmail =
        Array.isArray(matchingUsers) &&
        matchingUsers.some(
          (userItem) => userItem.id !== id
        );

      if (duplicatedEmail) {
        setServerError(
          "Ya existe otro usuario con ese correo electrónico."
        );
        return;
      }

      const isRemovingAdministratorAccess =
        selectedUser.role === ROLES.ADMIN &&
        selectedUser.active &&
        (
          formData.role !== ROLES.ADMIN ||
          !formData.active
        );

      if (isRemovingAdministratorAccess) {
        const allUsers =
          await userService.getAll();

        const activeAdministrators =
          allUsers.filter(
            (userItem) =>
              userItem.role === ROLES.ADMIN &&
              userItem.active
          );

        if (activeAdministrators.length <= 1) {
          setServerError(
            "No puedes desactivar o cambiar el rol del último administrador activo."
          );
          return;
        }
      }

      const updatedUser = {
        ...selectedUser,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        active: formData.active,
        password:
          formData.password ||
          selectedUser.password,
        updatedAt: new Date().toISOString(),
      };

      await userService.update(
        id,
        updatedUser
      );

      if (selectedUser.id === authenticatedUser.id) {
        await restoreSession();
      }

      navigate("/admin/users", {
        replace: true,
        state: {
          message:
            "Los datos del usuario fueron actualizados.",
        },
      });
    } catch (updateError) {
      setServerError(updateError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const isEditingCurrentUser =
    selectedUser?.id === authenticatedUser.id;

  return (
    <>
      <PageHeader
        eyebrow="ADMINISTRACIÓN / USUARIOS"
        title="Editar usuario"
        description="Actualiza los datos, permisos y estado de la cuenta seleccionada."
      />

      {loading && (
        <LoadingState message="Cargando información del usuario..." />
      )}

      {!loading && loadError && (
        <ErrorState
          message={loadError}
          onRetry={() =>
            setReloadKey(
              (currentValue) =>
                currentValue + 1
            )
          }
        />
      )}

      {!loading && !loadError && selectedUser && (
        <UserForm
          mode="edit"
          initialValues={selectedUser}
          submitting={submitting}
          serverError={serverError}
          lockRole={isEditingCurrentUser}
          lockActive={isEditingCurrentUser}
          onSubmit={handleUpdate}
          onCancel={() =>
            navigate("/admin/users")
          }
        />
      )}
    </>
  );
}

export default UserEditPage;
