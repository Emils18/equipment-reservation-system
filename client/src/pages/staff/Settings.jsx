// =====================================================
// Staff Settings
// Update profile information and password
// =====================================================

import { useEffect, useState } from "react";

import api from "../../services/api";

function Settings() {
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
  });

  const [password, setPassword] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const response = await api.get(
        "/auth/me"
      );

      setProfile({
        full_name:
          response.data.staff.full_name,
        username:
          response.data.staff.username,
      });
    };

    loadProfile();
  }, []);

  const saveProfile = async (
    event
  ) => {
    event.preventDefault();

    try {
      await api.put(
        "/auth/profile",
        profile
      );

      setMessage(
        "Account information updated."
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not update account."
      );
    }
  };

  const changePassword = async (
    event
  ) => {
    event.preventDefault();

    if (
      password.new_password !==
      password.confirm_password
    ) {
      setMessage(
        "New passwords do not match."
      );

      return;
    }

    try {
      await api.put(
        "/auth/password",
        {
          current_password:
            password.current_password,
          new_password:
            password.new_password,
        }
      );

      setPassword({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setMessage(
        "Password changed successfully."
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not change password."
      );
    }
  };

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Account
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          Settings
        </h1>

        <p className="mt-2 text-slate-500">
          Manage your Staff Panel account.
        </p>
      </div>

      {message && (
        <div className="mb-5 rounded-xl bg-blue-50 px-4 py-3 font-semibold text-blue-700">
          {message}
        </div>
      )}

      <form
        onSubmit={saveProfile}
        className="mb-6 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-black">
          Staff Information
        </h2>

        <div className="mt-5 space-y-4">
          <input
            value={profile.full_name}
            onChange={(event) =>
              setProfile({
                ...profile,
                full_name:
                  event.target.value,
              })
            }
            placeholder="Full name"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          />

          <input
            value={profile.username}
            onChange={(event) =>
              setProfile({
                ...profile,
                username:
                  event.target.value,
              })
            }
            placeholder="Username"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          />

          <button className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white">
            Save Account
          </button>
        </div>
      </form>

      <form
        onSubmit={changePassword}
        className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm"
      >
        <h2 className="text-xl font-black">
          Change Password
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Closing the browser will not sign you out. Use
          the Log Out button when you want to end the
          session.
        </p>

        <div className="mt-5 space-y-4">
          <input
            type="password"
            value={
              password.current_password
            }
            onChange={(event) =>
              setPassword({
                ...password,
                current_password:
                  event.target.value,
              })
            }
            placeholder="Current password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          />

          <input
            type="password"
            value={
              password.new_password
            }
            onChange={(event) =>
              setPassword({
                ...password,
                new_password:
                  event.target.value,
              })
            }
            placeholder="New password"
            minLength="6"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          />

          <input
            type="password"
            value={
              password.confirm_password
            }
            onChange={(event) =>
              setPassword({
                ...password,
                confirm_password:
                  event.target.value,
              })
            }
            placeholder="Confirm new password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
          />

          <button className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">
            Change Password
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;