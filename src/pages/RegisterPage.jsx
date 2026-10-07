import useTranslation from "../hooks/useTranslation.js";
import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import PageHeader from "../components/common/PageHeader.jsx";
import UserForm from "../components/users/UserForm.jsx";
import { userService } from "../services/userService.js";

function RegisterPage() {
  const { translate } = useTranslation();
  const navigate = useNavigate();

  const [submitting, setSubmitting] =
    useState(false);

  const [serverError, setServerError] =
    useState("");

  async function handleCreate(formData) {
    setSubmitting(true);
    setServerError("");

    try {
      const matchingUsers =
        await userService.getByEmail(
          formData.email
        );

      if (
        Array.isArray(matchingUsers) &&
        matchingUsers.length > 0
      ) {
        setServerError(
          "Ya existe un usuario con ese correo electrónico."
        );
        return;
      }

      const now = new Date().toISOString();

      await userService.create({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        active: formData.active,
        createdAt: now,
        updatedAt: now,
      });

      navigate("/admin/users", {
        replace: true,
        state: {
          message: "El usuario fue registrado correctamente.",
        },
      });
    } catch (createError) {
      setServerError(createError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={translate("ADMINISTRACIÓN / USUARIOS")}
        title={translate("Registrar usuario")}
        description={translate("Crea una cuenta interna y asigna las funciones que podrá utilizar.")}
      />

      <UserForm
        mode="create"
        submitting={submitting}
        serverError={serverError}
        onSubmit={handleCreate}
        onCancel={() =>
          navigate("/admin/users")
        }
      />
    </>
  );
}

export default RegisterPage;