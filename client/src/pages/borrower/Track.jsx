// =====================================================
// Borrower Tracking Page
// =====================================================
//
// PURPOSE:
//
// This page lets a borrower track a reservation using
// the reference number given after submitting.
//
// EXAMPLE:
// RES-2026-00001
//
// THE BORROWER CAN SEE:
//
// - Current reservation status
// - Reservation schedule
// - Borrower information
// - Reserved equipment
// - Message from staff
// - Status history
// - School ID deposit status
// - School ID return status
//
// REAL-TIME:
//
// When staff changes the reservation,
// Socket.IO sends "reservation_updated".
//
// The borrower does NOT need to press F5.
//
// Examples:
//
// Staff approves request
// -> borrower sees Approved
//
// Staff confirms physical form
// -> borrower sees Reservation Finalized
//
// Staff confirms School ID deposit
// -> borrower sees Deposited at Office
//
// Staff releases equipment
// -> borrower sees Equipment Released
//
// Staff returns equipment + School ID
// -> borrower sees Returned
//
// =====================================================


import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import api from "../../services/api";
import socket from "../../services/socket";


// =====================================================
// BOOLEAN HELPER
// =====================================================
//
// MariaDB/MySQL BOOLEAN values may arrive as:
//
// true
// false
// 1
// 0
// "1"
// "0"
//
// This helper makes checking them safer.
//
function isTrue(
  value
) {
  return (
    value === true ||
    value === 1 ||
    value === "1"
  );
}


// =====================================================
// RESERVATION STATUS INFORMATION
// =====================================================
//
// This converts database status names into
// user-friendly labels and explanations.
//
function getStatus(
  status
) {
  const values = {

    // -------------------------------------------------
    // Borrower submitted the reservation.
    // Staff has not reviewed it yet.
    // -------------------------------------------------
    pending: {
      label:
        "Pending Review",

      description:
        "The Repair Room, CMOB Department, has received your request and has not reviewed it yet.",

      style:
        "bg-amber-100 text-amber-700",

      dot:
        "bg-amber-500",
    },


    // -------------------------------------------------
    // Online reservation was approved.
    //
    // Borrower must still complete the physical
    // requirements at the office.
    // -------------------------------------------------
    approved: {
      label:
        "Approved",

      description:
        "Your reservation was approved online. Please proceed to the Repair Room to complete the physical form and required signatures.",

      style:
        "bg-blue-100 text-blue-700",

      dot:
        "bg-blue-500",
    },


    // -------------------------------------------------
    // Physical form/signature requirements completed.
    //
    // The School ID still needs to be deposited
    // before staff can release equipment.
    // -------------------------------------------------
    finalized: {
      label:
        "Reservation Finalized",

      description:
        "The physical reservation requirements have been completed. Leave your School ID at the office before the equipment is released.",

      style:
        "bg-violet-100 text-violet-700",

      dot:
        "bg-violet-500",
    },


    // -------------------------------------------------
    // Equipment is physically with the borrower.
    //
    // The School ID stays at the office until
    // the equipment is returned.
    // -------------------------------------------------
    released: {
      label:
        "Equipment Released",

      description:
        "The equipment has been released to you. Your deposited School ID remains at the office until the equipment return process is completed.",

      style:
        "bg-emerald-100 text-emerald-700",

      dot:
        "bg-emerald-500",
    },


    // -------------------------------------------------
    // Entire borrowing transaction completed.
    // -------------------------------------------------
    returned: {
      label:
        "Returned",

      description:
        "The equipment return process has been completed.",

      style:
        "bg-teal-100 text-teal-700",

      dot:
        "bg-teal-500",
    },


    // -------------------------------------------------
    // Staff rejected the reservation.
    // -------------------------------------------------
    rejected: {
      label:
        "Rejected",

      description:
        "The reservation request was not approved.",

      style:
        "bg-red-100 text-red-700",

      dot:
        "bg-red-500",
    },


    // -------------------------------------------------
    // Reservation was cancelled.
    // -------------------------------------------------
    cancelled: {
      label:
        "Cancelled",

      description:
        "The reservation was cancelled.",

      style:
        "bg-slate-200 text-slate-600",

      dot:
        "bg-slate-500",
    },
  };


  return (
    values[
      status
    ] || {
      label:
        status ||
        "Unknown",

      description:
        "",

      style:
        "bg-slate-100 text-slate-600",

      dot:
        "bg-slate-400",
    }
  );
}


