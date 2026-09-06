import {
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";

import Documents from "../pages/Documents";
import DocumentUpload from "../pages/DocumentUpload";
import DocumentDetails from "../pages/DocumentDetails";

import ValidationReview from "../pages/ValidationReview";

import MainLayout from "../components/layout/MainLayout";
import Loader from "../components/common/Loader";

import useAuth from "../hooks/useAuth";
import GISMap from "../pages/GISMap";

import AuditHistory from "../pages/AuditHistory";

function ProtectedRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <Loader
          size="large"
          text="Verifying session..."
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}


function GISPlaceholder() {
  return (
    <div className="content-page">
      <div className="page-placeholder-card">
        <h2>GIS Map</h2>

        <p>
          GIS frontend module will be implemented
          in Batch 7.
        </p>
      </div>
    </div>
  );
}





function AppRoutes() {
  return (
    <Routes>

      {/* Public */}

      <Route
        path="/login"
        element={<Login />}
      />


      {/* Protected */}

      <Route
        element={<ProtectedRoute />}
      >

        <Route
          element={<MainLayout />}
        >

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/documents"
            element={<Documents />}
          />

          <Route
            path="/documents/upload"
            element={<DocumentUpload />}
          />

          <Route
            path="/documents/:id"
            element={<DocumentDetails />}
          />

          <Route
            path="/validation/:documentId"
            element={<ValidationReview />}
          />

          <Route
            path="/gis"
            element={<GISMap />}
          />

          <Route
            path="/audit"
            element={<AuditHistory />}
          />

          <Route
            index
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Route>

      </Route>

    </Routes>
  );
}


export default AppRoutes;