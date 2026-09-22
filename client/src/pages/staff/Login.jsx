// =====================================================
// REPAIR ROOM - STAFF LOGIN
// CMOB Department
// =====================================================
//
// Light-blue design only.
// Staff accounts are managed internally.
//
// =====================================================

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";


function Login() {
  const navigate =
    useNavigate();

  const [
    form,
    setForm,
  ] = useState({
    full_name:
      "",

    password:
      "",
  });

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);


  const handleChange = (
    event
  ) => {
    setMessage("");

    setForm(
      (
        previous
      ) => ({
        ...previous,

        [event.target.name]:
          event.target.value,
      })
    );
  };


  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      try {
        setLoading(true);
        setMessage("");

        await api.post(
          "/auth/login",
          form
        );

        navigate(
          "/staff/dashboard",
          {
            replace:
              true,
          }
        );
      } catch (error) {
        setMessage(
          error.response
            ?.data
            ?.message ||
            "Incorrect name or password."
        );
      } finally {
        setLoading(false);
      }
    };


  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-100 px-4 py-8">

      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-200/60 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-36 -right-20 h-[28rem] w-[28rem] rounded-full bg-sky-200/50 blur-3xl" />


      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-2xl md:grid-cols-2">

        {/* BRAND PANEL */}

        <div className="hidden min-h-[600px] flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400 p-10 text-white md:flex">

          <div>

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl font-black shadow-lg backdrop-blur">
              RR
            </div>

            <p className="mt-10 text-xs font-black uppercase tracking-[0.22em] text-blue-50">
              CMOB Department
            </p>

            <h1 className="mt-3 text-5xl font-black leading-none">
              REPAIR
              <br />
              ROOM
            </h1>

            <p className="mt-5 max-w-sm leading-7 text-blue-50">
              Equipment reservation, inventory, borrowing and return management.
            </p>

          </div>


          <div className="rounded-2xl border border-white/30 bg-white/15 p-5 backdrop-blur">

            <p className="font-bold">
              Staff Administration
            </p>

            <p className="mt-1 text-sm text-blue-50">
              Authorized CMOB personnel only.
            </p>

          </div>

        </div>


        {/* LOGIN FORM */}

        <div className="p-7 sm:p-10 md:p-12">

          <div className="mb-8 flex items-center gap-3 md:hidden">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-md shadow-blue-200">
              RR
            </div>

            <div>

              <p className="font-black text-slate-900">
                REPAIR ROOM
              </p>

              <p className="text-xs text-blue-600">
                CMOB Department
              </p>

            </div>

          </div>


          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            Staff Access
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Welcome Back
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage Repair Room reservations and equipment.
          </p>


          <form
            onSubmit={
              handleSubmit
            }
            className="mt-8 space-y-5"
          >

            <Field label="Name">

              <input
                type="text"
                name="full_name"
                value={
                  form.full_name
                }
                onChange={
                  handleChange
                }
                placeholder="Enter your name"
                autoComplete="username"
                required
                className={
                  inputClass
                }
              />

            </Field>


            <Field label="Password">

              <input
                type="password"
                name="password"
                value={
                  form.password
                }
                onChange={
                  handleChange
                }
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className={
                  inputClass
                }
              />

            </Field>


            {message && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {
                  message
                }
              </div>
            )}


            <button
              type="submit"
              disabled={
                loading
              }
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60"
            >
              {
                loading
                  ? "Signing in..."
                  : "Sign In"
              }
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}


function Field({
  label,
  children,
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-slate-700">
        {
          label
        }
      </label>

      {
        children
      }

    </div>
  );
}


const inputClass = `
  w-full
  rounded-xl
  border
  border-slate-200
  bg-slate-50
  px-4
  py-3.5
  text-slate-900
  outline-none
  placeholder:text-slate-400
  focus:border-blue-500
  focus:bg-white
  focus:ring-4
  focus:ring-blue-100
`;


export default Login;
