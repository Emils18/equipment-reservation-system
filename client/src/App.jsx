// =====================================================
// Main Application Routes
// =====================================================

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedStaff from "./components/ProtectedStaff";
import StaffLayout from "./components/StaffLayout";

import Login from "./pages/staff/Login";
import Register from "./pages/staff/Register";
import Dashboard from "./pages/staff/Dashboard";
import Requests from "./pages/staff/Requests";
import Borrowed from "./pages/staff/Borrowed";
import Items from "./pages/staff/Items";
import Records from "./pages/staff/Records";
import Settings from "./pages/staff/Settings";

function App() {
  return (
    <Routes>
      {/* Temporary default while we finish Staff Panel */}
      <Route
        path="/"
        element={<Navigate to="/staff/login" replace />}
      />

      {/* Staff Authentication */}
      <Route
        path="/staff/login"
        element={<Login />}
      />

      <Route
        path="/staff/register"
        element={<Register />}
      />

      {/* Protected Staff Panel */}
      <Route
        path="/staff"
        element={
          <ProtectedStaff>
            <StaffLayout />
          </ProtectedStaff>
        }
      >
        <Route
          index
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={<Dashboard />}
        />

        <Route
          path="requests"
          element={<Requests />}
        />

        <Route
          path="borrowed"
          element={<Borrowed />}
        />

        <Route
          path="items"
          element={<Items />}
        />

        <Route
          path="records"
          element={<Records />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />
      </Route>
    </Routes>
  );
}

export default App;