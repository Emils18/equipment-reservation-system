// =====================================================
// REPAIR ROOM - MAIN APPLICATION
// CMOB Department
// =====================================================
//
// LIGHT THEME ONLY.
//
// This file:
// - controls Client + Staff routes
// - controls browser tab names
// - removes any old saved dark-theme setting
//
// =====================================================

import {
  useEffect,
} from "react";

import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import ProtectedStaff from "./components/ProtectedStaff";
import StaffLayout from "./components/StaffLayout";


// Borrower Pages
import Borrow from "./pages/borrower/Borrow";
import Track from "./pages/borrower/Track";


// Staff Pages
import Login from "./pages/staff/Login";
import Dashboard from "./pages/staff/Dashboard";
import Requests from "./pages/staff/Requests";
import Borrowed from "./pages/staff/Borrowed";
import Items from "./pages/staff/Items";
import Records from "./pages/staff/Records";
import Settings from "./pages/staff/Settings";


function App() {
  const location =
    useLocation();


  // ===================================================
  // FORCE LIGHT MODE ONLY
  // ===================================================
  //
  // Removes the old Dark/Light system completely.
  //
  // colorScheme = "light" also keeps native browser
  // date/time/calendar icons visible correctly.
  //
  useEffect(() => {
    document.documentElement.removeAttribute(
      "data-theme"
    );

    document.documentElement.style.colorScheme =
      "light";

    try {
      localStorage.removeItem(
        "repair_room_theme"
      );
    } catch {
      // Ignore localStorage error.
    }
  }, []);


  // ===================================================
  // BROWSER TAB TITLE
  // ===================================================

  useEffect(() => {
    if (
      location.pathname.startsWith(
        "/staff"
      )
    ) {
      document.title =
        "Staff | Repair Room";
    } else {
      document.title =
        "Client | Repair Room";
    }
  }, [
    location.pathname,
  ]);


  return (
    <Routes>

      {/* ===============================================
          CLIENT / BORROWER
          =============================================== */}

      <Route
        path="/"
        element={
          <Navigate
            to="/borrow"
            replace
          />
        }
      />


      <Route
        path="/borrow"
        element={
          <Borrow />
        }
      />


      <Route
        path="/track"
        element={
          <Track />
        }
      />


      {/* ===============================================
          STAFF LOGIN
          =============================================== */}

      <Route
        path="/staff/login"
        element={
          <Login />
        }
      />


      {/* ===============================================
          STAFF PANEL
          =============================================== */}

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
          element={
            <Dashboard />
          }
        />


        <Route
          path="requests"
          element={
            <Requests />
          }
        />


        <Route
          path="borrowed"
          element={
            <Borrowed />
          }
        />


        <Route
          path="items"
          element={
            <Items />
          }
        />


        <Route
          path="records"
          element={
            <Records />
          }
        />


        <Route
          path="settings"
          element={
            <Settings />
          }
        />

      </Route>


      {/* ===============================================
          UNKNOWN URL
          =============================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/borrow"
            replace
          />
        }
      />

    </Routes>
  );
}


export default App;