// =====================================================
// Borrowed Items
// Monitor equipment that has already been released
// =====================================================

import { useEffect, useState } from "react";

import api from "../../services/api";
import socket from "../../services/socket";

function Borrowed() {
  const [borrowed, setBorrowed] = useState([]);
  const [selected, setSelected] = useState(null);

  const loadBorrowed = async () => {
    try {
      const response = await api.get(
        "/staff/borrowed"
      );

      setBorrowed(
        response.data.borrowed || []
      );
    } catch (error) {
      console.error(
        "Borrowed error:",
        error
      );
    }
  };

  useEffect(() => {
    loadBorrowed();

    socket.on(
      "reservation_updated",
      loadBorrowed
    );

    return () => {
      socket.off(
        "reservation_updated",
        loadBorrowed
      );
    };
  }, []);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString(
          "en-PH",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          }
        )
      : "—";

  const markReturned = async (
    reservation
  ) => {
    const confirmed = window.confirm(
      `Mark ${reservation.items} as returned?`
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/staff/reservations/${reservation.id}/status`,
        {
          status: "returned",
          message:
            "Equipment has been returned successfully.",
        }
      );

      setSelected(null);

      await loadBorrowed();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not mark item as returned."
      );
    }
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Monitoring
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          Borrowed Items
        </h1>

        <p className="mt-2 text-slate-500">
          See who currently has equipment and when it must
          be returned.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-50/70">
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">
                  Borrower
                </th>

                <th className="px-6 py-4">
                  Department
                </th>

                <th className="px-6 py-4">
                  Equipment
                </th>

                <th className="px-6 py-4">
                  Return Date
                </th>

                <th className="px-6 py-4">
                  Status
                </th>

                <th className="px-6 py-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {borrowed.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-6 py-5">
                    <p className="font-bold text-slate-900">
                      {item.requester_name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.school_id || "No ID"}
                    </p>
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {item.department}
                  </td>

                  <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                    {item.items}
                  </td>

                  <td className="px-6 py-5 text-sm text-slate-600">
                    {formatDate(item.end_date)}
                  </td>

                  <td className="px-6 py-5">
                    {item.is_overdue ? (
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                        Overdue
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        Borrowed
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setSelected(item)
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600"
                      >
                        View
                      </button>

                      <button
                        onClick={() =>
                          markReturned(item)
                        }
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white"
                      >
                        Mark Returned
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {borrowed.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-14 text-center font-medium text-slate-500"
                  >
                    No equipment is currently borrowed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-bold text-blue-600">
                  {selected.reference_code}
                </p>

                <h2 className="text-2xl font-black">
                  {selected.requester_name}
                </h2>
              </div>

              <button
                onClick={() =>
                  setSelected(null)
                }
                className="text-3xl text-slate-400"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl bg-slate-50 p-5">
              <p>
                <strong>Department:</strong>{" "}
                {selected.department}
              </p>

              <p>
                <strong>School ID:</strong>{" "}
                {selected.school_id || "—"}
              </p>

              <p>
                <strong>Equipment:</strong>{" "}
                {selected.items}
              </p>

              <p>
                <strong>Purpose:</strong>{" "}
                {selected.purpose}
              </p>

              <p>
                <strong>Return:</strong>{" "}
                {formatDate(
                  selected.end_date
                )}
              </p>
            </div>

            <button
              onClick={() =>
                markReturned(selected)
              }
              className="mt-5 w-full rounded-xl bg-blue-600 py-3 font-bold text-white"
            >
              Mark as Returned
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Borrowed;