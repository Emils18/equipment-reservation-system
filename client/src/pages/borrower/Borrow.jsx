// =====================================================
// Borrower Reservation Page
// =====================================================
// PURPOSE:
//
// This is the public/client page where a borrower can:
// 1. Choose the reservation schedule.
// 2. See equipment availability for that exact schedule.
// 3. Select equipment.
// 4. Enter borrower information.
// 5. Submit the reservation.
//
// IMPORTANT FEATURES:
//
// - No borrower login is required.
// - Unfinished form data is automatically saved in localStorage.
// - Refreshing/F5 will NOT erase the unfinished reservation.
// - Selected equipment is also saved.
// - Equipment availability is checked in real time.
// - Old/stale availability API responses cannot overwrite newer results.
// - Socket.IO updates availability when staff or another borrower changes data.
// - Conflicting reservations are clearly separated from future bookings.
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
} from "react-router-dom";

import api from "../../services/api";
import socket from "../../services/socket";


// =====================================================
// LOCAL STORAGE DRAFT KEY
// =====================================================
//
// This is the name used inside the browser's localStorage.
//
// The draft is stored only in the browser currently being used.
// It is NOT yet submitted to the database until the borrower
// presses "Submit Reservation".
//
const DRAFT_KEY =
  "equipment_reservation_draft_v1";


// =====================================================
// EMPTY FORM
// =====================================================
//
// We keep one clean copy of the form here.
//
// This is used when:
// - There is no saved draft.
// - The borrower presses "Clear Draft".
// - The borrower starts another reservation.
//
const EMPTY_FORM = {
  start_date: "",
  end_date: "",

  start_time: "",
  end_time: "",

  requester_name: "",
  school_id: "",

  department: "",
  subject: "",
  instructor_name: "",
  location: "",

  purpose: "",

  borrower_confirmed:
    false,
};


// =====================================================
// LOAD SAVED DRAFT
// =====================================================
//
// When the page first opens, this function checks if
// the browser has an unfinished reservation.
//
// If yes:
// - Restore all form fields.
// - Restore selected equipment.
//
// If the saved data is damaged for some reason,
// the page safely starts with a blank form.
//
function loadDraft() {
  try {
    const raw =
      window.localStorage.getItem(
        DRAFT_KEY
      );


    if (!raw) {
      return {
        form: {
          ...EMPTY_FORM,
        },

        selectedItems: [],

        restored: false,
      };
    }


    const saved =
      JSON.parse(
        raw
      );


    const selectedItems =
      Array.isArray(
        saved?.selectedItems
      )
        ? saved.selectedItems
            .map(
              (
                id
              ) =>
                Number(
                  id
                )
            )
            .filter(
              (
                id
              ) =>
                Number.isFinite(
                  id
                )
            )
        : [];


    return {
      form: {
        ...EMPTY_FORM,
        ...(
          saved?.form ||
          {}
        ),
      },

      selectedItems,

      restored: true,
    };
  } catch (error) {
    console.warn(
      "Could not restore reservation draft:",
      error
    );


    return {
      form: {
        ...EMPTY_FORM,
      },

      selectedItems: [],

      restored: false,
    };
  }
}


// =====================================================
// BORROW PAGE
// =====================================================

