import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "../components/layout/AppLayout.jsx";

import LoginPage from "../pages/LoginPage.jsx";
import DashboardPage from "../pages/DashboardPage.jsx";

import NewsPage from "../pages/NewsPage.jsx";
import NewsCreatePage from "../pages/NewsCreatePage.jsx";
import NewsDetailPage from "../pages/NewsDetailPage.jsx";
import NewsEditPage from "../pages/NewsEditPage.jsx";
import CategoriesPage from "../pages/CategoriesPage.jsx";

import AiEditorPage from "../pages/AiEditorPage.jsx";
import RundownsPage from "../pages/RundownsPage.jsx";
import OnAirPage from "../pages/OnAirPage.jsx";
import BroadcastStudioPage from "../pages/BroadcastStudioPage.jsx";
import TeleprompterPage from "../pages/TeleprompterPage.jsx";
import MessagesPage from "../pages/MessagesPage.jsx";

import UsersPage from "../pages/UsersPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import UserEditPage from "../pages/UserEditPage.jsx";
import ActivityLogsPage from "../pages/ActivityLogsPage.jsx";
import ProjectionsPage from "../pages/ProjectionsPage.jsx";
import PresenterLocationsPage from "../pages/OperationalMapPage.jsx";
import SettingsPage from "../pages/SettingsPage.jsx";

import ForbiddenPage from "../pages/ForbiddenPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

import ProtectedRoute from "./ProtectedRoute.jsx";
import RoleRoute from "./RoleRoute.jsx";
import RoleHomeRedirect from "./RoleHomeRedirect.jsx";

import { ROLES } from "../utils/roles.js";

function AppRoutes() {
  const adminOnly = [
    ROLES.ADMIN,
  ];

  const editorialRoles = [
    ROLES.ADMIN,
    ROLES.MODERATOR,
  ];

  const teleprompterRoles = [
    ROLES.ADMIN,
    ROLES.MODERATOR,
    ROLES.PRESENTER,
  ];

  const messagingRoles = [
    ROLES.ADMIN,
    ROLES.MODERATOR,
    ROLES.PRESENTER,
  ];

  const settingsRoles = [
    ROLES.ADMIN,
    ROLES.MODERATOR,
    ROLES.PRESENTER,
  ];

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route
            path="/"
            element={<RoleHomeRedirect />}
          />

          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={adminOnly}>
                <DashboardPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={adminOnly}>
                <UsersPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/users/new"
            element={
              <RoleRoute allowedRoles={adminOnly}>
                <RegisterPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/users/:id/edit"
            element={
              <RoleRoute allowedRoles={adminOnly}>
                <UserEditPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/activity"
            element={
              <RoleRoute allowedRoles={adminOnly}>
                <ActivityLogsPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/projections"
            element={
              <RoleRoute allowedRoles={adminOnly}>
                <ProjectionsPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/presenter-locations"
            element={
              <RoleRoute allowedRoles={adminOnly}>
                <PresenterLocationsPage />
              </RoleRoute>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <RoleRoute allowedRoles={settingsRoles}>
                <SettingsPage />
              </RoleRoute>
            }
          />

          <Route
            path="/news"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <NewsPage />
              </RoleRoute>
            }
          />

          <Route
            path="/news/new"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <NewsCreatePage />
              </RoleRoute>
            }
          />

          <Route
            path="/news/categories"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <CategoriesPage />
              </RoleRoute>
            }
          />

          <Route
            path="/news/:id/edit"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <NewsEditPage />
              </RoleRoute>
            }
          />

          <Route
            path="/news/:id"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <NewsDetailPage />
              </RoleRoute>
            }
          />

          <Route
            path="/ai-editor"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <AiEditorPage />
              </RoleRoute>
            }
          />

          <Route
            path="/rundowns"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <RundownsPage />
              </RoleRoute>
            }
          />

          <Route
            path="/on-air"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <OnAirPage />
              </RoleRoute>
            }
          />

          <Route
            path="/studio-control"
            element={
              <RoleRoute allowedRoles={editorialRoles}>
                <BroadcastStudioPage />
              </RoleRoute>
            }
          />

          <Route
            path="/teleprompter"
            element={
              <RoleRoute allowedRoles={teleprompterRoles}>
                <TeleprompterPage />
              </RoleRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <RoleRoute allowedRoles={messagingRoles}>
                <MessagesPage />
              </RoleRoute>
            }
          />
        </Route>

        <Route
          path="/403"
          element={<ForbiddenPage />}
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
