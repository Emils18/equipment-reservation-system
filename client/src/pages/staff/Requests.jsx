// =====================================================
// Staff Reservation Requests
// Review, approve, reject, finalize, and release requests
// =====================================================

import { useEffect, useState } from "react";

import api from "../../services/api";
import socket from "../../services/socket";

function Requests() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [action, setAction] = useState(null);

  const loadRequests = async () => {
    try {
      const response = await api.get(
        "/staff/requests"
      );

      setRequests(
        response.data.requests || []
      );
    } catch (error) {
      console.error(
        "Requests error:",
        error
      );
    }
  };

  useEffect(() => {
    loadRequests();

    socket.on(
      "reservation_created",
      loadRequests
    );

    socket.on(
      "reservation_updated",
      loadRequests
    );

    return () => {
      socket.off(
        "reservation_created",
        loadRequests
      );

      socket.off(
        "reservation_updated",
        loadRequests
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

  const statusStyle = (status) => {
    if (status === "pending") {
      return "bg-amber-50 text-amber-700";
    }

    if (status === "approved") {
      return "bg-blue-50 text-blue-700";
    }

    if (status === "finalized") {
      return "bg-violet-50 text-violet-700";
    }

    return "bg-slate-100 text-slate-600";
  };

  const openAction = (
    request,
    nextStatus
  ) => {
    setSelected(request);
    setAction(nextStatus);

    if (nextStatus === "approved") {
      setMessage(
        "Your reservation has been approved. Please proceed to the Repair Room to complete the physical form and required signatures."
      );
    } else {
      setMessage("");
    }
  };

  const updateStatus = async () => {
    try {
      await api.patch(
        `/staff/reservations/${selected.id}/status`,
        {
          status: action,
          message,
        }
      );

      setSelected(null);
      setAction(null);
      setMessage("");

      await loadRequests();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Could not update request."
      );
    }
  };

  return (
    <div className="animate-fade-up">

      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Reservations
        </p>

        <h1 className="mt-1 text-3xl font-black text-slate-900">
          Reservation Requests
        </h1>

        <p className="mt-2 text-slate-500">
          Review online requests before borrowers complete
          the physical form.
        </p>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-white p-12 text-center shadow-sm">
            <p className="font-semibold text-slate-500">
              No active reservation requests.
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-black text-slate-900">
                      {request.requester_name}
                    </h2>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {request.department}
                  </p>

                  <div className="mt-4 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>
                      <strong>Item:</strong>{" "}
                      {request.items || "—"}
                    </p>

                    <p>
                      <strong>Reference:</strong>{" "}
                      {request.reference_code}
                    </p>

                    <p>
                      <strong>Schedule:</strong>{" "}
                      {formatDate(
                        request.start_date
                      )}{" "}
                      –{" "}
                      {formatDate(
                        request.end_date
                      )}
                    </p>

                    <p>
                      <strong>Purpose:</strong>{" "}
                      {request.purpose}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setSelected(request);
                      setAction("view");
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    View
                  </button>

                  {request.status ===
                    "pending" && (
                    <>
                      <button
                        onClick={() =>
                          openAction(
                            request,
                            "approved"
                          )
                        }
                        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-600"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() =>
                          openAction(
                            request,
                            "rejected"
                          )
                        }
                        className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-600"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {request.status ===
                    "approved" && (
                    <button
                      onClick={() =>
                        openAction(
                          request,
                          "finalized"
                        )
                      }
                      className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700"
                    >
                      Physical Form Signed
                    </button>
                  )}

                  {request.status ===
                    "finalized" && (
                    <button
                      onClick={() =>
                        openAction(
                          request,
                          "released"
                        )
                      }
                      className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                    >
                      Release Item
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-7 shadow-2xl">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-blue-600">
                  {selected.reference_code}
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  {selected.requester_name}
                </h2>
              </div>

              <button
                onClick={() => {
                  setSelected(null);
                  setAction(null);
                }}
                className="text-3xl text-slate-400"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-2">
              <Detail
                title="Department"
                value={selected.department}
              />

              <Detail
                title="School ID"
                value={selected.school_id}
              />

              <Detail
                title="Instructor"
                value={selected.instructor_name}
              />

              <Detail
                title="Subject"
                value={selected.subject}
              />

              <Detail
                title="Location"
                value={selected.location}
              />

              <Detail
                title="Equipment"
                value={selected.items}
              />

              <Detail
                title="Start Date"
                value={formatDate(
                  selected.start_date
                )}
              />

              <Detail
                title="Return Date"
                value={formatDate(
                  selected.end_date
                )}
              />

              <div className="md:col-span-2">
                <Detail
                  title="Purpose"
                  value={selected.purpose}
                />
              </div>
            </div>

            {action !== "view" && (
              <>
                <label className="mt-6 block text-sm font-bold text-slate-700">
                  Message to Borrower
                </label>

                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(
                      event.target.value
                    )
                  }
                  rows="4"
                  placeholder="Optional message..."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <button
                  onClick={updateStatus}
                  className="mt-4 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  Confirm{" "}
                  {action === "approved"
                    ? "Approval"
                    : action === "rejected"
                      ? "Rejection"
                      : action ===
                          "finalized"
                        ? "Physical Signing"
                        : "Release"}
                </button>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

function Detail({ title, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <p className="mt-1 font-semibold text-slate-800">
        {value || "—"}
      </p>
    </div>
  );
}

export default Requests;