// =====================================================
// Staff Settings
// Name + automatic account number + password
// =====================================================

import {
  useEffect,
  useState,
} from "react";

import api from "../../services/api";


function Settings() {
  const [
    profile,
    setProfile,
  ] = useState({
    id: null,
    full_name: "",
  });


  const [
    password,
    setPassword,
  ] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    messageType,
    setMessageType,
  ] = useState(
    "success"
  );


  const [
    savingProfile,
    setSavingProfile,
  ] = useState(false);


  const [
    savingPassword,
    setSavingPassword,
  ] = useState(false);


  // =====================================================
  // Load Staff Profile
  // =====================================================

  const loadProfile =
    async () => {
      try {
        const response =
          await api.get(
            "/auth/me"
          );


        setProfile({
          id:
            response.data
              .staff.id,

          full_name:
            response.data
              .staff.full_name ||
            "",
        });
      } catch (error) {
        console.error(
          "Profile load error:",
          error
        );
      }
    };


  useEffect(() => {
    loadProfile();
  }, []);


  // =====================================================
  // Message
  // =====================================================

  const showMessage =
    (
      text,
      type = "success"
    ) => {
      setMessage(
        text
      );

      setMessageType(
        type
      );
    };


  // =====================================================
  // Save Profile
  // =====================================================

  const saveProfile =
    async (
      event
    ) => {
      event.preventDefault();


      try {
        setSavingProfile(
          true
        );


        await api.put(
          "/auth/profile",
          {
            full_name:
              profile.full_name,
          }
        );


        showMessage(
          "Account information updated."
        );


        await loadProfile();
      } catch (error) {
        showMessage(
          error.response
            ?.data
            ?.message ||
            "Could not update account.",

          "error"
        );
      } finally {
        setSavingProfile(
          false
        );
      }
    };


  // =====================================================
  // Change Password
  // =====================================================

  const changePassword =
    async (
      event
    ) => {
      event.preventDefault();


      if (
        password.new_password !==
        password.confirm_password
      ) {
        showMessage(
          "New passwords do not match.",
          "error"
        );

        return;
      }


      try {
        setSavingPassword(
          true
        );


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


        showMessage(
          "Password changed successfully."
        );
      } catch (error) {
        showMessage(
          error.response
            ?.data
            ?.message ||
            "Could not change password.",

          "error"
        );
      } finally {
        setSavingPassword(
          false
        );
      }
    };


  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">

      <div className="mb-7">

        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
          Account
        </p>


        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
          Settings
        </h1>


        <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
          Manage your Staff Panel account.
        </p>

      </div>


      {message && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm font-semibold ${
            messageType ===
            "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-blue-100 bg-blue-50 text-blue-700"
          }`}
        >
          {message}
        </div>
      )}


      {/* =================================================
          Staff Information
          ================================================= */}

      <form
        onSubmit={
          saveProfile
        }
        className="mb-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
      >

        <h2 className="text-xl font-black tracking-tight text-slate-900">
          Staff Information
        </h2>


        <p className="mt-1 text-sm text-slate-500">
          Your account number is generated automatically.
        </p>


        <div className="mt-5 space-y-4">

          <div>

            <label className="mb-2 block text-sm font-bold text-slate-700">
              Account Number
            </label>


            <input
              value={
                profile.id
                  ? `#${String(
                      profile.id
                    ).padStart(
                      4,
                      "0"
                    )}`
                  : "Loading..."
              }
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 font-mono font-bold text-slate-500"
            />

          </div>


          <div>

            <label className="mb-2 block text-sm font-bold text-slate-700">
              Full Name
            </label>


            <input
              type="text"
              value={
                profile.full_name
              }
              onChange={(
                event
              ) =>
                setProfile({
                  ...profile,

                  full_name:
                    event.target
                      .value,
                })
              }
              required
              autoComplete="name"
              placeholder="Full name"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

          </div>


          <button
            type="submit"
            disabled={
              savingProfile
            }
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 sm:w-auto"
          >
            {savingProfile
              ? "Saving..."
              : "Save Account"}
          </button>

        </div>

      </form>


      {/* =================================================
          Password
          ================================================= */}

      <form
        onSubmit={
          changePassword
        }
        className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
      >

        <h2 className="text-xl font-black tracking-tight text-slate-900">
          Change Password
        </h2>


        <p className="mt-1 text-sm leading-6 text-slate-500">
          Closing the browser will not sign you out.
          Use the Log Out button when you want to end the session.
        </p>


        <div className="mt-5 space-y-4">

          <input
            type="password"
            value={
              password.current_password
            }
            onChange={(
              event
            ) =>
              setPassword({
                ...password,

                current_password:
                  event.target
                    .value,
              })
            }
            autoComplete="current-password"
            placeholder="Current password"
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />


          <input
            type="password"
            value={
              password.new_password
            }
            onChange={(
              event
            ) =>
              setPassword({
                ...password,

                new_password:
                  event.target
                    .value,
              })
            }
            autoComplete="new-password"
            placeholder="New password"
            minLength="4"
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />


          <input
            type="password"
            value={
              password.confirm_password
            }
            onChange={(
              event
            ) =>
              setPassword({
                ...password,

                confirm_password:
                  event.target
                    .value,
              })
            }
            autoComplete="new-password"
            placeholder="Confirm new password"
            minLength="4"
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />


          <button
            type="submit"
            disabled={
              savingPassword
            }
            className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 sm:w-auto"
          >
            {savingPassword
              ? "Changing..."
              : "Change Password"}
          </button>

        </div>

      </form>

    </div>
  );
}


export default Settings;