// =====================================================
// SCHOOL ID STATUS
// =====================================================
//
// The School ID is NOT another reservation status.
//
// Example:
//
// Reservation status:
// released
//
// School ID:
// deposited
//
// We therefore display School ID separately.
//
function getIdStatus(
  reservation
) {

  if (
    !reservation
  ) {
    return {
      deposited:
        false,

      returned:
        false,

      label:
        "Not Deposited",

      description:
        "",

      style:
        "bg-slate-100 text-slate-600",

      icon:
        "○",
    };
  }


  const deposited =
    isTrue(
      reservation.id_deposited
    );


  const returned =
    isTrue(
      reservation.id_returned
    );


  // ---------------------------------------------------
  // School ID already returned to borrower.
  // ---------------------------------------------------

  if (
    returned
  ) {
    return {
      deposited,
      returned,

      label:
        "Returned to Borrower",

      description:
        "The School ID has been returned to the borrower.",

      style:
        "bg-teal-100 text-teal-700",

      icon:
        "✓",
    };
  }


  // ---------------------------------------------------
  // School ID currently being held by the office.
  // ---------------------------------------------------

  if (
    deposited
  ) {
    return {
      deposited,
      returned,

      label:
        "Deposited at Office",

      description:
        reservation.status ===
        "released"
          ? "Your School ID is currently being held by the office while the equipment is borrowed."
          : "Staff has confirmed that your School ID was deposited at the office.",

      style:
        "bg-amber-100 text-amber-700",

      icon:
        "ID",
    };
  }


  // ---------------------------------------------------
  // School ID is not deposited yet.
  // ---------------------------------------------------

  let description =
    "Your School ID has not been deposited.";


  if (
    reservation.status ===
    "pending"
  ) {
    description =
      "No School ID deposit is required while the request is still waiting for staff review.";
  }


  if (
    reservation.status ===
    "approved"
  ) {
    description =
      "Complete the required physical form and signatures first. Your School ID will be deposited before equipment release.";
  }


  if (
    reservation.status ===
    "finalized"
  ) {
    description =
      "The physical requirements are complete. Please leave your School ID at the office before equipment can be released.";
  }


  if (
    reservation.status ===
    "rejected" ||
    reservation.status ===
    "cancelled"
  ) {
    description =
      "No School ID deposit is required for this reservation.";
  }


  return {
    deposited,
    returned,

    label:
      "Not Deposited",

    description,

    style:
      "bg-slate-100 text-slate-600",

    icon:
      "○",
  };
}


// =====================================================
// DATE FORMATTER
// =====================================================
//
// Converts:
//
// 2026-09-24
//
// into:
//
// September 24, 2026
//
function formatDate(
  value
) {

  if (
    !value
  ) {
    return "—";
  }


  const datePart =
    String(
      value
    ).slice(
      0,
      10
    );


  return new Date(
    `${datePart}T00:00:00`
  ).toLocaleDateString(
    "en-PH",
    {
      month:
        "long",

      day:
        "numeric",

      year:
        "numeric",
    }
  );
}


