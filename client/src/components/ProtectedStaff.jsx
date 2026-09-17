// =====================================================
// Protected Staff Route
// Prevents unauthenticated users from opening Staff Panel
// =====================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

function ProtectedStaff({ children }) {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    const checkLogin = async () => {
      try {
        await api.get("/auth/me");

        if (active) {
          setChecking(false);
        }
      } catch {
        if (active) {
          navigate("/staff/login", {
            replace: true,
          });
        }
      }
    };

    checkLogin();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sky-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />

          <p className="mt-4 font-medium text-slate-500">
            Opening Staff Panel...
          </p>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedStaff;