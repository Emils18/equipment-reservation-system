// =====================================================
// STAFF RESERVATION REQUESTS
// =====================================================
//
// REPAIR ROOM
// CMOB Department
//
// Reservation workflow:
//
// Pending
//   ↓
// Approved
//   ↓
// Physical Form Signed / Finalized
//   ↓
// School ID Deposited
//   ↓
// Equipment Released
//
// IMPORTANT UI FIX:
//
// The action/details modal is rendered using createPortal().
//
// Why?
//
// The Requests page uses page animations such as
// "animate-fade-up". Animations may use CSS transforms.
//
// A fixed modal placed INSIDE a transformed container can
// behave like it is fixed only inside that container.
//
// That caused:
// - Sidebar still visible
// - Blur not covering whole screen
// - Modal appearing inside page area
//
// createPortal() moves the modal directly under document.body,
// so the modal backdrop now covers the ENTIRE screen.
//
// =====================================================


import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import api from "../../services/api";
import socket from "../../services/socket";


// =====================================================
// MYSQL BOOLEAN HELPER
// =====================================================
//
// MySQL/MariaDB boolean values may arrive as:
//
// true
// false
// 1
// 0
// "1"
// "0"
//
// Using this helper prevents "0" from accidentally
// being treated as true.
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
// REQUESTS PAGE
// =====================================================

