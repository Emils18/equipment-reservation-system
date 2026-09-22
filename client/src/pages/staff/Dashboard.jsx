// =====================================================
// REPAIR ROOM - STAFF DASHBOARD
// CMOB Department
// =====================================================
//
// Light-blue Staff dashboard.
// Real-time counts refresh automatically through Socket.IO.
//
// =====================================================

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "../../services/api";
import socket from "../../services/socket";


function Dashboard() {
  const [
    data,
    setData,
  ] = useState({
    pending: 0,
    approved: 0,
    borrowed: 0,
    overdue: 0,
    equipment: 0,
    recent: [],
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    liveNotice,
    setLiveNotice,
  ] = useState("");


  // ===================================================
  // LOAD DASHBOARD
  // ===================================================

  const loadDashboard =
    useCallback(async () => {
      try {
        const response =
          await api.get(
            "/staff/dashboard"
          );

        setData({
          pending:
            Number(response.data.pending) || 0,

          approved:
            Number(response.data.approved) || 0,

          borrowed:
            Number(response.data.borrowed) || 0,

          overdue:
            Number(response.data.overdue) || 0,

          equipment:
            Number(response.data.equipment) || 0,

          recent:
            response.data.recent || [],
        });
      } catch (error) {
        console.error(
          "Dashboard error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }, []);


  // ===================================================
  // REAL-TIME UPDATES
  // ===================================================

  useEffect(() => {
    loadDashboard();

    let noticeTimer;

    const notify = (text) => {
      setLiveNotice(text);

      window.clearTimeout(
        noticeTimer
      );

      noticeTimer =
        window.setTimeout(() => {
          setLiveNotice("");
        }, 3000);
    };

    const created = () => {
      loadDashboard();

      notify(
        "New reservation request received."
      );
    };

    const updated = () => {
      loadDashboard();

      notify(
        "Reservation activity updated."
      );
    };

    const equipment = () => {
      loadDashboard();

      notify(
        "Equipment inventory updated."
      );
    };

    socket.on(
      "reservation_created",
      created
    );

    socket.on(
      "reservation_updated",
      updated
    );

    socket.on(
      "equipment_updated",
      equipment
    );

    return () => {
      window.clearTimeout(
        noticeTimer
      );

      socket.off(
        "reservation_created",
        created
      );

      socket.off(
        "reservation_updated",
        updated
      );

      socket.off(
        "equipment_updated",
        equipment
      );
    };
  }, [
    loadDashboard,
  ]);


  const cards = [
    {
      title:
        "Pending Requests",

      value:
        data.pending,

      accent:
        "bg-amber-400",

      icon:
        "⏳",
    },

    {
      title:
        "Approved",

      value:
        data.approved,

      accent:
        "bg-blue-500",

      icon:
        "✓",
    },

    {
      title:
        "Currently Borrowed",

      value:
        data.borrowed,

      accent:
        "bg-emerald-500",

      icon:
        "↗",
    },

    {
      title:
        "Overdue",

      value:
        data.overdue,

      accent:
        "bg-rose-500",

      icon:
        "!",
    },

    {
      title:
        "Active Equipment",

      value:
        data.equipment,

      accent:
        "bg-violet-500",

      icon:
        "▣",
    },
  ];


  // ===================================================
  // HELPERS
  // ===================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const datePart =
      String(value).slice(
        0,
        10
      );

    return new Date(
      `${datePart}T00:00:00`
    ).toLocaleDateString(
      "en-PH",
      {
        month:
          "short",

        day:
          "numeric",

        year:
          "numeric",
      }
    );
  };


  const statusClass = (status) => {
    if (
      status === "pending"
    ) {
      return "bg-amber-100 text-amber-700";
    }

    if (
      status === "approved"
    ) {
      return "bg-blue-100 text-blue-700";
    }

    if (
      status === "finalized"
    ) {
      return "bg-violet-100 text-violet-700";
    }

    if (
      status === "released"
    ) {
      return "bg-emerald-100 text-emerald-700";
    }

    if (
      status === "returned"
    ) {
      return "bg-teal-100 text-teal-700";
    }

    if (
      status === "rejected"
    ) {
      return "bg-rose-100 text-rose-700";
    }

    return "bg-slate-100 text-slate-600";
  };


  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="animate-fade-up">

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>

          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            REPAIR ROOM • CMOB
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Live reservation and equipment activity for the Repair Room.
          </p>

        </div>


        {liveNotice && (
          <div className="animate-pop-in rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 shadow-sm">
            ✓ {liveNotice}
          </div>
        )}

      </div>


      {/* SUMMARY CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        {cards.map(
          (
            card
          ) => (
            <article
              key={
                card.title
              }
              className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >

              <div className="flex items-start justify-between gap-3">

                <div>

                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    {
                      card.title
                    }
                  </p>


                  <p className="mt-3 text-4xl font-black tracking-tight text-slate-900">
                    {
                      loading
                        ? "—"
                        : card.value
                    }
                  </p>

                </div>


                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 font-black text-blue-600 transition group-hover:scale-105">
                  {
                    card.icon
                  }
                </div>

              </div>


              <div
                className={`absolute inset-x-0 bottom-0 h-1 ${card.accent}`}
              />

            </article>
          )
        )}

      </div>


      {/* RECENT REQUESTS */}

      <section className="mt-7 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

        <div className="border-b border-blue-100 bg-blue-50/60 px-5 py-5 sm:px-6">

          <h2 className="text-xl font-black tracking-tight text-slate-900">
            Recent Requests
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest Repair Room reservation activity.
          </p>

        </div>


        {!loading &&
        data.recent.length ===
          0 ? (

          <div className="p-12 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 font-black text-blue-600">
              RR
            </div>

            <p className="mt-3 font-bold text-slate-700">
              No reservation requests yet.
            </p>

          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="min-w-[850px] w-full">

              <thead className="bg-blue-50">

                <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-500">

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
                    Equipment
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

                {(
                  data.recent ||
                  []
                ).map(
                  (
                    request
                  ) => (
                    <tr
                      key={
                        request.id
                      }
                      className="transition hover:bg-blue-50/60"
                    >

                      <td className="px-6 py-5 font-mono text-sm font-bold text-blue-600">
                        {
                          request.reference_code
                        }
                      </td>

                      <td className="px-6 py-5 font-bold text-slate-900">
                        {
                          request.requester_name
                        }
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {
                          request.department ||
                          "—"
                        }
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-600">
                        {
                          request.items ||
                          "—"
                        }
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-500">
                        {
                          formatDate(
                            request.start_date
                          )
                        }
                      </td>

                      <td className="px-6 py-5">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusClass(
                            request.status
                          )}`}
                        >
                          {
                            request.status ===
                            "released"
                              ? "Borrowed"
                              : request.status
                          }
                        </span>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}


export default Dashboard;
