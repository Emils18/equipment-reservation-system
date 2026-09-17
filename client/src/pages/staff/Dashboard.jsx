// =====================================================
// Staff Dashboard
// Real-time overview of reservations and equipment
// =====================================================

import { useEffect, useState } from "react";

import api from "../../services/api";
import socket from "../../services/socket";

function Dashboard() {
  const [data, setData] = useState({
    pending: 0,
    approved: 0,
    borrowed: 0,
    overdue: 0,
    equipment: 0,
    recent: [],
  });

  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const response = await api.get(
        "/staff/dashboard"
      );

      setData(response.data);
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    socket.on(
      "reservation_created",
      loadDashboard
    );

    socket.on(
      "reservation_updated",
      loadDashboard
    );

    return () => {
      socket.off(
        "reservation_created",
        loadDashboard
      );

      socket.off(
        "reservation_updated",
        loadDashboard
      );
    };
  }, []);

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const cards = [
    {
      title: "Pending Requests",
      value: data.pending,
      style:
        "from-amber-400 to-orange-500",
      background: "bg-amber-50",
    },
    {
      title: "Approved",
      value: data.approved,
      style:
        "from-blue-500 to-indigo-600",
      background: "bg-blue-50",
    },
    {
      title: "Currently Borrowed",
      value: data.borrowed,
      style:
        "from-emerald-500 to-teal-600",
      background: "bg-emerald-50",
    },
    {
      title: "Overdue",
      value: data.overdue,
      style:
        "from-rose-500 to-red-600",
      background: "bg-rose-50",
    },
    {
      title: "Active Equipment",
      value: data.equipment,
      style:
        "from-violet-500 to-purple-600",
      background: "bg-violet-50",
    },
  ];

  return (
    <div className="animate-fade-up">

      {/* Heading */}
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Current equipment reservation and borrowing
          activity.
        </p>
      </div>

      {/* Cards */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.background} overflow-hidden rounded-2xl border border-white shadow-sm`}
          >
            <div className="p-5">
              <p className="text-sm font-bold text-slate-600">
                {card.title}
              </p>

              <p className="mt-3 text-4xl font-black text-slate-900">
                {loading ? "—" : card.value}
              </p>
            </div>

            <div
              className={`h-1.5 bg-gradient-to-r ${card.style}`}
            />
          </div>
        ))}
      </div>

      {/* Recent Requests */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-xl font-black text-slate-900">
            Recent Requests
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest reservation activity.
          </p>
        </div>

        {data.recent?.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-slate-500">
              No reservation requests yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-blue-50/60">
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4">
                    Reference
                  </th>

                  <th className="px-6 py-4">
                    Borrower
                  </th>

                  <th className="px-6 py-4">
                    Department
                  </th>

                  <th className="px-6 py-4">
                    Item
                  </th>

                  <th className="px-6 py-4">
                    Date
                  </th>

                  <th className="px-6 py-4">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.recent?.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-mono text-sm font-bold text-blue-600">
                      {request.reference_code}
                    </td>

                    <td className="px-6 py-4 font-semibold">
                      {request.requester_name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {request.department}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {request.items || "—"}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(
                        request.start_date
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold capitalize text-blue-700">
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default Dashboard;