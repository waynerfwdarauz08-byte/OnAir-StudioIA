import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

function RoleRoute({
  allowedRoles,
  children,
}) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

export default RoleRoute;