function Borrow() {

  // ===================================================
  // LOAD DRAFT ONCE
  // ===================================================
  //
  // useState with a function means loadDraft()
  // runs only when this page/component first starts.
  //
  const [
    initialDraft,
  ] =
    useState(
      () =>
        loadDraft()
    );


  // ===================================================
  // EQUIPMENT DATA
  // ===================================================

  const [
    items,
    setItems,
  ] =
    useState(
      []
    );


  const [
    selectedItems,
    setSelectedItems,
  ] =
    useState(
      initialDraft
        .selectedItems
    );


  // Reservations that overlap the selected schedule.
  const [
    conflicts,
    setConflicts,
  ] =
    useState(
      []
    );


  // Equipment that is physically unavailable,
  // damaged, under maintenance, archived, etc.
  const [
    unavailableItems,
    setUnavailableItems,
  ] =
    useState(
      []
    );


  // ===================================================
  // PAGE STATES
  // ===================================================

  const [
    loadingItems,
    setLoadingItems,
  ] =
    useState(
      true
    );


  const [
    checking,
    setChecking,
  ] =
    useState(
      false
    );


  const [
    submitting,
    setSubmitting,
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
    successReference,
    setSuccessReference,
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


  const [
    draftRestored,
    setDraftRestored,
  ] =
    useState(
      initialDraft
        .restored
    );


  // ===================================================
  // FORM
  // ===================================================

  const [
    form,
    setForm,
  ] =
    useState(
      initialDraft.form
    );


  // ===================================================
  // AVAILABILITY REQUEST NUMBER
  // ===================================================
  //
  // IMPORTANT:
  //
  // Imagine the borrower quickly changes:
  //
  // 9:00 AM
  // then
  // 10:00 AM
  //
  // The first API request might sometimes finish AFTER
  // the second request because of network delay.
  //
  // Without protection, the old result could incorrectly
  // replace the newest availability result.
  //
  // This number makes sure ONLY the newest request
  // can update the screen.
  //
  const availabilityRequestRef =
    useRef(
      0
    );


  // =====================================================
  // MINIMUM RESERVATION DATE
  // =====================================================
  //
  // School rule:
  // Reservation must be filed at least 3 days
  // before the requested date of use.
  //
  const minimumDate =
    useMemo(
      () => {
        const date =
          new Date();


        date.setDate(
          date.getDate() +
            3
        );


        const year =
          date.getFullYear();


        const month =
          String(
            date.getMonth() +
              1
          ).padStart(
            2,
            "0"
          );


        const day =
          String(
            date.getDate()
          ).padStart(
            2,
            "0"
          );


        return `${year}-${month}-${day}`;
      },
      []
    );


  // =====================================================
  // SCHEDULE VALIDATION
  // =====================================================
  //
  // This checks the schedule BEFORE asking the backend
  // for equipment availability.
  //
  // Example of an invalid schedule:
  //
  // Date of Use:
  // Sep 24
  // Start:
  // 9:00 PM
  //
  // Return Date:
  // Sep 24
  // End:
  // 1:00 AM
  //
  // That is invalid because 1:00 AM already happened
  // before 9:00 PM on the same date.
  //
  // If they mean "1:00 AM tomorrow", they must select
  // Sep 25 as the Return / End Date.
  //
  const scheduleState =
    useMemo(
      () => {

        const complete =
          Boolean(
            form.start_date &&
            form.end_date &&
            form.start_time &&
            form.end_time
          );


        // The schedule is not yet complete.
        if (
          !complete
        ) {
          return {
            complete:
              false,

            valid:
              false,

            message:
              "",
          };
        }


        const start =
          new Date(
            `${form.start_date}T${form.start_time}`
          );


        const end =
          new Date(
            `${form.end_date}T${form.end_time}`
          );


        // Invalid browser date/time value.
        if (
          Number.isNaN(
            start.getTime()
          ) ||
          Number.isNaN(
            end.getTime()
          )
        ) {
          return {
            complete:
              true,

            valid:
              false,

            message:
              "Please choose a valid reservation date and time.",
          };
        }


        // Start date must still follow the 3-day rule.
        //
        // This also protects an OLD saved draft.
        // Example:
        // The borrower saved a draft several days ago,
        // then returns today when that date is already too early.
        //
        if (
          form.start_date <
          minimumDate
        ) {
          return {
            complete:
              true,

            valid:
              false,

            message:
              "The date of use must be at least 3 days from today.",
          };
        }


        // Return must be AFTER start.
        if (
          end <=
          start
        ) {
          return {
            complete:
              true,

            valid:
              false,

            message:
              "Return date/time must be after the start date/time. If the return is after midnight, choose the next day as the Return / End Date.",
          };
        }


        // Everything is valid.
        return {
          complete:
            true,

          valid:
            true,

          message:
            "",
        };
      },
      [
        form.start_date,
        form.end_date,
        form.start_time,
        form.end_time,
        minimumDate,
      ]
    );


  // =====================================================
  // CHECK IF THERE IS ANYTHING WORTH SAVING
  // =====================================================
  //
  // We do not need to keep an empty draft in localStorage.
  //
  const hasDraftData =
    useMemo(
      () => {

        const hasText =
          Object.entries(
            form
          ).some(
            (
              [
                key,
                value,
              ]
            ) => {

              // Checkbox is boolean instead of text.
              if (
                key ===
                "borrower_confirmed"
              ) {
                return Boolean(
                  value
                );
              }


              return (
                String(
                  value ||
                    ""
                ).trim() !==
                ""
              );
            }
          );


        return (
          hasText ||
          selectedItems.length >
            0
        );
      },
      [
        form,
        selectedItems,
      ]
    );


  // =====================================================
  // AUTOMATICALLY SAVE THE DRAFT
  // =====================================================
  //
  // Whenever the borrower changes:
  // - Dates
  // - Times
  // - Name
  // - School ID
  // - Department
  // - Purpose
  // - Selected equipment
  //
  // The unfinished form is automatically saved.
  //
  // Therefore pressing F5 / Refresh will NOT erase it.
  //
  useEffect(
    () => {
      try {

        // Successful reservations should not remain
        // as unfinished drafts.
        if (
          !hasDraftData ||
          successReference
        ) {
          window.localStorage
            .removeItem(
              DRAFT_KEY
            );

          return;
        }


        window.localStorage
          .setItem(
            DRAFT_KEY,

            JSON.stringify({
              form,

              selectedItems,
            })
          );
      } catch (error) {
        console.warn(
          "Could not save reservation draft:",
          error
        );
      }
    },
    [
      form,
      selectedItems,
      hasDraftData,
      successReference,
    ]
  );


  // =====================================================
  // SHOW SMALL LIVE UPDATE MESSAGE
  // =====================================================

  const showLiveNotice =
    useCallback(
      (
        text
      ) => {

        setLiveNotice(
          text
        );


        window.setTimeout(
          () => {
            setLiveNotice(
              ""
            );
          },
          3500
        );
      },
      []
    );


  // =====================================================
  // LOAD EQUIPMENT CATALOG
  // =====================================================
  //
  // Loads:
  // - Equipment
  // - Condition
  // - Asset code
  // - Upcoming reservation schedules
  //
  const loadCatalog =
    useCallback(
      async (
        silent = false
      ) => {

        try {

          if (
            !silent
          ) {
            setLoadingItems(
              true
            );
          }


          const response =
            await api.get(
              "/reservations/catalog"
            );


          setItems(
            response.data
              .items ||
              []
          );

        } catch (error) {

          console.error(
            "Catalog error:",
            error
          );


          if (
            !silent
          ) {
            setMessage(
              "Could not load equipment."
            );
          }

        } finally {

          if (
            !silent
          ) {
            setLoadingItems(
              false
            );
          }
        }
      },
      []
    );


  // =====================================================
  // INITIAL EQUIPMENT LOAD
  // =====================================================

  useEffect(
    () => {
      loadCatalog();
    },
    [
      loadCatalog,
    ]
  );


  // =====================================================
  // REMOVE INVALID SAVED EQUIPMENT IDs
  // =====================================================
  //
  // Example:
  //
  // Yesterday:
  // Borrower selected Projector #5.
  //
  // Today:
  // Staff archived Projector #5.
  //
  // When the borrower comes back to the saved draft,
  // Projector #5 should no longer remain selected.
  //
  useEffect(
    () => {

      if (
        loadingItems
      ) {
        return;
      }


      const validIds =
        new Set(
          items.map(
            (
              item
            ) =>
              Number(
                item.id
              )
          )
        );


      setSelectedItems(
        (
          previous
        ) =>
          previous.filter(
            (
              id
            ) =>
              validIds.has(
                Number(
                  id
                )
              )
          )
      );

    },
    [
      items,
      loadingItems,
    ]
  );


  // =====================================================
  // REAL-TIME SOCKET.IO EVENTS
  // =====================================================
  //
  // If:
  // - Another borrower creates a reservation.
  // - Staff changes a reservation.
  // - Staff archives/restores/updates equipment.
  //
  // This page automatically reloads the catalog.
  //
  // After the catalog changes, the availability checker
  // automatically checks the selected schedule again.
  //
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


      const refreshAvailability =
        async () => {

          await loadCatalog(
            true
          );


          showLiveNotice(
            "Equipment availability was updated live."
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


      socket.on(
        "reservation_created",
        refreshAvailability
      );


      socket.on(
        "reservation_updated",
        refreshAvailability
      );


      socket.on(
        "equipment_updated",
        refreshAvailability
      );


      // Remove only the exact listeners created above.
      //
      // This prevents accidentally removing other
      // Socket.IO listeners from other components.
      //
      return () => {

        socket.off(
          "connect",
          handleConnect
        );


        socket.off(
          "disconnect",
          handleDisconnect
        );


        socket.off(
          "reservation_created",
          refreshAvailability
        );


        socket.off(
          "reservation_updated",
          refreshAvailability
        );


        socket.off(
          "equipment_updated",
          refreshAvailability
        );
      };
    },
    [
      loadCatalog,
      showLiveNotice,
    ]
  );


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange =
    (
      event
    ) => {

      const {
        name,
        value,
        type,
        checked,
      } =
        event.target;


      // Once they start editing again,
      // the "draft restored" message can disappear.
      setDraftRestored(
        false
      );


      setMessage(
        ""
      );


      setForm(
        (
          previous
        ) => ({
          ...previous,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );
    };


  // =====================================================
  // SELECT / UNSELECT EQUIPMENT
  // =====================================================

  const toggleItem =
    (
      item
    ) => {

      const itemId =
        Number(
          item.id
        );


      const conflict =
        conflicts.some(
          (
            entry
          ) =>
            Number(
              entry.item_id
            ) ===
            itemId
        );


      const physicallyUnavailable =
        unavailableItems.some(
          (
            entry
          ) =>
            Number(
              entry.id
            ) ===
            itemId
        );


      // Prevent selection if:
      // - Item is damaged/maintenance.
      // - Schedule is not valid yet.
      // - Availability is still being checked.
      // - Item conflicts with another reservation.
      // - Item is physically unavailable.
      //
      if (
        item.condition_status !==
          "good" ||
        !scheduleState.valid ||
        checking ||
        conflict ||
        physicallyUnavailable
      ) {
        return;
      }


      setDraftRestored(
        false
      );


      setSelectedItems(
        (
          previous
        ) => {

          // Already selected -> remove.
          if (
            previous.includes(
              itemId
            )
          ) {
            return previous.filter(
              (
                id
              ) =>
                Number(
                  id
                ) !==
                itemId
            );
          }


          // Not selected -> add.
          return [
            ...previous,
            itemId,
          ];
        }
      );
    };


  // =====================================================
  // AUTOMATIC AVAILABILITY CHECK
  // =====================================================
  //
  // This runs automatically after the borrower chooses:
  //
  // - Start Date
  // - End Date
  // - Start Time
  // - End Time
  //
  // It checks ALL equipment against that exact schedule.
  //
  // IMPORTANT:
  // requestId prevents stale/old API responses.
  //
  useEffect(
    () => {

      // Do not call the server until schedule is complete,
      // valid, and equipment has already loaded.
      if (
        !scheduleState.complete ||
        !scheduleState.valid ||
        items.length ===
          0
      ) {

        // Invalidate any older API request.
        availabilityRequestRef
          .current +=
          1;


        setChecking(
          false
        );


        setConflicts(
          []
        );


        setUnavailableItems(
          []
        );


        return;
      }


      // Create a unique number for THIS check.
      const requestId =
        availabilityRequestRef
          .current +
        1;


      availabilityRequestRef
        .current =
        requestId;


      let cancelled =
        false;


      // Small delay prevents unnecessary requests while
      // the borrower is still changing schedule fields.
      const timer =
        window.setTimeout(
          async () => {

            try {

              if (
                requestId ===
                availabilityRequestRef
                  .current
              ) {
                setChecking(
                  true
                );
              }


              const response =
                await api.post(
                  "/reservations/check-availability",
                  {
                    item_ids:
                      items.map(
                        (
                          item
                        ) =>
                          item.id
                      ),

                    start_date:
                      form.start_date,

                    end_date:
                      form.end_date,

                    start_time:
                      form.start_time,

                    end_time:
                      form.end_time,
                  }
                );


              // Ignore this response if:
              // - Component/effect changed.
              // - A newer availability request already started.
              //
              if (
                cancelled ||
                requestId !==
                  availabilityRequestRef
                    .current
              ) {
                return;
              }


              setConflicts(
                response.data
                  .conflicts ||
                  []
              );


              setUnavailableItems(
                response.data
                  .unavailable_items ||
                  []
              );

            } catch (error) {

              // Also ignore errors from an outdated request.
              if (
                cancelled ||
                requestId !==
                  availabilityRequestRef
                    .current
              ) {
                return;
              }


              console.error(
                "Availability error:",
                error
              );


              setConflicts(
                []
              );


              setUnavailableItems(
                []
              );

            } finally {

              // Only the newest request may stop
              // the loading/checking indicator.
              if (
                !cancelled &&
                requestId ===
                  availabilityRequestRef
                    .current
              ) {
                setChecking(
                  false
                );
              }
            }
          },
          350
        );


      // Cleanup when dates/time/equipment changes.
      return () => {

        cancelled =
          true;


        window.clearTimeout(
          timer
        );


        // Mark the old request as outdated.
        if (
          availabilityRequestRef
            .current ===
          requestId
        ) {
          availabilityRequestRef
            .current +=
            1;
        }
      };

    },
    [
      scheduleState.complete,
      scheduleState.valid,

      form.start_date,
      form.end_date,
      form.start_time,
      form.end_time,

      items,
    ]
  );


  // =====================================================
  // REMOVE ITEMS THAT BECOME UNAVAILABLE
  // =====================================================
  //
  // Example:
  //
  // Borrower A selects a projector.
  //
  // Before Borrower A submits,
  // Borrower B successfully reserves it.
  //
  // Socket.IO refreshes the page.
  //
  // If Projector becomes blocked for Borrower A's
  // selected schedule, it is automatically removed
  // from Borrower A's selected equipment.
  //
  useEffect(
    () => {

      const blockedIds =
        new Set([
          ...conflicts.map(
            (
              conflict
            ) =>
              Number(
                conflict.item_id
              )
          ),

          ...unavailableItems.map(
            (
              item
            ) =>
              Number(
                item.id
              )
          ),
        ]);


      if (
        blockedIds.size ===
        0
      ) {
        return;
      }


      setSelectedItems(
        (
          previous
        ) =>
          previous.filter(
            (
              id
            ) =>
              !blockedIds.has(
                Number(
                  id
                )
              )
          )
      );

    },
    [
      conflicts,
      unavailableItems,
    ]
  );


  // =====================================================
  // FIND CONFLICT FOR ONE EQUIPMENT ITEM
  // =====================================================

  const getConflict =
    (
      itemId
    ) =>
      conflicts.find(
        (
          conflict
        ) =>
          Number(
            conflict.item_id
          ) ===
          Number(
            itemId
          )
      );


  // =====================================================
  // FIND PHYSICAL UNAVAILABILITY FOR ONE ITEM
  // =====================================================

  const getUnavailable =
    (
      itemId
    ) =>
      unavailableItems.find(
        (
          item
        ) =>
          Number(
            item.id
          ) ===
          Number(
            itemId
          )
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
        return "";
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
  // CONFLICT STATUS LABEL
  // =====================================================
  //
  // These are statuses that BLOCK an overlapping booking.
  //
  // Pending   -> another borrower already requested it
  // Approved  -> already reserved
  // Finalized -> already reserved
  // Released  -> currently borrowed
  //
  const conflictStatusLabel =
    (
      status
    ) => {

      if (
        status ===
        "pending"
      ) {
        return "Pending";
      }


      if (
        status ===
        "released"
      ) {
        return "Borrowed";
      }


      return "Reserved";
    };


  // =====================================================
  // CLEAR DRAFT
  // =====================================================

  const clearDraft =
    () => {

      const confirmed =
        window.confirm(
          "Clear all reservation details and selected equipment?"
        );


      if (
        !confirmed
      ) {
        return;
      }


      window.localStorage
        .removeItem(
          DRAFT_KEY
        );


      setForm({
        ...EMPTY_FORM,
      });


      setSelectedItems(
        []
      );


      setConflicts(
        []
      );


      setUnavailableItems(
        []
      );


      setMessage(
        ""
      );


      setDraftRestored(
        false
      );
    };


  // =====================================================
  // START A NEW RESERVATION
  // =====================================================
  //
  // This replaces the old:
  //
  // window.location.reload()
  //
  // We do not need to reload the whole website anymore.
  //
  const startNewReservation =
    () => {

      window.localStorage
        .removeItem(
          DRAFT_KEY
        );


      setSuccessReference(
        ""
      );


      setForm({
        ...EMPTY_FORM,
      });


      setSelectedItems(
        []
      );


      setConflicts(
        []
      );


      setUnavailableItems(
        []
      );


      setMessage(
        ""
      );


      setDraftRestored(
        false
      );


      loadCatalog(
        true
      );


      window.scrollTo({
        top:
          0,

        behavior:
          "smooth",
      });
    };


  // =====================================================
  // SUBMIT RESERVATION
  // =====================================================

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      setMessage(
        ""
      );


      // -----------------------------------------------
      // Schedule must be complete.
      // -----------------------------------------------

      if (
        !scheduleState.complete
      ) {
        setMessage(
          "Complete the reservation date and time first."
        );

        return;
      }


      // -----------------------------------------------
      // Schedule must also be logically valid.
      // -----------------------------------------------

      if (
        !scheduleState.valid
      ) {
        setMessage(
          scheduleState.message
        );

        return;
      }


      // -----------------------------------------------
      // Wait for availability API before submitting.
      // -----------------------------------------------

      if (
        checking
      ) {
        setMessage(
          "Please wait while equipment availability is checked."
        );

        return;
      }


      // -----------------------------------------------
      // At least one equipment item is required.
      // -----------------------------------------------

      if (
        selectedItems.length ===
        0
      ) {
        setMessage(
          "Select at least one available equipment item."
        );

        return;
      }


      // -----------------------------------------------
      // Final client-side conflict check.
      // -----------------------------------------------

      const selectedConflict =
        conflicts.find(
          (
            conflict
          ) =>
            selectedItems.includes(
              Number(
                conflict.item_id
              )
            )
        );


      if (
        selectedConflict
      ) {
        setMessage(
          `${selectedConflict.item_name} conflicts with an existing reservation for your selected schedule.`
        );

        return;
      }


      // -----------------------------------------------
      // Final physical availability check.
      // -----------------------------------------------

      const selectedUnavailable =
        unavailableItems.find(
          (
            item
          ) =>
            selectedItems.includes(
              Number(
                item.id
              )
            )
        );


      if (
        selectedUnavailable
      ) {
        setMessage(
          `${
            selectedUnavailable
              .name ||
            "One selected item"
          } is currently unavailable.`
        );

        return;
      }


      // -----------------------------------------------
      // Borrower acknowledgement required.
      // -----------------------------------------------

      if (
        !form.borrower_confirmed
      ) {
        setMessage(
          "Please confirm that your information is correct."
        );

        return;
      }


      // -----------------------------------------------
      // Send reservation to server.
      // -----------------------------------------------

      try {

        setSubmitting(
          true
        );


        const response =
          await api.post(
            "/reservations",
            {
              ...form,

              item_ids:
                selectedItems,
            }
          );


        // ---------------------------------------------
        // Reservation succeeded.
        //
        // It is no longer an unfinished draft,
        // so remove it from localStorage.
        // ---------------------------------------------

        window.localStorage
          .removeItem(
            DRAFT_KEY
          );


        setSuccessReference(
          response.data
            .reference_code
        );


        window.scrollTo({
          top:
            0,

          behavior:
            "smooth",
        });

      } catch (error) {

        console.error(
          "Reservation submit error:",
          error
        );


        setMessage(
          error.response
            ?.data
            ?.message ||
            "Could not submit reservation request."
        );


        // If the server discovered a conflict during
        // final transactional checking, show it.
        if (
          error.response
            ?.data
            ?.conflicts
        ) {
          setConflicts(
            error.response
              .data
              .conflicts
          );
        }

      } finally {

        setSubmitting(
          false
        );
      }
    };


  // =====================================================
  // SUCCESS SCREEN
  // =====================================================

  if (
    successReference
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50">

        <BorrowerHeader
          connected={
            connected
          }
        />


        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">

          <div className="animate-pop-in rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-xl shadow-emerald-100/40 sm:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl font-black text-emerald-600">
              ✓
            </div>


            <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-600">
              Request Submitted
            </p>


            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Reservation Received
            </h1>


            <p className="mx-auto mt-3 max-w-xl leading-6 text-slate-500">
              Your request is now waiting
              for review by the Computer
              Maintenance Office.
            </p>


            <div className="mx-auto mt-8 max-w-md rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">

              <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-500">
                Reference Number
              </p>


              <p className="mt-2 break-all font-mono text-xl font-black text-blue-700 sm:text-2xl">
                {
                  successReference
                }
              </p>

            </div>


            <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-emerald-600">

              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

              Real-time tracking enabled

            </div>


            <p className="mt-5 text-sm leading-6 text-slate-500">
              Keep this reference number.
              Use it to check approval,
              rejection, release, return,
              and other updates.
            </p>


            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">

              <Link
                to={`/track?reference=${encodeURIComponent(
                  successReference
                )}`}
                className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Track Request
              </Link>


              <button
                type="button"
                onClick={
                  startNewReservation
                }
                className="rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-600 transition hover:bg-slate-50"
              >
                New Reservation
              </button>

            </div>

          </div>

        </main>

      </div>
    );
  }


  // =====================================================
  // MAIN BORROWER PAGE
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50">

      <BorrowerHeader
        connected={
          connected
        }
      />


      {/* =================================================
          REAL-TIME UPDATE TOAST
          ================================================= */}

      {liveNotice && (
        <div className="animate-toast-in fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl sm:bottom-6 sm:right-6">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              ↻
            </div>


            <div>

              <p className="font-extrabold text-slate-900">
                Live Update
              </p>


              <p className="mt-1 text-sm text-slate-600">
                {
                  liveNotice
                }
              </p>

            </div>

          </div>

        </div>
      )}


      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

        {/* =================================================
            PAGE HEADING
            ================================================= */}

        <div className="animate-fade-up mb-7">

          <div className="flex flex-wrap items-center gap-2">

            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
              Borrower Portal
            </p>


            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
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


          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Reserve Equipment
              </h1>


              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 sm:text-base">
                Choose your schedule first.
                The system will then check
                each equipment item against
                existing reservations in
                real time.
              </p>

            </div>


            {/* Clear Draft appears only if something is saved. */}

            {hasDraftData && (
              <button
                type="button"
                onClick={
                  clearDraft
                }
                className="self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:self-auto"
              >
                Clear Draft
              </button>
            )}

          </div>

        </div>


        {/* =================================================
            SAVED DRAFT RESTORED MESSAGE
            ================================================= */}

        {draftRestored && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">

            <p className="font-extrabold">
              Saved draft restored
            </p>


            <p className="mt-1 leading-6">
              Your unfinished reservation
              was restored from this browser.
            </p>

          </div>
        )}


        {/* =================================================
            RESERVATION NOTICE
            ================================================= */}

        <div className="mb-7 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">

          <p className="font-extrabold text-amber-800">
            Reservation Notice
          </p>


          <p className="mt-1 text-sm leading-6 text-amber-700">
            Reservations must be filed
            at least 3 days before the
            requested date of use.
            Online approval is preliminary.
            Approved borrowers must proceed
            to the Repair Room to complete
            the required physical form
            and signatures.
          </p>


          <p className="mt-2 text-xs font-bold text-amber-700">
            Unfinished information is
            saved automatically in this
            browser.
          </p>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6"
        >

          {/* =================================================
              STEP 1 - RESERVATION SCHEDULE
              ================================================= */}

          <Section
            step="1"
            title="Reservation Schedule"
            description="Choose the complete date and time first so availability can be checked correctly."
          >

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              {/* DATE OF USE */}

              <Field label="Date of Use">

                <input
                  type="date"
                  name="start_date"
                  onClick={(event) => {
                    if (typeof event.currentTarget.showPicker === "function") {
                      try {
                        event.currentTarget.showPicker();
                      } catch {
                        // Browser may block showPicker in some environments.
                      }
                    }
                  }}
                  min={
                    minimumDate
                  }
                  value={
                    form.start_date
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className={`${inputClass} cursor-pointer hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-md`}
                />

              </Field>


              {/* RETURN DATE */}

              <Field label="Return / End Date">

                <input
                  type="date"
                  name="end_date"
                  onClick={(event) => {
                    if (typeof event.currentTarget.showPicker === "function") {
                      try {
                        event.currentTarget.showPicker();
                      } catch {
                        // Browser may block showPicker in some environments.
                      }
                    }
                  }}
                  min={
                    form.start_date ||
                    minimumDate
                  }
                  value={
                    form.end_date
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className={`${inputClass} cursor-pointer hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-md`}
                />

              </Field>


              {/* START TIME */}

              <Field label="Start Time">

                <input
                  type="time"
                  name="start_time"
                  onClick={(event) => {
                    if (typeof event.currentTarget.showPicker === "function") {
                      try {
                        event.currentTarget.showPicker();
                      } catch {
                        // Browser may block showPicker in some environments.
                      }
                    }
                  }}
                  value={
                    form.start_time
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className={`${inputClass} cursor-pointer hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-md`}
                />

              </Field>


              {/* END TIME */}

              <Field label="End Time">

                <input
                  type="time"
                  name="end_time"
                  onClick={(event) => {
                    if (typeof event.currentTarget.showPicker === "function") {
                      try {
                        event.currentTarget.showPicker();
                      } catch {
                        // Browser may block showPicker in some environments.
                      }
                    }
                  }}
                  value={
                    form.end_time
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className={`${inputClass} cursor-pointer hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-md`}
                />

              </Field>

            </div>


            {/* Schedule is still incomplete. */}

            {!scheduleState.complete && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                Complete all four schedule
                fields to check live
                equipment availability.
              </div>
            )}


            {/* Schedule is complete but logically wrong. */}

            {scheduleState.complete &&
              !scheduleState.valid && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {
                    scheduleState.message
                  }
                </div>
              )}


            {/* API is currently checking availability. */}

            {scheduleState.valid &&
              checking && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-600">

                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />

                  Checking live availability...

                </div>
              )}


            {/* Schedule is valid and current check has finished. */}

            {scheduleState.valid &&
              !checking && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  ✓ Schedule is valid.
                  Equipment below is shown
                  for this exact date and time.
                </div>
              )}

          </Section>


          {/* =================================================
              STEP 2 - EQUIPMENT
              ================================================= */}

          <Section
            step="2"
            title="Select Equipment"
            description="Only equipment that is available for your exact selected schedule can be selected."
          >

            {/* STATUS LEGEND */}

            <div className="mb-5 flex flex-wrap gap-2 text-[11px] font-bold sm:text-xs">

              <Legend
                className="bg-slate-100 text-slate-600"
                text="Choose Schedule"
              />


              <Legend
                className="bg-emerald-100 text-emerald-700"
                text="Available"
              />


              <Legend
                className="bg-amber-100 text-amber-700"
                text="Pending"
              />


              <Legend
                className="bg-red-100 text-red-700"
                text="Reserved / Borrowed"
              />


              <Legend
                className="bg-slate-200 text-slate-600"
                text="Maintenance / Unavailable"
              />

            </div>


            {/* LOADING EQUIPMENT */}

            {loadingItems ? (

              <div className="py-12 text-center">

                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />


                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Loading equipment...
                </p>

              </div>

            ) : items.length ===
              0 ? (

              /* NO EQUIPMENT */

              <div className="py-12 text-center text-slate-500">
                No equipment is currently
                listed.
              </div>

            ) : (

              /* EQUIPMENT GRID */

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

                {items.map(
                  (
                    item
                  ) => {

                    const itemId =
                      Number(
                        item.id
                      );


                    const conflict =
                      getConflict(
                        itemId
                      );


                    const physicalUnavailable =
                      getUnavailable(
                        itemId
                      );


                    const selected =
                      selectedItems.includes(
                        itemId
                      );


                    // Equipment condition problem.
                    const physicalProblem =
                      item.condition_status !==
                        "good" ||
                      Boolean(
                        physicalUnavailable
                      );


                    // No valid schedule means the system
                    // cannot accurately say it is available.
                    const scheduleNotReady =
                      !scheduleState.valid;


                    // Disable item selection when necessary.
                    const disabled =
                      physicalProblem ||
                      scheduleNotReady ||
                      checking ||
                      Boolean(
                        conflict
                      );


                    // =======================================
                    // EQUIPMENT STATUS
                    // =======================================

                    let statusText =
                      "Choose Schedule";


                    let statusClass =
                      "bg-slate-100 text-slate-600";


                    // ---------------------------------------
                    // Physical problem has highest priority.
                    // ---------------------------------------

                    if (
                      physicalProblem
                    ) {

                      if (
                        item.condition_status ===
                        "maintenance"
                      ) {
                        statusText =
                          "Maintenance";

                      } else if (
                        item.condition_status ===
                        "damaged"
                      ) {
                        statusText =
                          "Damaged";

                      } else {
                        statusText =
                          "Unavailable";
                      }


                      statusClass =
                        "bg-slate-200 text-slate-600";

                    }

                    // ---------------------------------------
                    // Schedule is incomplete/invalid.
                    // ---------------------------------------

                    else if (
                      !scheduleState.valid
                    ) {

                      statusText =
                        scheduleState.complete
                          ? "Fix Schedule"
                          : "Choose Schedule";


                      statusClass =
                        "bg-slate-100 text-slate-600";

                    }

                    // ---------------------------------------
                    // Server is still checking.
                    // ---------------------------------------

                    else if (
                      checking
                    ) {

                      statusText =
                        "Checking...";


                      statusClass =
                        "bg-blue-100 text-blue-700";

                    }

                    // ---------------------------------------
                    // Reservation overlap exists.
                    // ---------------------------------------

                    else if (
                      conflict
                    ) {

                      statusText =
                        conflictStatusLabel(
                          conflict.status
                        );


                      statusClass =
                        conflict.status ===
                        "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700";

                    }

                    // ---------------------------------------
                    // No conflict = actually available.
                    // ---------------------------------------

                    else {

                      statusText =
                        "Available";


                      statusClass =
                        "bg-emerald-100 text-emerald-700";

                    }


                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        disabled={
                          disabled
                        }
                        onClick={
                          () =>
                            toggleItem(
                              item
                            )
                        }
                        className={`
                          rounded-2xl
                          border
                          p-5
                          text-left
                          transition-all
                          duration-200

                          ${
                            selected
                              ? "border-blue-500 bg-blue-50 ring-4 ring-blue-100"
                              : "border-slate-200 bg-white"
                          }

                          ${
                            disabled
                              ? "cursor-not-allowed opacity-70"
                              : "hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                          }
                        `}
                      >

                        {/* EQUIPMENT TITLE + STATUS */}

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <h3 className="truncate font-black tracking-tight text-slate-900">
                              {
                                item.name
                              }
                            </h3>


                            <p className="mt-1 truncate text-sm text-slate-500">
                              {
                                item.category ||
                                "Equipment"
                              }
                            </p>

                          </div>


                          <span
                            className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-bold ${statusClass}`}
                          >
                            {
                              statusText
                            }
                          </span>

                        </div>


                        {/* BASIC EQUIPMENT INFORMATION */}

                        <div className="mt-4 space-y-1 text-sm text-slate-600">

                          <p>

                            <span className="font-bold text-slate-700">
                              Asset:
                            </span>

                            {" "}

                            {
                              item.asset_code ||
                              "No asset code"
                            }

                          </p>


                          {item.description && (
                            <p className="line-clamp-2 text-slate-500">
                              {
                                item.description
                              }
                            </p>
                          )}

                        </div>


                        {/* ===================================
                            ACTUAL CONFLICT
                            ===================================
                            
                            This means an existing reservation
                            overlaps the borrower's exact
                            selected date/time.

                            This is a REAL reason the item
                            cannot be selected.
                            =================================== */}

                        {conflict && (
                          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs leading-5 text-red-700">

                            <p className="font-extrabold">
                              Conflicts with your selected schedule
                            </p>


                            <p className="mt-1">

                              Existing{" "}

                              {
                                conflictStatusLabel(
                                  conflict.status
                                )
                              }

                              :
                              {" "}

                              {
                                formatDate(
                                  conflict.start_date
                                )
                              }

                              {" "}

                              {
                                formatTime(
                                  conflict.start_time
                                )
                              }

                              {" – "}

                              {
                                formatDate(
                                  conflict.end_date
                                )
                              }

                              {" "}

                              {
                                formatTime(
                                  conflict.end_time
                                )
                              }

                            </p>

                          </div>
                        )}


                        {/* ===================================
                            AVAILABLE FOR SELECTED SCHEDULE
                            =================================== */}

                        {!conflict &&
                          scheduleState.valid &&
                          !checking &&
                          !physicalProblem && (

                            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs leading-5 text-emerald-700">

                              <p className="font-extrabold">
                                ✓ Available for your selected schedule
                              </p>

                            </div>
                          )}


                        {/* ===================================
                            UPCOMING RESERVATION
                            ===================================

                            IMPORTANT:

                            This section is INFORMATION ONLY.

                            If this box appears WITHOUT the
                            red conflict box above, then the
                            upcoming reservation does NOT
                            overlap the borrower's selected
                            schedule.

                            Example:

                            Borrower wants:
                            Sep 24 - Sep 25

                            Existing future booking:
                            Sep 28 - Sep 29

                            That item is STILL available
                            Sep 24 - Sep 25.
                            =================================== */}

                        {!conflict &&
                          item.schedules
                            ?.length >
                            0 && (

                            <div className="mt-4 border-t border-slate-100 pt-3">

                              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                Upcoming Reservation
                              </p>


                              <p className="mt-1 text-xs leading-5 text-slate-500">

                                {
                                  formatDate(
                                    item
                                      .schedules[0]
                                      .start_date
                                  )
                                }

                                {" "}

                                {
                                  formatTime(
                                    item
                                      .schedules[0]
                                      .start_time
                                  )
                                }

                                {" – "}

                                {
                                  formatDate(
                                    item
                                      .schedules[0]
                                      .end_date
                                  )
                                }

                                {" "}

                                {
                                  formatTime(
                                    item
                                      .schedules[0]
                                      .end_time
                                  )
                                }

                              </p>


                              {scheduleState.valid && (
                                <p className="mt-1 text-[11px] font-semibold text-blue-600">
                                  This booking does not
                                  overlap your selected
                                  schedule.
                                </p>
                              )}

                            </div>
                          )}


                        {/* SELECTED INDICATOR */}

                        {selected && (
                          <p className="mt-4 text-sm font-extrabold text-blue-600">
                            ✓ Selected
                          </p>
                        )}

                      </button>
                    );
                  }
                )}

              </div>
            )}

          </Section>


          {/* =================================================
              STEP 3 - BORROWER INFORMATION
              ================================================= */}

          <Section
            step="3"
            title="Borrower Information"
            description="Provide the same details required by the reservation form."
          >

            <div className="grid gap-4 sm:grid-cols-2">

              {/* FULL NAME */}

              <Field label="Requesting Party / Name *">

                <input
                  type="text"
                  name="requester_name"
                  value={
                    form.requester_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Full name"
                  required
                  className={
                    inputClass
                  }
                />

              </Field>


              {/* SCHOOL ID NUMBER */}

              <Field label="School ID *">

                <input
                  type="text"
                  name="school_id"
                  value={
                    form.school_id
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="School ID"
                  required
                  className={
                    inputClass
                  }
                />

              </Field>


              {/* DEPARTMENT */}

              <Field label="Department *">

                <input
                  type="text"
                  name="department"
                  value={
                    form.department
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Department"
                  required
                  className={
                    inputClass
                  }
                />

              </Field>


              {/* SUBJECT */}

              <Field label="Subject">

                <input
                  type="text"
                  name="subject"
                  value={
                    form.subject
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Subject / Course"
                  className={
                    inputClass
                  }
                />

              </Field>


              {/* INSTRUCTOR */}

              <Field label="Instructor Name">

                <input
                  type="text"
                  name="instructor_name"
                  value={
                    form.instructor_name
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Instructor name"
                  className={
                    inputClass
                  }
                />

              </Field>


              {/* LOCATION */}

              <Field label="Location">

                <input
                  type="text"
                  name="location"
                  value={
                    form.location
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Room / Building"
                  className={
                    inputClass
                  }
                />

              </Field>


              {/* PURPOSE */}

              <div className="sm:col-span-2">

                <Field label="Purpose *">

                  <textarea
                    name="purpose"
                    value={
                      form.purpose
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    placeholder="What will the equipment be used for?"
                    required
                    className={`${inputClass} resize-none`}
                  />

                </Field>

              </div>

            </div>

          </Section>


          {/* =================================================
              STEP 4 - CONFIRMATION
              ================================================= */}

          <Section
            step="4"
            title="Confirmation"
            description="Review the information before submitting."
          >

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200">

              <input
                type="checkbox"
                name="borrower_confirmed"
                checked={
                  form.borrower_confirmed
                }
                onChange={
                  handleChange
                }
                required
                className="mt-1 h-5 w-5 flex-shrink-0"
              />


              <span className="text-sm leading-6 text-slate-600">
                I confirm that the
                information I submitted
                is correct. I understand
                that online approval does
                not replace the required
                physical form and signatures
                at the Repair Room.
              </span>

            </label>


            {/* GENERAL SUBMISSION ERROR */}

            {message && (
              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {
                  message
                }
              </div>
            )}


            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm text-slate-500">

                  Selected equipment:
                  {" "}

                  <strong className="text-slate-900">
                    {
                      selectedItems.length
                    }
                  </strong>

                </p>


                {hasDraftData && (
                  <p className="mt-1 text-xs font-semibold text-blue-600">
                    Draft is being saved
                    automatically in this browser.
                  </p>
                )}

              </div>


              {/* SUBMIT BUTTON */}

              <button
                type="submit"
                disabled={
                  submitting ||
                  checking ||
                  !scheduleState.valid
                }
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
              >

                {
                  submitting
                    ? "Submitting Request..."
                    : checking
                      ? "Checking Availability..."
                      : "Submit Reservation"
                }

              </button>

            </div>

          </Section>

        </form>

      </main>

    </div>
  );
}


// =====================================================
// BORROWER HEADER
// =====================================================
//
// IMPORTANT:
//
// There is intentionally NO Staff link here.
//
// Client routes remain separate from:
// /staff/login
// /staff/dashboard
//
function BorrowerHeader({
  connected,
}) {
  return (
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

        <nav className="flex items-center gap-1 sm:gap-2">

          {/* LIVE CONNECTION STATUS */}

          <span
            className={`mr-1 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black sm:flex ${
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
            className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-100 sm:px-4 sm:text-sm"
          >
            Reserve
          </Link>


          {/* TRACK */}

          <Link
            to="/track"
            className="rounded-lg px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 sm:px-4 sm:text-sm"
          >

            Track

            <span className="hidden sm:inline">
              {" "}
              Request
            </span>

          </Link>

        </nav>

      </div>

    </header>
  );
}


// =====================================================
// SECTION COMPONENT
// =====================================================
//
// Reusable white card used for:
// - Step 1
// - Step 2
// - Step 3
// - Step 4
//
function Section({
  step,
  title,
  description,
  children,
}) {
  return (
    <section className="animate-fade-up rounded-2xl border border-blue-100 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-6">

      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
        Step {step}
      </p>


      <h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
        {
          title
        }
      </h2>


      {description && (
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {
            description
          }
        </p>
      )}


      <div className="mt-6">
        {
          children
        }
      </div>

    </section>
  );
}


// =====================================================
// FIELD COMPONENT
// =====================================================
//
// Gives every form field the same label style.
//
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


// =====================================================
// LEGEND COMPONENT
// =====================================================
//
// Used above the equipment cards to explain
// the status colors.
//
function Legend({
  className,
  text,
}) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 ${className}`}
    >
      {
        text
      }
    </span>
  );
}


// =====================================================
// SHARED INPUT STYLE
// =====================================================
//
// Keeps text, date, time and textarea fields consistent.
//
const inputClass = `
  w-full
  rounded-xl
  border border-slate-200
  bg-slate-50
  px-4 py-3
  text-slate-800
  outline-none
  transition-all
  placeholder:text-slate-400
  focus:border-blue-500
  focus:bg-white
  focus:ring-4
  focus:ring-blue-100
`;


// =====================================================
// EXPORT
// =====================================================

export default Borrow;