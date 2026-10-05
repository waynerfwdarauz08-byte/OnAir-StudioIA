import { lazy, Suspense } from "react";
import { LoadingState } from "../components/common/FeedbackStates.jsx";
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";

import AppLayout from "../components/layout/AppLayout.jsx";

const LoginPage = lazy(() => import("../pages/LoginPage.jsx"));
const DashboardPage = lazy(() => import("../pages/DashboardPage.jsx"));

const NewsPage = lazy(() => import("../pages/NewsPage.jsx"));
const NewsCreatePage = lazy(() => import("../pages/NewsCreatePage.jsx"));
const NewsDetailPage = lazy(() => import("../pages/NewsDetailPage.jsx"));
const NewsEditPage = lazy(() => import("../pages/NewsEditPage.jsx"));
const CategoriesPage = lazy(() => import("../pages/CategoriesPage.jsx"));

const AiEditorPage = lazy(() => import("../pages/AiEditorPage.jsx"));
const RundownsPage = lazy(() => import("../pages/RundownsPage.jsx"));
const OnAirPage = lazy(() => import("../pages/OnAirPage.jsx"));
const BroadcastStudioPage = lazy(() => import("../pages/BroadcastStudioPage.jsx"));
const TeleprompterPage = lazy(() => import("../pages/TeleprompterPage.jsx"));
const MessagesPage = lazy(() => import("../pages/MessagesPage.jsx"));

const UsersPage = lazy(() => import("../pages/UsersPage.jsx"));
const RegisterPage = lazy(() => import("../pages/RegisterPage.jsx"));
const UserEditPage = lazy(() => import("../pages/UserEditPage.jsx"));
const ActivityLogsPage = lazy(() => import("../pages/ActivityLogsPage.jsx"));
const ProjectionsPage = lazy(() => import("../pages/ProjectionsPage.jsx"));
const PresenterLocationsPage = lazy(() => import("../pages/OperationalMapPage.jsx"));
const SettingsPage = lazy(() => import("../pages/SettingsPage.jsx"));

const ForbiddenPage = lazy(() => import("../pages/ForbiddenPage.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));

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
      <Suspense fallback={<LoadingState message="Cargando módulo..." />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRoutes;