function Requests() {

  // ===================================================
  // PAGE DATA
  // ===================================================

  const [
    requests,
    setRequests,
  ] =
    useState(
      []
    );


  const [
    selected,
    setSelected,
  ] =
    useState(
      null
    );


  const [
    message,
    setMessage,
  ] =
    useState(
      ""
    );


  const [
    action,
    setAction,
  ] =
    useState(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );


  const [
    processing,
    setProcessing,
  ] =
    useState(
      false
    );


  const [
    liveNotice,
    setLiveNotice,
  ] =
    useState(
      ""
    );


  // =====================================================
  // LOAD RESERVATION REQUESTS
  // =====================================================

  const loadRequests =
    useCallback(
      async () => {

        try {

          const response =
            await api.get(
              "/staff/requests"
            );


          setRequests(
            response.data
              .requests ||
              []
          );

        } catch (error) {

          console.error(
            "Requests error:",
            error
          );

        } finally {

          setLoading(
            false
          );
        }
      },
      []
    );


  // =====================================================
  // REAL-TIME SOCKET.IO UPDATES
  // =====================================================
  //
  // reservation_created:
  // A borrower submitted a new request.
  //
  // reservation_updated:
  // Staff or another process changed a reservation.
  //
  useEffect(
    () => {

      loadRequests();


      const handleCreated =
        () => {

          loadRequests();


          setLiveNotice(
            "A new reservation request arrived."
          );


          window.setTimeout(
            () => {
              setLiveNotice(
                ""
              );
            },
            3500
          );
        };


      const handleUpdated =
        () => {

          loadRequests();
        };


      socket.on(
        "reservation_created",
        handleCreated
      );


      socket.on(
        "reservation_updated",
        handleUpdated
      );


      return () => {

        socket.off(
          "reservation_created",
          handleCreated
        );


        socket.off(
          "reservation_updated",
          handleUpdated
        );
      };

    },
    [
      loadRequests,
    ]
  );


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate =
    (
      value
    ) => {

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
            "short",

          day:
            "numeric",

          year:
            "numeric",
        }
      );
    };


  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime =
    (
      value
    ) => {

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
    };


  // =====================================================
  // STATUS BADGE STYLE
  // =====================================================

  const statusStyle =
    (
      status
    ) => {

      if (
        status ===
        "pending"
      ) {
        return "bg-amber-100 text-amber-700";
      }


      if (
        status ===
        "approved"
      ) {
        return "bg-blue-100 text-blue-700";
      }


      if (
        status ===
        "finalized"
      ) {
        return "bg-violet-100 text-violet-700";
      }


      if (
        status ===
        "released"
      ) {
        return "bg-emerald-100 text-emerald-700";
      }


      if (
        status ===
        "rejected"
      ) {
        return "bg-rose-100 text-rose-700";
      }


      return "bg-slate-100 text-slate-600";
    };


  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal =
    useCallback(
      () => {

        // Prevent closing while an update is still being sent.
        if (
          processing
        ) {
          return;
        }


        setSelected(
          null
        );


        setAction(
          null
        );


        setMessage(
          ""
        );
      },
      [
        processing,
      ]
    );


  // =====================================================
  // LOCK PAGE SCROLL + ESC KEY
  // =====================================================
  //
  // While modal is open:
  //
  // - Background page cannot scroll.
  // - Pressing ESC closes modal.
  //
  useEffect(
    () => {

      if (
        !selected
      ) {
        return;
      }


      const oldOverflow =
        document.body.style
          .overflow;


      document.body.style
        .overflow =
        "hidden";


      const handleKeyDown =
        (
          event
        ) => {

          if (
            event.key ===
            "Escape" &&
            !processing
          ) {
            setSelected(
              null
            );


            setAction(
              null
            );


            setMessage(
              ""
            );
          }
        };


      window.addEventListener(
        "keydown",
        handleKeyDown
      );


      return () => {

        document.body.style
          .overflow =
          oldOverflow;


        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };

    },
    [
      selected,
      processing,
    ]
  );


  // =====================================================
  // OPEN VIEW MODAL
  // =====================================================

  const openView =
    (
      request
    ) => {

      setSelected(
        request
      );


      setAction(
        "view"
      );


      setMessage(
        ""
      );
    };


  // =====================================================
  // OPEN ACTION MODAL
  // =====================================================

  const openAction =
    (
      request,
      nextAction
    ) => {

      setSelected(
        request
      );


      setAction(
        nextAction
      );


      // -----------------------------------------------
      // APPROVAL MESSAGE
      // -----------------------------------------------

      if (
        nextAction ===
        "approved"
      ) {

        setMessage(
          "Your reservation has been approved. Please proceed to the Repair Room, CMOB Department, to complete the physical form and required signatures."
        );

        return;
      }


      // -----------------------------------------------
      // REJECTION MESSAGE
      // -----------------------------------------------

      if (
        nextAction ===
        "rejected"
      ) {

        setMessage(
          "Your reservation request was not approved. Please contact the Repair Room, CMOB Department, if you need assistance."
        );

        return;
      }


      // -----------------------------------------------
      // PHYSICAL FORM COMPLETED MESSAGE
      // -----------------------------------------------

      if (
        nextAction ===
        "finalized"
      ) {

        setMessage(
          "Your physical reservation form and required signatures have been completed. Please leave your School ID at the Repair Room before the equipment can be released."
        );

        return;
      }


      // -----------------------------------------------
      // RELEASE MESSAGE
      // -----------------------------------------------

      if (
        nextAction ===
        "released"
      ) {

        setMessage(
          "The equipment has been released. Your School ID will remain at the Repair Room until the equipment is returned."
        );

        return;
      }


      setMessage(
        ""
      );
    };


  // =====================================================
  // UPDATE RESERVATION STATUS
  // =====================================================

  const updateStatus =
    async () => {

      if (
        !selected ||
        !action ||
        action ===
          "view"
      ) {
        return;
      }


      try {

        setProcessing(
          true
        );


        await api.patch(
          `/staff/reservations/${selected.id}/status`,
          {
            status:
              action,

            message,
          }
        );


        // Close modal after successful update.
        setSelected(
          null
        );


        setAction(
          null
        );


        setMessage(
          ""
        );


        await loadRequests();

      } catch (error) {

        alert(
          error.response
            ?.data
            ?.message ||
            "Could not update request."
        );

      } finally {

        setProcessing(
          false
        );
      }
    };


  // =====================================================
  // CONFIRM SCHOOL ID DEPOSIT
  // =====================================================
  //
  // This does NOT create another reservation status.
  //
  // The reservation remains "finalized".
  //
  // Staff confirms the School ID separately.
  //
  // Only after this can staff release the equipment.
  //
  const confirmIdDeposit =
    async (
      request
    ) => {

      const confirmed =
        window.confirm(
          `Confirm that ${request.requester_name} left School ID ${request.school_id || ""} at the Repair Room?`
        );


      if (
        !confirmed
      ) {
        return;
      }


      try {

        setProcessing(
          true
        );


        await api.patch(
          `/staff/reservations/${request.id}/id-deposit`
        );


        await loadRequests();

      } catch (error) {

        alert(
          error.response
            ?.data
            ?.message ||
            "Could not confirm School ID deposit."
        );

      } finally {

        setProcessing(
          false
        );
      }
    };


  // =====================================================
  // MODAL TITLE
  // =====================================================

  const getModalTitle =
    () => {

      if (
        action ===
        "approved"
      ) {
        return "Approve Reservation";
      }


      if (
        action ===
        "rejected"
      ) {
        return "Reject Reservation";
      }


      if (
        action ===
        "finalized"
      ) {
        return "Confirm Physical Form";
      }


      if (
        action ===
        "released"
      ) {
        return "Release Equipment";
      }


      return "Reservation Details";
    };


  // =====================================================
  // MODAL ACTION BUTTON TEXT
  // =====================================================

  const getActionButtonText =
    () => {

      if (
        processing
      ) {
        return "Updating...";
      }


      if (
        action ===
        "approved"
      ) {
        return "Confirm Approval";
      }


      if (
        action ===
        "rejected"
      ) {
        return "Confirm Rejection";
      }


      if (
        action ===
        "finalized"
      ) {
        return "Confirm Physical Signing";
      }


      if (
        action ===
        "released"
      ) {
        return "Confirm Equipment Release";
      }


      return "Confirm";
    };


  // =====================================================
  // MODAL ACTION BUTTON COLOR
  // =====================================================

  const getActionButtonClass =
    () => {

      if (
        action ===
        "rejected"
      ) {
        return "bg-rose-600 hover:bg-rose-700";
      }


      if (
        action ===
        "approved"
      ) {
        return "bg-emerald-600 hover:bg-emerald-700";
      }


      if (
        action ===
        "finalized"
      ) {
        return "bg-violet-600 hover:bg-violet-700";
      }


      return "bg-blue-600 hover:bg-blue-700";
    };


  // =====================================================
  // MAIN PAGE
  // =====================================================

  return (
    <>

      {/* =================================================
          NORMAL REQUESTS PAGE
          =================================================
          
          The modal is NOT inside this container anymore.
          ================================================= */}

      <div className="animate-fade-up">

        {/* ===============================================
            PAGE HEADER
            =============================================== */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="flex items-center gap-2">

              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
                Repair Room
              </p>


              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-700">

                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                Live

              </span>

            </div>


            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Reservation Requests
            </h1>


            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Review reservation requests
              handled by the Repair Room,
              CMOB Department, and complete
              the physical borrowing
              requirements before equipment
              release.
            </p>

          </div>


          {/* LIVE NOTIFICATION */}

          {liveNotice && (
            <div className="animate-pop-in rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              🔔
              {" "}
              {
                liveNotice
              }
            </div>
          )}

        </div>


        {/* ===============================================
            REQUEST LIST
            =============================================== */}

        <div className="space-y-4">

          {/* LOADING */}

          {loading ? (

            <div className="rounded-2xl border border-blue-100 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />


              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading requests...
              </p>

            </div>

          ) : requests.length ===
            0 ? (

            /* EMPTY */

            <div className="rounded-2xl border border-blue-100 bg-white p-12 text-center shadow-sm">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl font-black text-emerald-600">
                ✓
              </div>


              <p className="mt-4 font-bold text-slate-700">
                No active reservation requests.
              </p>


              <p className="mt-1 text-sm text-slate-500">
                New requests will appear
                automatically.
              </p>

            </div>

          ) : (

            /* REQUEST CARDS */

            requests.map(
              (
                request
              ) => {

                const idDeposited =
                  isTrue(
                    request.id_deposited
                  );


                return (
                  <article
                    key={
                      request.id
                    }
                    className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6"
                  >

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                      {/* =================================
                          REQUEST INFORMATION
                          ================================= */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-lg font-black tracking-tight text-slate-900 sm:text-xl">
                            {
                              request.requester_name
                            }
                          </h2>


                          {/* RESERVATION STATUS */}

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyle(
                              request.status
                            )}`}
                          >
                            {
                              request.status
                            }
                          </span>


                          {/* ID DEPOSIT BADGE */}

                          {idDeposited &&
                            request.status ===
                              "finalized" && (

                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                              ID Deposited
                            </span>
                          )}

                        </div>


                        {/* DEPARTMENT */}

                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {
                            request.department
                          }
                        </p>


                        {/* REQUEST DETAILS */}

                        <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">

                          <Info
                            label="Equipment"
                            value={
                              request.items
                            }
                          />


                          <Info
                            label="Reference"
                            value={
                              request.reference_code
                            }
                            mono
                          />


                          <Info
                            label="Schedule"
                            value={`${formatDate(
                              request.start_date
                            )} ${formatTime(
                              request.start_time
                            )} – ${formatDate(
                              request.end_date
                            )} ${formatTime(
                              request.end_time
                            )}`}
                          />


                          <Info
                            label="School ID"
                            value={
                              request.school_id
                            }
                          />


                          <div className="sm:col-span-2">

                            <Info
                              label="Purpose"
                              value={
                                request.purpose
                              }
                            />

                          </div>

                        </div>

                      </div>


                      {/* =================================
                          ACTION BUTTONS
                          ================================= */}

                      <div className="flex flex-wrap gap-2 xl:max-w-sm xl:justify-end">

                        {/* VIEW */}

                        <button
                          type="button"
                          onClick={
                            () =>
                              openView(
                                request
                              )
                          }
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          View
                        </button>


                        {/* PENDING ACTIONS */}

                        {request.status ===
                          "pending" && (
                          <>

                            <button
                              type="button"
                              onClick={
                                () =>
                                  openAction(
                                    request,
                                    "approved"
                                  )
                              }
                              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-600"
                            >
                              Approve
                            </button>


                            <button
                              type="button"
                              onClick={
                                () =>
                                  openAction(
                                    request,
                                    "rejected"
                                  )
                              }
                              className="rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600"
                            >
                              Reject
                            </button>

                          </>
                        )}


                        {/* APPROVED -> PHYSICAL FORM */}

                        {request.status ===
                          "approved" && (

                          <button
                            type="button"
                            onClick={
                              () =>
                                openAction(
                                  request,
                                  "finalized"
                                )
                            }
                            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
                          >
                            Physical Form Signed
                          </button>
                        )}


                        {/* FINALIZED -> ID DEPOSIT */}

                        {request.status ===
                          "finalized" &&
                          !idDeposited && (

                            <button
                              type="button"
                              onClick={
                                () =>
                                  confirmIdDeposit(
                                    request
                                  )
                              }
                              disabled={
                                processing
                              }
                              className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Confirm ID Deposited
                            </button>
                          )}


                        {/* FINALIZED + ID DEPOSITED -> RELEASE */}

                        {request.status ===
                          "finalized" &&
                          idDeposited && (

                            <button
                              type="button"
                              onClick={
                                () =>
                                  openAction(
                                    request,
                                    "released"
                                  )
                              }
                              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                            >
                              Release Equipment
                            </button>
                          )}

                      </div>

                    </div>

                  </article>
                );
              }
            )
          )}

        </div>

      </div>


      {/* =================================================
          MODAL PORTAL
          =================================================
          
          THIS IS THE IMPORTANT FIX.
          
          The modal is rendered directly under document.body.
          
          It is NOT inside:
          
          <div className="animate-fade-up">
          
          anymore.
          
          Therefore:
          
          ✓ Entire screen gets dark
          ✓ Sidebar gets blurred
          ✓ Top bar gets blurred
          ✓ Page content gets blurred
          ✓ Modal remains sharp
          ✓ Modal is centered correctly
          ================================================= */}

      {selected &&
        createPortal(

          <div
            className="
              fixed inset-0
              z-[9999]
              flex
              items-center
              justify-center
              overflow-y-auto
              bg-slate-950/65
              p-4
              backdrop-blur-md
              sm:p-6
            "
            onMouseDown={
              (
                event
              ) => {

                // Close only if user clicked the BACKDROP.
                //
                // Clicking inside the modal will not close it.
                if (
                  event.target ===
                    event.currentTarget &&
                  !processing
                ) {
                  closeModal();
                }
              }
            }
          >

            {/* =============================================
                MODAL CONTAINER
                ============================================= */}

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="reservation-modal-title"
              className="
                animate-pop-in
                relative
                my-auto
                w-full
                max-w-2xl
                overflow-hidden
                rounded-3xl
                border
                border-slate-200
                bg-white
                shadow-2xl
                shadow-slate-950/30
              "
              onMouseDown={
                (
                  event
                ) => {
                  event.stopPropagation();
                }
              }
            >

              {/* ===========================================
                  MODAL HEADER
                  =========================================== */}

              <div className="border-b border-slate-100 bg-white px-5 py-5 sm:px-7">

                <div className="flex items-start justify-between gap-4">

                  <div className="min-w-0">

                    <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
                      Repair Room • CMOB Department
                    </p>


                    <h2
                      id="reservation-modal-title"
                      className="mt-1 text-2xl font-black tracking-tight text-slate-900"
                    >
                      {
                        getModalTitle()
                      }
                    </h2>


                    <p className="mt-2 break-all font-mono text-sm font-bold text-blue-600">
                      {
                        selected.reference_code
                      }
                    </p>

                  </div>


                  {/* CLOSE BUTTON */}

                  <button
                    type="button"
                    disabled={
                      processing
                    }
                    onClick={
                      closeModal
                    }
                    className="
                      flex
                      h-10
                      w-10
                      flex-shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      text-2xl
                      leading-none
                      text-slate-400
                      transition
                      hover:border-slate-300
                      hover:bg-slate-100
                      hover:text-slate-700
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                    aria-label="Close reservation details"
                  >
                    ×
                  </button>

                </div>

              </div>


              {/* ===========================================
                  SCROLLABLE MODAL BODY
                  ===========================================
                  
                  Only THIS part scrolls if modal content
                  becomes taller than the browser window.
                  =========================================== */}

              <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">

                {/* BORROWER NAME */}

                <div className="mb-5">

                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Borrower
                  </p>


                  <p className="mt-1 text-xl font-black text-slate-900">
                    {
                      selected.requester_name
                    }
                  </p>

                </div>


                {/* =========================================
                    RESERVATION DETAILS CONTAINER
                    ========================================= */}

                <div className="grid gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:grid-cols-2 sm:p-5">

                  <Detail
                    title="Department"
                    value={
                      selected.department
                    }
                  />


                  <Detail
                    title="School ID"
                    value={
                      selected.school_id
                    }
                  />


                  <Detail
                    title="Instructor"
                    value={
                      selected.instructor_name
                    }
                  />


                  <Detail
                    title="Subject"
                    value={
                      selected.subject
                    }
                  />


                  <Detail
                    title="Location"
                    value={
                      selected.location
                    }
                  />


                  <Detail
                    title="Equipment"
                    value={
                      selected.items
                    }
                  />


                  <Detail
                    title="Start"
                    value={`${formatDate(
                      selected.start_date
                    )} • ${formatTime(
                      selected.start_time
                    )}`}
                  />


                  <Detail
                    title="End"
                    value={`${formatDate(
                      selected.end_date
                    )} • ${formatTime(
                      selected.end_time
                    )}`}
                  />


                  {/* SCHOOL ID DEPOSIT */}

                  <div>

                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      ID Deposit
                    </p>


                    {isTrue(
                      selected.id_deposited
                    ) ? (

                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-extrabold text-emerald-700">

                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">
                          ✓
                        </span>

                        Deposited

                      </div>

                    ) : (

                      <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1.5 text-xs font-extrabold text-slate-600">

                        <span className="h-2 w-2 rounded-full bg-slate-400" />

                        Not yet deposited

                      </div>
                    )}

                  </div>


                  {/* STATUS */}

                  <div>

                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Current Status
                    </p>


                    <span
                      className={`mt-2 inline-block rounded-full px-3 py-1.5 text-xs font-bold capitalize ${statusStyle(
                        selected.status
                      )}`}
                    >
                      {
                        selected.status
                      }
                    </span>

                  </div>


                  {/* PURPOSE */}

                  <div className="sm:col-span-2">

                    <Detail
                      title="Purpose"
                      value={
                        selected.purpose
                      }
                    />

                  </div>

                </div>


                {/* =========================================
                    ACTION MESSAGE
                    ========================================= */}

                {action !==
                  "view" && (
                  <div className="mt-6">

                    <label className="block text-sm font-bold text-slate-700">
                      Message to Borrower
                    </label>


                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      This message will be
                      shown on the borrower's
                      tracking page.
                    </p>


                    <textarea
                      value={
                        message
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setMessage(
                            event
                              .target
                              .value
                          )
                      }
                      rows="4"
                      placeholder="Optional message..."
                      className="
                        mt-3
                        w-full
                        resize-none
                        rounded-xl
                        border
                        border-slate-200
                        bg-slate-50
                        px-4
                        py-3
                        text-slate-800
                        outline-none
                        transition
                        placeholder:text-slate-400
                        focus:border-blue-500
                        focus:bg-white
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />

                  </div>
                )}

              </div>


              {/* ===========================================
                  MODAL FOOTER
                  ===========================================
                  
                  Footer is OUTSIDE the scrollable body.
                  This keeps buttons easy to access.
                  =========================================== */}

              <div className="border-t border-slate-100 bg-white px-5 py-4 sm:px-7">

                {action ===
                  "view" ? (

                  <button
                    type="button"
                    onClick={
                      closeModal
                    }
                    className="
                      w-full
                      rounded-xl
                      bg-slate-900
                      px-5
                      py-3.5
                      font-bold
                      text-white
                      transition
                      hover:bg-slate-800
                    "
                  >
                    Close
                  </button>

                ) : (

                  <div className="flex flex-col-reverse gap-3 sm:flex-row">

                    {/* CANCEL */}

                    <button
                      type="button"
                      disabled={
                        processing
                      }
                      onClick={
                        closeModal
                      }
                      className="
                        flex-1
                        rounded-xl
                        border
                        border-slate-200
                        bg-white
                        px-5
                        py-3.5
                        font-bold
                        text-slate-600
                        transition
                        hover:bg-slate-50
                        disabled:opacity-50
                      "
                    >
                      Cancel
                    </button>


                    {/* CONFIRM */}

                    <button
                      type="button"
                      onClick={
                        updateStatus
                      }
                      disabled={
                        processing
                      }
                      className={`
                        flex-1
                        rounded-xl
                        px-5
                        py-3.5
                        font-bold
                        text-white
                        transition
                        disabled:cursor-not-allowed
                        disabled:opacity-60

                        ${getActionButtonClass()}
                      `}
                    >
                      {
                        getActionButtonText()
                      }
                    </button>

                  </div>
                )}

              </div>

            </div>

          </div>,

          document.body
        )
      }

    </>
  );
}


// =====================================================
// SMALL REQUEST INFORMATION COMPONENT
// =====================================================

function Info({
  label,
  value,
  mono = false,
}) {
  return (
    <p className="min-w-0">

      <strong className="text-slate-700">
        {
          label
        }:
      </strong>

      {" "}

      <span
        className={
          mono
            ? "break-all font-mono font-semibold text-blue-600"
            : "break-words"
        }
      >
        {
          value ||
          "—"
        }
      </span>

    </p>
  );
}


// =====================================================
// MODAL DETAIL COMPONENT
// =====================================================

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
// EXPORT
// =====================================================

export default Requests;