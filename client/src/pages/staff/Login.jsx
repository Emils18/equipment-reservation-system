// =====================================================
// Staff Login
// Only Name + Password
// =====================================================

import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      full_name: "",
      password: "",
    });

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]:
        event.target.value,
    });
  };


  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      await api.post(
        "/auth/login",
        form
      );

      navigate(
        "/staff/dashboard",
        {
          replace: true,
        }
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Incorrect name or password."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-6">

      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">

        <div className="hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white md:flex md:flex-col md:justify-between">

          <div>
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-xl font-black">
              ER
            </div>

            <h1 className="text-4xl font-black">
              Equipment
              <br />
              Reservation
            </h1>

            <p className="mt-4 text-blue-100">
              Computer Maintenance Office
            </p>
          </div>

        </div>


        <div className="p-10">

          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Staff Access
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Staff Login
          </h2>


          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            <div>
              <label className="mb-2 block text-sm font-bold">
                Name
              </label>

              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your name"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>


            <div>
              <label className="mb-2 block text-sm font-bold">
                Password
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter password"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>


            {message && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {message}
              </div>
            )}


            <button
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>


          <Link
            to="/staff/register"
            className="mt-5 block w-full rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-center font-bold text-blue-700"
          >
            Register Staff
          </Link>

        </div>

      </div>
    </div>
  );
}

export default Login;