// =====================================================
// Staff Layout
// Shared navigation used by every Staff Panel page
// =====================================================

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import api from "../services/api";

function StaffLayout() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState(null);

  useEffect(() => {
    const loadStaff = async () => {
      try {
        const response = await api.get("/auth/me");

        setStaff(response.data.staff);
      } catch {
        navigate("/staff/login", {
          replace: true,
        });
      }
    };

    loadStaff();
  }, [navigate]);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      navigate("/staff/login", {
        replace: true,
      });
    }
  };

  const navClass = ({ isActive }) =>
    `
      flex items-center rounded-xl px-4 py-3
      text-sm font-semibold transition
      ${
        isActive
          ? "bg-blue-600 text-white shadow-md shadow-blue-200"
          : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
      }
    `;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="no-print sticky top-0 flex h-screen w-64 flex-shrink-0 flex-col border-r border-blue-100 bg-white/95 p-5 shadow-sm">

          {/* System Name */}
          <div className="mb-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-blue-200">
              ER
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Computer Maintenance
            </p>

            <h1 className="mt-1 text-xl font-black text-slate-900">
              Staff Panel
            </h1>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <NavLink
              to="/staff/dashboard"
              className={navClass}
            >
              Dashboard
            </NavLink>

            <NavLink
              to="/staff/requests"
              className={navClass}
            >
              Reservation Requests
            </NavLink>

            <NavLink
              to="/staff/borrowed"
              className={navClass}
            >
              Borrowed Items
            </NavLink>

            <NavLink
              to="/staff/items"
              className={navClass}
            >
              Equipment
            </NavLink>

            <NavLink
              to="/staff/records"
              className={navClass}
            >
              Records
            </NavLink>

            <NavLink
              to="/staff/settings"
              className={navClass}
            >
              Settings
            </NavLink>
          </nav>

          {/* Staff Account */}
          <div className="mt-auto border-t border-slate-100 pt-5">
            <div className="mb-4 rounded-xl bg-slate-50 p-3">
              <p className="truncate text-sm font-bold text-slate-800">
                {staff?.full_name || "Staff"}
              </p>

              <p className="truncate text-xs text-slate-500">
                Staff No. {staff?.staff_number || "—"}
              </p>
            </div>

            <button
              onClick={logout}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              Log Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="min-w-0 flex-1 p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}

export default StaffLayout;