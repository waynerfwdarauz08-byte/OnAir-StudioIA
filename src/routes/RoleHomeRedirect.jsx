import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";
import { getDefaultRouteByRole } from "../utils/roles.js";

function RoleHomeRedirect() {
  const { user } = useAuth();

  return (
    <Navigate
      to={getDefaultRouteByRole(user?.role)}
      replace
    />
  );
}

export default RoleHomeRedirect;