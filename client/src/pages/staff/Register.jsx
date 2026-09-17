// =====================================================
// Staff Registration
// Only Name + Password
// Account number is generated automatically.
// =====================================================

import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../../services/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState({
      full_name: "",
      password: "",
      confirm_password: "",
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

    setMessage("");

    if (
      form.password !==
      form.confirm_password
    ) {
      setMessage(
        "Passwords do not match."
      );

      return;
    }

    setLoading(true);

    try {
      const response =
        await api.post(
          "/auth/register",
          {
            full_name:
              form.full_name,

            password:
              form.password,
          }
        );

      alert(
        `Account created successfully.\nAccount Number: ${response.data.account_number}`
      );

      navigate(
        "/staff/login",
        {
          replace: true,
        }
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Could not create staff account."
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-6">

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">

        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Staff Account
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Register Staff
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Enter staff name and password.
        </p>


        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Full Name
            </label>

            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter staff name"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>


          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
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


          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Confirm Password
            </label>

            <input
              type="password"
              name="confirm_password"
              value={
                form.confirm_password
              }
              onChange={handleChange}
              placeholder="Enter password again"
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
            className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading
              ? "Creating..."
              : "Create Account"}
          </button>

        </form>


        <Link
          to="/staff/login"
          className="mt-4 block text-center text-sm font-bold text-blue-600"
        >
          Back to Login
        </Link>

      </div>
    </div>
  );
}

export default Register;