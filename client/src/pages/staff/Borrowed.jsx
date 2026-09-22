// =====================================================
// REPAIR ROOM - BORROWED ITEMS
// CMOB Department
// =====================================================
//
// Shows reservations whose equipment was released.
//
// A return can only be completed after Staff confirms:
//
// ✓ Equipment physically returned
// ✓ School ID returned to borrower
//
// Modal uses ModalPortal so the ENTIRE Staff interface,
// including the sidebar, is behind the blur.
//
// =====================================================

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "../../services/api";
import socket from "../../services/socket";

import ModalPortal from "../../components/ModalPortal";


function Borrowed() {

  const [
    borrowed,
    setBorrowed,
  ] = useState([]);


  const [
    selected,
    setSelected,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    processing,
    setProcessing,
  ] = useState(false);


  const [
    returnChecks,
    setReturnChecks,
  ] = useState({
    equipment_returned:
      false,

    id_returned:
      false,
  });


  // ===================================================
  // LOAD BORROWED ITEMS
  // ===================================================

  const loadBorrowed =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "/staff/borrowed"
            );


          setBorrowed(
            response.data
              .borrowed ||
              []
          );
        } catch (error) {
          console.error(
            "Borrowed error:",
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


  // ===================================================
  // REAL TIME
  // ===================================================

  useEffect(
    () => {
      loadBorrowed();


      const handleUpdated =
        () => {
          loadBorrowed();
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
      loadBorrowed,
    ]
  );


  // ===================================================
  // FORMATTING
  // ===================================================

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


  const formatTime =
    (
      value
    ) => {
      if (
        !value
      ) {
        return "—";
      }


      const [
        hour,
        minute,
      ] =
        String(
          value
        )
          .slice(
            0,
            5
          )
          .split(
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


  const formatDateTime =
    (
      value
    ) => {
      if (
        !value
      ) {
        return "—";
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
        return "—";
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
    };


  // ===================================================
  // OPEN RETURN MODAL
  // ===================================================

  const openReturn =
    (
      reservation
    ) => {
      setSelected(
        reservation
      );


      setReturnChecks({
        equipment_returned:
          false,

        id_returned:
          false,
      });
    };


  const closeReturn =
    () => {
      if (
        processing
      ) {
        return;
      }


      setSelected(
        null
      );
    };


  // ===================================================
  // COMPLETE RETURN
  // ===================================================

  const completeReturn =
    async () => {
      if (
        !returnChecks.equipment_returned ||
        !returnChecks.id_returned
      ) {
        alert(
          "Confirm both the equipment return and the School ID return."
        );

        return;
      }


      try {
        setProcessing(
          true
        );


        await api.patch(
          `/staff/reservations/${selected.id}/complete-return`,
          {
            equipment_returned:
              true,

            id_returned:
              true,

            message:
              "Equipment has been returned and the School ID was returned to the borrower.",
          }
        );


        setSelected(
          null
        );


        await loadBorrowed();

      } catch (error) {

        alert(
          error.response
            ?.data
            ?.message ||
            "Could not complete the return."
        );

      } finally {

        setProcessing(
          false
        );
      }
    };


  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="animate-fade-up">

      {/* HEADER */}

      <div className="mb-7">

        <div className="flex items-center gap-2">

          <p className="
            text-xs
            font-extrabold
            uppercase
            tracking-[0.16em]
            text-blue-600
          ">
            Repair Room Monitoring
          </p>


          <span className="
            flex
            items-center
            gap-1
            rounded-full
            bg-emerald-50
            px-2.5
            py-1
            text-[10px]
            font-black
            uppercase
            text-emerald-700
          ">

            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

            Live

          </span>

        </div>


        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#07152d] sm:text-4xl">
          Borrowed Items
        </h1>


        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
          CMOB Department equipment currently
          released to borrowers.
        </p>

      </div>


      {/* MOBILE */}

      <div className="space-y-4 lg:hidden">

        {loading ? (
          <Loading />
        ) : borrowed.length ===
          0 ? (
          <Empty />
        ) : (
          borrowed.map(
            (
              item
            ) => (
              <article
                key={
                  item.id
                }
                className="
                  rounded-2xl
                  border
                  border-blue-100
                  bg-white
                  p-5
                  shadow-sm
                "
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">

                    <p className="truncate font-black text-slate-900">
                      {
                        item.requester_name
                      }
                    </p>


                    <p className="mt-1 font-mono text-xs font-bold text-blue-600">
                      {
                        item.reference_code
                      }
                    </p>

                  </div>


                  <BorrowStatus
                    overdue={
                      item.is_overdue
                    }
                  />

                </div>


                <div className="mt-4 space-y-2 text-sm text-slate-600">

                  <Info
                    label="School ID"
                    value={
                      item.school_id
                    }
                  />


                  <Info
                    label="Department"
                    value={
                      item.department
                    }
                  />


                  <Info
                    label="Equipment"
                    value={
                      item.items
                    }
                  />


                  <Info
                    label="Return"
                    value={`${formatDate(
                      item.end_date
                    )} • ${formatTime(
                      item.end_time
                    )}`}
                  />

                </div>


                <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3">

                  <p className="text-xs font-extrabold text-amber-800">
                    School ID held by Repair Room
                  </p>


                  <p className="mt-1 text-xs text-amber-700">
                    Deposited
                    {" "}
                    {
                      formatDateTime(
                        item.id_deposited_at
                      )
                    }
                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    () =>
                      openReturn(
                        item
                      )
                  }
                  className="
                    mt-4
                    w-full
                    rounded-xl
                    bg-[#07152d]
                    px-4
                    py-3
                    text-sm
                    font-bold
                    text-white
                    transition
                    hover:bg-blue-700
                  "
                >
                  Process Return
                </button>

              </article>
            )
          )
        )}

      </div>


      {/* DESKTOP */}

      <div className="
        hidden
        overflow-hidden
        rounded-2xl
        border
        border-blue-100
        bg-white
        shadow-sm
        lg:block
      ">

        {loading ? (
          <Loading />
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-[1000px] w-full">

              <thead className="bg-[#07152d]">

                <tr className="
                  text-left
                  text-[11px]
                  font-extrabold
                  uppercase
                  tracking-wider
                  text-blue-100
                ">

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
                    ID Deposit
                  </th>

                  <th className="px-6 py-4">
                    Return
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

                {borrowed.map(
                  (
                    item
                  ) => (
                    <tr
                      key={
                        item.id
                      }
                      className="transition hover:bg-blue-50/40"
                    >

                      <td className="px-6 py-5">

                        <p className="font-bold text-slate-900">
                          {
                            item.requester_name
                          }
                        </p>


                        <p className="mt-1 text-xs text-slate-500">
                          ID:
                          {" "}
                          {
                            item.school_id ||
                            "—"
                          }
                        </p>


                        <p className="mt-1 font-mono text-[11px] font-bold text-blue-600">
                          {
                            item.reference_code
                          }
                        </p>

                      </td>


                      <td className="px-6 py-5 text-sm text-slate-600">
                        {
                          item.department
                        }
                      </td>


                      <td className="max-w-xs px-6 py-5 text-sm font-semibold text-slate-700">
                        {
                          item.items
                        }
                      </td>


                      <td className="px-6 py-5">

                        <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700">
                          ID Deposited
                        </span>


                        <p className="mt-2 text-xs text-slate-500">
                          {
                            formatDateTime(
                              item.id_deposited_at
                            )
                          }
                        </p>

                      </td>


                      <td className="px-6 py-5 text-sm text-slate-600">

                        <p className="font-semibold">
                          {
                            formatDate(
                              item.end_date
                            )
                          }
                        </p>


                        <p className="mt-1 text-xs">
                          {
                            formatTime(
                              item.end_time
                            )
                          }
                        </p>

                      </td>


                      <td className="px-6 py-5">

                        <BorrowStatus
                          overdue={
                            item.is_overdue
                          }
                        />

                      </td>


                      <td className="px-6 py-5">

                        <button
                          type="button"
                          onClick={
                            () =>
                              openReturn(
                                item
                              )
                          }
                          className="
                            rounded-xl
                            bg-blue-600
                            px-4
                            py-2.5
                            text-sm
                            font-bold
                            text-white
                            transition
                            hover:bg-blue-700
                          "
                        >
                          Process Return
                        </button>

                      </td>

                    </tr>
                  )
                )}


                {borrowed.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan="7"
                      className="px-6 py-14"
                    >
                      <Empty />
                    </td>

                  </tr>
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* =================================================
          FULL SCREEN RETURN MODAL
          ================================================= */}

      <ModalPortal
        open={
          Boolean(
            selected
          )
        }
        onClose={
          closeReturn
        }
        locked={
          processing
        }
        maxWidth="max-w-xl"
      >

        {selected && (
          <>

            {/* MODAL HEADER */}

            <div className="
              border-b
              border-slate-100
              bg-[#07152d]
              px-5
              py-5
              text-white
              sm:px-7
            ">

              <div className="flex items-start justify-between gap-4">

                <div>

                  <p className="font-mono text-xs font-bold text-blue-300">
                    {
                      selected.reference_code
                    }
                  </p>


                  <h2 className="mt-1 text-2xl font-black">
                    Complete Return
                  </h2>


                  <p className="mt-1 text-sm text-slate-300">
                    {
                      selected.requester_name
                    }
                  </p>


                  <p className="mt-1 text-xs font-semibold text-blue-300">
                    REPAIR ROOM • CMOB Department
                  </p>

                </div>


                <button
                  type="button"
                  disabled={
                    processing
                  }
                  onClick={
                    closeReturn
                  }
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-white/10
                    text-2xl
                    text-white
                    transition
                    hover:bg-white/20
                  "
                >
                  ×
                </button>

              </div>

            </div>


            {/* MODAL BODY */}

            <div className="modal-scroll max-h-[calc(100dvh-13rem)] overflow-y-auto p-5 sm:p-7">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <Info
                  label="Equipment"
                  value={
                    selected.items
                  }
                />


                <div className="mt-3">

                  <Info
                    label="School ID"
                    value={
                      selected.school_id
                    }
                  />

                </div>


                <div className="mt-3">

                  <Info
                    label="ID Deposited"
                    value={
                      formatDateTime(
                        selected.id_deposited_at
                      )
                    }
                  />

                </div>

              </div>


              <div className="mt-6 space-y-3">

                <label className={`
                  flex
                  cursor-pointer
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  p-4
                  transition

                  ${
                    returnChecks.equipment_returned
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }
                `}>

                  <input
                    type="checkbox"
                    checked={
                      returnChecks.equipment_returned
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setReturnChecks(
                          (
                            previous
                          ) => ({
                            ...previous,

                            equipment_returned:
                              event.target.checked,
                          })
                        )
                    }
                    className="mt-1 h-5 w-5"
                  />


                  <div>

                    <p className="font-extrabold text-slate-800">
                      Equipment Returned
                    </p>


                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      I physically received and checked the equipment.
                    </p>

                  </div>

                </label>


                <label className={`
                  flex
                  cursor-pointer
                  items-start
                  gap-3
                  rounded-2xl
                  border
                  p-4
                  transition

                  ${
                    returnChecks.id_returned
                      ? "border-blue-300 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }
                `}>

                  <input
                    type="checkbox"
                    checked={
                      returnChecks.id_returned
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setReturnChecks(
                          (
                            previous
                          ) => ({
                            ...previous,

                            id_returned:
                              event.target.checked,
                          })
                        )
                    }
                    className="mt-1 h-5 w-5"
                  />


                  <div>

                    <p className="font-extrabold text-slate-800">
                      School ID Returned
                    </p>


                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      The School ID has been returned to the borrower.
                    </p>

                  </div>

                </label>

              </div>

            </div>


            {/* FOOTER */}

            <div className="border-t border-slate-100 bg-white p-5 sm:px-7">

              <div className="flex flex-col-reverse gap-3 sm:flex-row">

                <button
                  type="button"
                  disabled={
                    processing
                  }
                  onClick={
                    closeReturn
                  }
                  className="
                    flex-1
                    rounded-xl
                    border
                    border-slate-200
                    px-5
                    py-3.5
                    font-bold
                    text-slate-600
                    transition
                    hover:bg-slate-50
                  "
                >
                  Cancel
                </button>


                <button
                  type="button"
                  onClick={
                    completeReturn
                  }
                  disabled={
                    processing ||
                    !returnChecks.equipment_returned ||
                    !returnChecks.id_returned
                  }
                  className="
                    flex-1
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-3.5
                    font-bold
                    text-white
                    transition
                    hover:bg-blue-700
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  {
                    processing
                      ? "Completing..."
                      : "Complete Return"
                  }
                </button>

              </div>

            </div>

          </>
        )}

      </ModalPortal>

    </div>
  );
}


// =====================================================
// SMALL COMPONENTS
// =====================================================

function Info({
  label,
  value,
}) {
  return (
    <p className="text-sm text-slate-600">

      <strong className="font-bold text-slate-800">
        {
          label
        }:
      </strong>

      {" "}

      {
        value ||
        "—"
      }

    </p>
  );
}


function BorrowStatus({
  overdue,
}) {
  return overdue ? (
    <span className="rounded-full bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700">
      Overdue
    </span>
  ) : (
    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">
      Borrowed
    </span>
  );
}


function Loading() {
  return (
    <div className="rounded-2xl border border-blue-100 bg-white p-12 text-center shadow-sm">

      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />


      <p className="mt-4 text-sm font-semibold text-slate-500">
        Loading borrowed equipment...
      </p>

    </div>
  );
}


function Empty() {
  return (
    <div className="text-center">

      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 font-black text-blue-600">
        RR
      </div>


      <p className="mt-3 font-bold text-slate-700">
        No equipment is currently borrowed.
      </p>

    </div>
  );
}


export default Borrowed;