// =====================================================
// TIME FORMATTER
// =====================================================
//
// Converts:
//
// 13:30:00
//
// into:
//
// 1:30 PM
//
function formatTime(
  value
) {

  if (
    !value
  ) {
    return "—";
  }


  const time =
    String(
      value
    ).slice(
      0,
      5
    );


  const [
    hour,
    minute,
  ] =
    time.split(
      ":"
    );


  const date =
    new Date();


  date.setHours(
    Number(
      hour
    ),

    Number(
      minute
    ),

    0,
    0
  );


  return date.toLocaleTimeString(
    "en-PH",
    {
      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}


// =====================================================
// DATE + TIME FORMATTER
// =====================================================
//
// Used for:
//
// - Status history
// - School ID deposited timestamp
// - School ID returned timestamp
//
function formatDateTime(
  value
) {

  if (
    !value
  ) {
    return "";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(
      value
    );
  }


  return date.toLocaleString(
    "en-PH",
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}


// =====================================================
// DETERMINE WHAT CHANGED DURING A LIVE UPDATE
// =====================================================
//
// Socket.IO tells the client that the reservation changed.
//
// We then fetch the newest reservation.
//
// This function compares OLD and NEW data so the live
// notification can explain what happened.
//
// Example:
//
// "Your reservation is now Approved."
//
// or:
//
// "Staff confirmed your School ID deposit."
//
function getUpdateMessage(
  previous,
  updated
) {

  if (
    !previous ||
    !updated
  ) {
    return "Your reservation was updated.";
  }


  // Reservation status changed.
  if (
    previous.status !==
    updated.status
  ) {
    const status =
      getStatus(
        updated.status
      );


    return `Your reservation is now ${status.label}.`;
  }


  // School ID was just deposited.
  if (
    !isTrue(
      previous.id_deposited
    ) &&
    isTrue(
      updated.id_deposited
    )
  ) {
    return "Staff confirmed that your School ID was deposited.";
  }


  // School ID was just returned.
  if (
    !isTrue(
      previous.id_returned
    ) &&
    isTrue(
      updated.id_returned
    )
  ) {
    return "Your School ID has been returned.";
  }


  return "Your reservation information was updated.";
}


// =====================================================
// TRACK PAGE
// =====================================================

function Track() {

  // ===================================================
  // URL QUERY PARAMETER
  // ===================================================
  //
  // Example:
  //
  // /track?reference=RES-2026-00001
  //
  const [
    searchParams,
    setSearchParams,
  ] =
    useSearchParams();


  const initialReference =
    searchParams.get(
      "reference"
    ) ||
    "";


  // ===================================================
  // PAGE STATE
  // ===================================================

  const [
    reference,
    setReference,
  ] =
    useState(
      initialReference
    );


  const [
    reservation,
    setReservation,
  ] =
    useState(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );


  const [
    message,
    setMessage,
  ] =
    useState(
      ""
    );


  const [
    liveNotice,
    setLiveNotice,
  ] =
    useState(
      ""
    );


  const [
    connected,
    setConnected,
  ] =
    useState(
      socket.connected
    );


  // ===================================================
  // BROWSER NOTIFICATION PERMISSION
  // ===================================================

  const [
    notificationPermission,
    setNotificationPermission,
  ] =
    useState(
      () => {

        if (
          typeof Notification ===
          "undefined"
        ) {
          return "unsupported";
        }


        return Notification
          .permission;
      }
    );


  // ===================================================
  // REFS
  // ===================================================

  // Prevent development StrictMode from
  // automatically tracking the same URL twice.
  const autoTrackedRef =
    useRef(
      false
    );


  // Stores the timer for the live notification popup.
  const liveTimerRef =
    useRef(
      null
    );


  // =====================================================
  // SHOW LIVE MESSAGE
  // =====================================================

  const showLiveNotice =
    useCallback(
      (
        text
      ) => {

        setLiveNotice(
          text
        );


        // If another update arrives quickly,
        // cancel the previous timer.
        if (
          liveTimerRef.current
        ) {
          window.clearTimeout(
            liveTimerRef.current
          );
        }


        liveTimerRef.current =
          window.setTimeout(
            () => {

              setLiveNotice(
                ""
              );


              liveTimerRef.current =
                null;
            },
            5000
          );
      },
      []
    );


  // =====================================================
  // CLEAN UP LIVE TIMER
  // =====================================================

  useEffect(
    () => {

      return () => {

        if (
          liveTimerRef.current
        ) {
          window.clearTimeout(
            liveTimerRef.current
          );
        }
      };
    },
    []
  );


  // =====================================================
  // FETCH RESERVATION FROM SERVER
  // =====================================================
  //
  // silent = false:
  // User manually searched.
  //
  // silent = true:
  // Socket.IO is refreshing the reservation in
  // the background, so we do not blank the page.
  //
  const fetchReservation =
    useCallback(
      async (
        referenceValue,
        silent = false
      ) => {

        const cleaned =
          String(
            referenceValue ||
            ""
          )
            .trim()
            .toUpperCase();


        // Reference number is required.
        if (
          !cleaned
        ) {

          if (
            !silent
          ) {
            setMessage(
              "Enter your reservation reference number."
            );
          }


          return null;
        }


        try {

          if (
            !silent
          ) {

            setLoading(
              true
            );


            setReservation(
              null
            );
          }


          setMessage(
            ""
          );


          const response =
            await api.get(
              `/reservations/track/${encodeURIComponent(
                cleaned
              )}`
            );


          const data =
            response.data
              .reservation;


          setReservation(
            data
          );


          setReference(
            cleaned
          );


          // Keep reference number in the browser URL.
          //
          // This means the borrower can:
          // - Refresh
          // - Bookmark
          // - Copy the URL
          //
          // and the reference stays available.
          setSearchParams(
            {
              reference:
                cleaned,
            },
            {
              replace:
                true,
            }
          );


          return data;

        } catch (error) {

          console.error(
            "Track reservation error:",
            error
          );


          if (
            !silent
          ) {

            setMessage(
              error.response
                ?.data
                ?.message ||
                "Could not find reservation."
            );


            setReservation(
              null
            );
          }


          return null;

        } finally {

          if (
            !silent
          ) {
            setLoading(
              false
            );
          }
        }
      },
      [
        setSearchParams,
      ]
    );


  // =====================================================
  // AUTOMATIC TRACKING FROM URL
  // =====================================================
  //
  // If borrower came directly from the successful
  // reservation page:
  //
  // /track?reference=RES-2026-00001
  //
  // We automatically load it.
  //
  useEffect(
    () => {

      if (
        !initialReference ||
        autoTrackedRef.current
      ) {
        return;
      }


      autoTrackedRef.current =
        true;


      fetchReservation(
        initialReference
      );

    },
    [
      initialReference,
      fetchReservation,
    ]
  );


  // =====================================================
  // SOCKET CONNECTION STATE
  // =====================================================

  useEffect(
    () => {

      const handleConnect =
        () => {
          setConnected(
            true
          );
        };


      const handleDisconnect =
        () => {
          setConnected(
            false
          );
        };


      socket.on(
        "connect",
        handleConnect
      );


      socket.on(
        "disconnect",
        handleDisconnect
      );


      return () => {

        socket.off(
          "connect",
          handleConnect
        );


        socket.off(
          "disconnect",
          handleDisconnect
        );
      };
    },
    []
  );


  // =====================================================
  // REAL-TIME RESERVATION UPDATE
  // =====================================================
  //
  // Server sends:
  //
  // reservation_updated
  //
  // whenever staff changes this reservation.
  //
  useEffect(
    () => {

      if (
        !reservation
      ) {
        return;
      }


      const handleUpdated =
        async (
          payload
        ) => {

          // Ignore updates for OTHER reservations.
          if (
            Number(
              payload?.id
            ) !==
            Number(
              reservation.id
            )
          ) {
            return;
          }


          // Keep old data so we can tell what changed.
          const previous =
            reservation;


          // Get latest reservation silently.
          const updated =
            await fetchReservation(
              reservation
                .reference_code,

              true
            );


          if (
            !updated
          ) {
            return;
          }


          const notice =
            getUpdateMessage(
              previous,
              updated
            );


          showLiveNotice(
            notice
          );


          // ---------------------------------------------
          // OPTIONAL DESKTOP/BROWSER NOTIFICATION
          // ---------------------------------------------

          if (
            typeof Notification !==
              "undefined" &&
            Notification.permission ===
              "granted"
          ) {

            try {

              new Notification(
                "Reservation Updated",
                {
                  body:
                    notice,
                }
              );

            } catch (error) {

              console.warn(
                "Browser notification error:",
                error
              );
            }
          }
        };


      socket.on(
        "reservation_updated",
        handleUpdated
      );


      return () => {

        socket.off(
          "reservation_updated",
          handleUpdated
        );
      };

    },
    [
      reservation,
      fetchReservation,
      showLiveNotice,
    ]
  );


  // =====================================================
  // ENABLE BROWSER NOTIFICATIONS
  // =====================================================
  //
  // In-page Socket.IO updates work even if the borrower
  // does NOT enable browser notifications.
  //
  // Browser notifications are only an extra convenience.
  //
  const enableNotifications =
    async () => {

      if (
        typeof Notification ===
        "undefined"
      ) {
        return;
      }


      try {

        const permission =
          await Notification
            .requestPermission();


        setNotificationPermission(
          permission
        );


        if (
          permission ===
          "granted"
        ) {
          showLiveNotice(
            "Browser reservation alerts are enabled."
          );
        }

      } catch (error) {

        console.warn(
          "Could not enable browser notifications:",
          error
        );


        showLiveNotice(
          "Browser notifications could not be enabled here. Live in-page updates will still work."
        );
      }
    };


  // =====================================================
  // MANUAL SEARCH SUBMIT
  // =====================================================

  const handleSubmit =
    (
      event
    ) => {

      event.preventDefault();


      fetchReservation(
        reference
      );
    };


  // =====================================================
  // CURRENT DISPLAY INFORMATION
  // =====================================================

  const currentStatus =
    useMemo(
      () =>
        reservation
          ? getStatus(
              reservation.status
            )
          : null,
      [
        reservation,
      ]
    );


  const idStatus =
    useMemo(
      () =>
        getIdStatus(
          reservation
        ),
      [
        reservation,
      ]
    );


  // =====================================================
  // SCHOOL ID DEPOSIT / RETURN DISPLAY
  // =====================================================

  const idDeposited =
    reservation
      ? isTrue(
          reservation.id_deposited
        )
      : false;


  const idReturned =
    reservation
      ? isTrue(
          reservation.id_returned
        )
      : false;


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50">

      {/* =================================================
          BORROWER HEADER
          =================================================
          
          IMPORTANT:
          There is intentionally NO Staff link here.
          ================================================= */}

      <header className="sticky top-0 z-30 border-b border-blue-100 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">

          {/* LOGO */}

          <Link
            to="/borrow"
            className="flex min-w-0 items-center gap-3"
          >

            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 font-black text-white shadow-md shadow-blue-200">
              ER
            </div>


            <div className="hidden min-w-0 sm:block">

              <p className="truncate font-black tracking-tight text-slate-900">
                Equipment Reservation
              </p>


              <p className="truncate text-xs text-slate-500">
                REPAIR ROOM • CMOB Department
              </p>

            </div>

          </Link>


          {/* CLIENT NAVIGATION */}

          <div className="flex items-center gap-1 sm:gap-2">

            {/* SOCKET CONNECTION */}

            <span
              className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black sm:flex ${
                connected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-600"
              }`}
            >

              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected
                    ? "animate-pulse bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />


              {
                connected
                  ? "LIVE"
                  : "OFFLINE"
              }

            </span>


            {/* RESERVE */}

            <Link
              to="/borrow"
              className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 sm:px-4 sm:text-sm"
            >
              Reserve
            </Link>


            {/* TRACK */}

            <Link
              to="/track"
              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 sm:px-4 sm:text-sm"
            >

              Track

              <span className="hidden sm:inline">
                {" "}
                Request
              </span>

            </Link>

          </div>

        </div>

      </header>


      {/* =================================================
          REAL-TIME UPDATE POPUP
          ================================================= */}

      {liveNotice && (
        <div className="animate-toast-in fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xl sm:bottom-6 sm:right-6">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-black text-emerald-700">
              ✓
            </div>


            <div className="min-w-0">

              <p className="font-extrabold text-slate-900">
                Reservation Updated
              </p>


              <p className="mt-1 text-sm leading-5 text-slate-600">
                {
                  liveNotice
                }
              </p>

            </div>

          </div>

        </div>
      )}


      <main className="mx-auto max-w-5xl px-4 py-9 sm:px-6 sm:py-12">

        {/* =================================================
            PAGE TITLE
            ================================================= */}

        <div className="animate-fade-up text-center">

          <div className="flex items-center justify-center gap-2">

            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
              Reservation Tracking
            </p>


            <span
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-black uppercase ${
                connected
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-600"
              }`}
            >

              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  connected
                    ? "animate-pulse bg-emerald-500"
                    : "bg-rose-500"
                }`}
              />


              {
                connected
                  ? "Live"
                  : "Offline"
              }

            </span>

          </div>


          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Track Your Request
          </h1>


          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Enter your reservation reference
            number. Staff updates will appear
            automatically without refreshing
            the page.
          </p>

        </div>


        {/* =================================================
            REFERENCE SEARCH
            ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
          className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row"
        >

          <input
            type="text"
            value={
              reference
            }
            onChange={
              (
                event
              ) => {

                setReference(
                  event
                    .target
                    .value
                    .toUpperCase()
                );


                setMessage(
                  ""
                );
              }
            }
            placeholder="Example: RES-2026-00001"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono font-bold uppercase outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />


          <button
            type="submit"
            disabled={
              loading
            }
            className="rounded-xl bg-blue-600 px-7 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {
              loading
                ? "Checking..."
                : "Track Request"
            }

          </button>

        </form>


        {/* SEARCH ERROR */}

        {message && (
          <div className="mx-auto mt-5 max-w-2xl rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700">
            {
              message
            }
          </div>
        )}


        {/* =================================================
            RESERVATION RESULT
            ================================================= */}

        {reservation && (
          <div className="animate-fade-up mt-8 space-y-5 sm:mt-10">

            {/* =================================================
                CURRENT RESERVATION STATUS
                ================================================= */}

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                <div className="min-w-0">

                  <p className="break-all font-mono text-sm font-bold text-blue-600">
                    {
                      reservation.reference_code
                    }
                  </p>


                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                    {
                      reservation.requester_name
                    }
                  </h2>


                  <p className="mt-1 text-sm text-slate-500">
                    {
                      reservation.department
                    }
                  </p>

                </div>


                <span
                  className={`self-start rounded-full px-4 py-2 text-sm font-bold ${currentStatus.style}`}
                >
                  {
                    currentStatus.label
                  }
                </span>

              </div>


              {/* STATUS EXPLANATION */}

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">

                <div className="flex items-center gap-2">

                  <span
                    className={`h-2 w-2 rounded-full ${currentStatus.dot}`}
                  />


                  <p className="font-extrabold text-slate-800">
                    {
                      currentStatus.label
                    }
                  </p>

                </div>


                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {
                    currentStatus.description
                  }
                </p>

              </div>


              {/* STAFF MESSAGE */}

              {reservation.staff_message && (
                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">

                  <p className="text-sm font-extrabold text-blue-700">
                    Message from Staff
                  </p>


                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-blue-800">
                    {
                      reservation.staff_message
                    }
                  </p>

                </div>
              )}


              {/* ENABLE OPTIONAL BROWSER ALERT */}

              {notificationPermission ===
                "default" && (

                <button
                  type="button"
                  onClick={
                    enableNotifications
                  }
                  className="mt-4 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  🔔 Enable browser update alerts
                </button>
              )}

            </section>


            {/* =================================================
                SCHOOL ID + RELEASE PROCESS
                =================================================
                
                IMPORTANT:
                
                School ID deposit is NOT a reservation status.
                
                It is shown separately so borrowers clearly know:
                
                - whether the ID was deposited
                - whether the office is still holding it
                - whether it was returned
                ================================================= */}

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
                    Release Requirement
                  </p>


                  <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900">
                    School ID Status
                  </h2>


                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    A School ID must be left
                    at the office before the
                    equipment can be released.
                    It is returned when the
                    equipment return process
                    is completed.
                  </p>

                </div>


                <span
                  className={`self-start rounded-full px-4 py-2 text-xs font-extrabold ${idStatus.style}`}
                >
                  {
                    idStatus.label
                  }
                </span>

              </div>


              {/* CURRENT ID EXPLANATION */}

              <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">

                <div className="flex items-start gap-3">

                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl font-black ${idStatus.style}`}
                  >
                    {
                      idStatus.icon
                    }
                  </div>


                  <div className="min-w-0">

                    <p className="font-extrabold text-slate-900">
                      {
                        idStatus.label
                      }
                    </p>


                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {
                        idStatus.description
                      }
                    </p>

                  </div>

                </div>

              </div>


              {/* DEPOSIT + RETURN CARDS */}

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                {/* SCHOOL ID DEPOSIT */}

                <div
                  className={`rounded-2xl border p-4 ${
                    idDeposited
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        School ID Deposit
                      </p>


                      <p
                        className={`mt-1 font-black ${
                          idDeposited
                            ? "text-amber-700"
                            : "text-slate-700"
                        }`}
                      >
                        {
                          idDeposited
                            ? "Confirmed"
                            : "Not Confirmed"
                        }
                      </p>

                    </div>


                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full font-black ${
                        idDeposited
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {
                        idDeposited
                          ? "✓"
                          : "○"
                      }
                    </div>

                  </div>


                  {idDeposited &&
                    reservation.id_deposited_at && (

                    <p className="mt-3 text-xs font-semibold leading-5 text-amber-700">
                      Confirmed:
                      {" "}
                      {
                        formatDateTime(
                          reservation.id_deposited_at
                        )
                      }
                    </p>
                  )}

                </div>


                {/* SCHOOL ID RETURN */}

                <div
                  className={`rounded-2xl border p-4 ${
                    idReturned
                      ? "border-teal-200 bg-teal-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        School ID Return
                      </p>


                      <p
                        className={`mt-1 font-black ${
                          idReturned
                            ? "text-teal-700"
                            : "text-slate-700"
                        }`}
                      >
                        {
                          idReturned
                            ? "Returned"
                            : idDeposited
                              ? "Still at Office"
                              : "Not Applicable Yet"
                        }
                      </p>

                    </div>


                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full font-black ${
                        idReturned
                          ? "bg-teal-100 text-teal-700"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {
                        idReturned
                          ? "✓"
                          : "○"
                      }
                    </div>

                  </div>


                  {idReturned &&
                    reservation.id_returned_at && (

                    <p className="mt-3 text-xs font-semibold leading-5 text-teal-700">
                      Returned:
                      {" "}
                      {
                        formatDateTime(
                          reservation.id_returned_at
                        )
                      }
                    </p>
                  )}

                </div>

              </div>


              {/* SPECIAL REMINDER WHILE EQUIPMENT IS OUT */}

              {reservation.status ===
                "released" &&
                idDeposited &&
                !idReturned && (

                <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

                  <p className="text-sm font-extrabold text-amber-800">
                    School ID is currently at the office
                  </p>


                  <p className="mt-1 text-sm leading-6 text-amber-700">
                    Return all borrowed
                    equipment to the office.
                    Staff will complete the
                    return process and give
                    your School ID back.
                  </p>

                </div>
              )}


              {/* COMPLETED RETURN */}

              {reservation.status ===
                "returned" &&
                idReturned && (

                <div className="mt-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">

                  <p className="text-sm font-extrabold text-teal-800">
                    ✓ Borrowing process completed
                  </p>


                  <p className="mt-1 text-sm leading-6 text-teal-700">
                    The equipment return and
                    School ID return have
                    both been completed.
                  </p>

                </div>
              )}

            </section>


            {/* =================================================
                RESERVATION DETAILS
                ================================================= */}

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">

              <h2 className="text-xl font-black tracking-tight text-slate-900">
                Reservation Details
              </h2>


              <div className="mt-6 grid gap-5 sm:grid-cols-2">

                <Detail
                  title="Date of Use"
                  value={
                    formatDate(
                      reservation.start_date
                    )
                  }
                />


                <Detail
                  title="Return / End Date"
                  value={
                    formatDate(
                      reservation.end_date
                    )
                  }
                />


                <Detail
                  title="Start Time"
                  value={
                    formatTime(
                      reservation.start_time
                    )
                  }
                />


                <Detail
                  title="End Time"
                  value={
                    formatTime(
                      reservation.end_time
                    )
                  }
                />


                <Detail
                  title="Department"
                  value={
                    reservation.department
                  }
                />


                <Detail
                  title="School ID Number"
                  value={
                    reservation.school_id
                  }
                />


                <Detail
                  title="Subject"
                  value={
                    reservation.subject
                  }
                />


                <Detail
                  title="Instructor"
                  value={
                    reservation.instructor_name
                  }
                />


                <Detail
                  title="Location"
                  value={
                    reservation.location
                  }
                />


                <div className="sm:col-span-2">

                  <Detail
                    title="Purpose"
                    value={
                      reservation.purpose
                    }
                  />

                </div>

              </div>

            </section>


            {/* =================================================
                RESERVED EQUIPMENT
                ================================================= */}

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">

              <div className="flex items-center justify-between gap-3">

                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Reserved Equipment
                </h2>


                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-blue-600">
                  {
                    reservation.items
                      ?.length ||
                    0
                  }
                  {" "}
                  item
                  {
                    reservation.items
                      ?.length ===
                    1
                      ? ""
                      : "s"
                  }
                </span>

              </div>


              {reservation.items
                ?.length >
                0 ? (

                <div className="mt-5 grid gap-3 sm:grid-cols-2">

                  {reservation.items.map(
                    (
                      item
                    ) => (

                      <div
                        key={
                          item.id
                        }
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="font-extrabold text-slate-900">
                              {
                                item.name
                              }
                            </p>


                            <p className="mt-1 text-sm text-slate-500">
                              {
                                item.category ||
                                "Equipment"
                              }
                            </p>

                          </div>


                          {item.quantity &&
                            Number(
                              item.quantity
                            ) >
                              1 && (

                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                              x
                              {
                                item.quantity
                              }
                            </span>
                          )}

                        </div>


                        <div className="mt-3 border-t border-slate-200 pt-3">

                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                            Asset Code
                          </p>


                          <p className="mt-1 font-mono text-sm font-bold text-slate-700">
                            {
                              item.asset_code ||
                              "No asset code"
                            }
                          </p>

                        </div>


                        {item.description && (
                          <p className="mt-3 text-sm leading-5 text-slate-500">
                            {
                              item.description
                            }
                          </p>
                        )}

                      </div>
                    )
                  )}

                </div>

              ) : (

                <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No equipment information
                  was found for this reservation.
                </div>
              )}

            </section>


            {/* =================================================
                STATUS HISTORY
                ================================================= */}

            <section className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-7">

              <h2 className="text-xl font-black tracking-tight text-slate-900">
                Status History
              </h2>


              <p className="mt-1 text-sm leading-6 text-slate-500">
                This shows the reservation
                status changes recorded by
                the system.
              </p>


              {reservation.history
                ?.length >
                0 ? (

                <div className="mt-6 space-y-5">

                  {reservation.history.map(
                    (
                      entry,
                      index
                    ) => {

                      const status =
                        getStatus(
                          entry.status
                        );


                      return (
                        <div
                          key={`${entry.status}-${entry.created_at}-${index}`}
                          className="flex gap-4"
                        >

                          {/* TIMELINE DOT + LINE */}

                          <div className="relative flex flex-col items-center">

                            <div
                              className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ring-4 ring-blue-100 ${status.dot}`}
                            />


                            {index <
                              reservation
                                .history
                                .length -
                                1 && (

                              <div className="mt-1 h-full min-h-10 w-px bg-blue-100" />
                            )}

                          </div>


                          {/* HISTORY INFORMATION */}

                          <div className="min-w-0 flex-1 pb-2">

                            <div className="flex flex-wrap items-center gap-2">

                              <p className="font-extrabold text-slate-800">
                                {
                                  status.label
                                }
                              </p>


                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.style}`}
                              >
                                {
                                  entry.status
                                }
                              </span>

                            </div>


                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {
                                formatDateTime(
                                  entry.created_at
                                )
                              }
                            </p>


                            {entry.note && (
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {
                                  entry.note
                                }
                              </p>
                            )}

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              ) : (

                <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center text-sm text-slate-500">
                  No status history is
                  currently available.
                </div>
              )}

            </section>


            {/* =================================================
                REAL-TIME INFORMATION
                ================================================= */}

            <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:p-5">

              <div className="flex items-start gap-3">

                <span
                  className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                    connected
                      ? "animate-pulse bg-emerald-500"
                      : "bg-rose-500"
                  }`}
                />


                <div>

                  <p className="font-extrabold text-emerald-800">
                    {
                      connected
                        ? "Real-time tracking connected"
                        : "Real-time connection temporarily unavailable"
                    }
                  </p>


                  <p className="mt-1 text-sm leading-6 text-emerald-700">
                    {
                      connected
                        ? "Staff changes will automatically appear on this page. You do not need to refresh."
                        : "You can still manually search your reference again. The live connection will reconnect automatically when possible."
                    }
                  </p>

                </div>

              </div>

            </section>

          </div>
        )}

      </main>

    </div>
  );
}


// =====================================================
// DETAIL COMPONENT
// =====================================================
//
// Used for reservation information such as:
//
// Date
// Time
// Department
// School ID
// Purpose
//
function Detail({
  title,
  value,
}) {
  return (
    <div className="min-w-0">

      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
        {
          title
        }
      </p>


      <p className="mt-1 break-words font-semibold leading-6 text-slate-800">
        {
          value ||
          "—"
        }
      </p>

    </div>
  );
}


// =====================================================
// EXPORT PAGE
// =====================================================

export default Track;