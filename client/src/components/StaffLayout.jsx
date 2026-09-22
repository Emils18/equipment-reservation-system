// =====================================================
// REPAIR ROOM STAFF LAYOUT
// CMOB Department
// =====================================================
//
// Clean LIGHT UI only.
//
// Includes:
// - RR branding
// - White sidebar
// - Blue active navigation
// - Real-time connection
// - Notification bell
// - Pending request count
// - Mobile menu
// - Account information
// - Logout
//
// =====================================================

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import api from "../services/api";
import socket from "../services/socket";


function StaffLayout() {

  const navigate =
    useNavigate();


  const [
    staff,
    setStaff,
  ] =
    useState(
      null
    );


  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] =
    useState(
      false
    );


  const [
    notificationsOpen,
    setNotificationsOpen,
  ] =
    useState(
      false
    );


  const [
    pendingRequests,
    setPendingRequests,
  ] =
    useState(
      []
    );


  const [
    connected,
    setConnected,
  ] =
    useState(
      socket.connected
    );


  const [
    toast,
    setToast,
  ] =
    useState(
      null
    );


  // ===================================================
  // TOAST
  // ===================================================

  const showToast =
    useCallback(
      (
        title,
        message
      ) => {

        setToast({
          title,
          message,
        });


        window.setTimeout(
          () => {
            setToast(
              null
            );
          },
          4000
        );
      },
      []
    );


  // ===================================================
  // LOAD STAFF
  // ===================================================

  const loadStaff =
    useCallback(
      async () => {

        try {

          const response =
            await api.get(
              "/auth/me"
            );


          setStaff(
            response.data.staff
          );

        } catch {

          navigate(
            "/staff/login",
            {
              replace:
                true,
            }
          );
        }
      },
      [
        navigate,
      ]
    );


  // ===================================================
  // LOAD PENDING REQUESTS
  // ===================================================

  const loadPendingRequests =
    useCallback(
      async () => {

        try {

          const response =
            await api.get(
              "/staff/requests"
            );


          const requests =
            response.data
              .requests ||
              [];


          setPendingRequests(
            requests.filter(
              (
                request
              ) =>
                request.status ===
                "pending"
            )
          );

        } catch (error) {

          console.error(
            "Pending requests error:",
            error
          );
        }
      },
      []
    );


  // ===================================================
  // INITIAL + REAL TIME
  // ===================================================

  useEffect(
    () => {

      loadStaff();
      loadPendingRequests();


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


      const handleCreated =
        () => {

          loadPendingRequests();


          showToast(
            "New Reservation",
            "A new reservation request was received."
          );
        };


      const handleUpdated =
        () => {
          loadPendingRequests();
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
        handleCreated
      );


      socket.on(
        "reservation_updated",
        handleUpdated
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
      loadStaff,
      loadPendingRequests,
      showToast,
    ]
  );


  // ===================================================
  // LOGOUT
  // ===================================================

  const logout =
    async () => {

      try {

        await api.post(
          "/auth/logout"
        );

      } finally {

        navigate(
          "/staff/login",
          {
            replace:
              true,
          }
        );
      }
    };


  // ===================================================
  // NAVIGATION
  // ===================================================

  const navigation = [
    {
      name:
        "Dashboard",

      path:
        "/staff/dashboard",
    },

    {
      name:
        "Reservation Requests",

      path:
        "/staff/requests",

      badge:
        pendingRequests.length,
    },

    {
      name:
        "Borrowed Items",

      path:
        "/staff/borrowed",
    },

    {
      name:
        "Equipment",

      path:
        "/staff/items",
    },

    {
      name:
        "Records",

      path:
        "/staff/records",
    },

    {
      name:
        "Settings",

      path:
        "/staff/settings",
    },
  ];


  const navigationClass =
    ({
      isActive,
    }) =>
      `
        flex
        items-center
        justify-between
        rounded-xl
        px-4
        py-3
        text-sm
        font-semibold
        transition-all
        duration-200

        ${
          isActive
            ? "bg-blue-600 text-white shadow-md shadow-blue-200"
            : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
        }
      `;


  // ===================================================
  // SIDEBAR
  // ===================================================

  const Sidebar =
    ({
      mobile = false,
    }) => (
      <>

        {/* BRANDING */}

        <div className="mb-7 flex items-start justify-between">

          <div>

            <div className="
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              bg-blue-600
              font-black
              text-white
              shadow-md
              shadow-blue-200
            ">
              RR
            </div>


            <p className="
              mt-4
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.18em]
              text-blue-600
            ">
              CMOB Department
            </p>


            <h1 className="
              mt-1
              text-lg
              font-black
              tracking-tight
              text-slate-900
            ">
              REPAIR ROOM
            </h1>


            <p className="mt-1 text-xs text-slate-500">
              Staff Administration
            </p>

          </div>


          {mobile && (
            <button
              type="button"
              onClick={
                () =>
                  setMobileMenuOpen(
                    false
                  )
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                text-2xl
                text-slate-400
                transition
                hover:bg-slate-100
                hover:text-slate-700
              "
            >
              ×
            </button>
          )}

        </div>


        {/* CONNECTION */}

        <div className="
          mb-6
          flex
          items-center
          gap-2
          rounded-xl
          bg-slate-50
          px-3
          py-2.5
        ">

          <span
            className={`h-2 w-2 rounded-full ${
              connected
                ? "animate-pulse bg-emerald-500"
                : "bg-rose-500"
            }`}
          />


          <span className="text-xs font-semibold text-slate-500">

            {
              connected
                ? "Real-time connected"
                : "Reconnecting..."
            }

          </span>

        </div>


        {/* NAVIGATION */}

        <nav className="space-y-2">

          {navigation.map(
            (
              item
            ) => (
              <NavLink
                key={
                  item.path
                }
                to={
                  item.path
                }
                onClick={
                  () =>
                    setMobileMenuOpen(
                      false
                    )
                }
                className={
                  navigationClass
                }
              >

                <span>
                  {
                    item.name
                  }
                </span>


                {Boolean(
                  item.badge
                ) && (
                  <span className="
                    flex
                    min-w-6
                    items-center
                    justify-center
                    rounded-full
                    bg-amber-400
                    px-2
                    py-0.5
                    text-[10px]
                    font-black
                    text-slate-900
                  ">
                    {
                      item.badge
                    }
                  </span>
                )}

              </NavLink>
            )
          )}

        </nav>


        {/* ACCOUNT */}

        <div className="mt-auto border-t border-slate-200 pt-5">

          <div className="
            mb-4
            rounded-xl
            bg-slate-50
            p-4
          ">

            <p className="truncate text-sm font-extrabold text-slate-900">
              {
                staff?.full_name ||
                "Staff"
              }
            </p>


            <p className="mt-1 text-xs text-slate-500">
              Account #
              {
                staff?.id
                  ? String(
                      staff.id
                    ).padStart(
                      4,
                      "0"
                    )
                  : "----"
              }
            </p>

          </div>


          <button
            type="button"
            onClick={
              logout
            }
            className="
              w-full
              rounded-xl
              border
              border-red-200
              px-4
              py-3
              text-sm
              font-bold
              text-red-600
              transition
              hover:bg-red-50
            "
          >
            Log Out
          </button>

        </div>

      </>
    );


  // ===================================================
  // NOTIFICATION BUTTON
  // ===================================================

  const NotificationButton =
    () => (
      <div className="relative">

        <button
          type="button"
          onClick={
            () =>
              setNotificationsOpen(
                (
                  previous
                ) =>
                  !previous
              )
          }
          className="
            relative
            flex
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-white
            shadow-sm
            transition
            hover:border-blue-200
            hover:shadow-md
          "
        >
          🔔


          {pendingRequests.length >
            0 && (
            <span className="
              absolute
              -right-1
              -top-1
              flex
              h-5
              min-w-5
              items-center
              justify-center
              rounded-full
              bg-rose-500
              px-1
              text-[10px]
              font-black
              text-white
            ">
              {
                pendingRequests.length
              }
            </span>
          )}

        </button>


        {notificationsOpen && (
          <div className="
            animate-pop-in
            absolute
            right-0
            top-14
            z-[200]
            w-[min(22rem,calc(100vw-2rem))]
            overflow-hidden
            rounded-2xl
            border
            border-blue-100
            bg-white
            shadow-2xl
          ">

            <div className="border-b border-blue-100 px-5 py-4">

              <p className="font-black text-slate-900">
                Notifications
              </p>


              <p className="mt-1 text-xs text-slate-500">
                {
                  pendingRequests.length
                }
                {" "}
                pending request
                {
                  pendingRequests.length ===
                  1
                    ? ""
                    : "s"
                }
              </p>

            </div>


            <div className="max-h-72 overflow-y-auto">

              {pendingRequests.length ===
                0 ? (

                <div className="px-5 py-8 text-center text-sm text-slate-500">
                  No pending requests.
                </div>

              ) : (

                pendingRequests
                  .slice(
                    0,
                    6
                  )
                  .map(
                    (
                      request
                    ) => (
                      <button
                        key={
                          request.id
                        }
                        type="button"
                        onClick={
                          () => {
                            setNotificationsOpen(
                              false
                            );

                            navigate(
                              "/staff/requests"
                            );
                          }
                        }
                        className="
                          block
                          w-full
                          border-b
                          border-slate-100
                          px-5
                          py-4
                          text-left
                          hover:bg-blue-50
                        "
                      >

                        <p className="font-bold text-slate-800">
                          {
                            request.requester_name
                          }
                        </p>


                        <p className="mt-1 font-mono text-xs font-bold text-blue-600">
                          {
                            request.reference_code
                          }
                        </p>

                      </button>
                    )
                  )
              )}

            </div>

          </div>
        )}

      </div>
    );


  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div className="min-h-screen bg-[#f3f8ff]">

      <div className="flex min-h-screen">

        {/* DESKTOP SIDEBAR */}

        <aside className="
          no-print
          sticky
          top-0
          hidden
          h-screen
          w-64
          flex-shrink-0
          flex-col
          border-r
          border-blue-100
          bg-white
          p-4
          shadow-sm
          lg:flex
        ">

          <Sidebar />

        </aside>


        {/* MOBILE BACKDROP */}

        {mobileMenuOpen && (
          <button
            type="button"
            onClick={
              () =>
                setMobileMenuOpen(
                  false
                )
            }
            className="
              fixed
              inset-0
              z-[300]
              bg-slate-950/40
              backdrop-blur-sm
              lg:hidden
            "
          />
        )}


        {/* MOBILE SIDEBAR */}

        <aside
          className={`
            no-print
            fixed
            inset-y-0
            left-0
            z-[310]
            flex
            w-[min(18rem,86vw)]
            flex-col
            border-r
            border-blue-100
            bg-white
            p-5
            shadow-2xl
            transition-transform
            duration-300
            lg:hidden

            ${
              mobileMenuOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >

          <Sidebar
            mobile
          />

        </aside>


        {/* MAIN CONTENT */}

        <div className="min-w-0 flex-1">

          {/* MOBILE HEADER */}

          <header className="
            no-print
            sticky
            top-0
            z-40
            flex
            items-center
            justify-between
            border-b
            border-blue-100
            bg-white/95
            px-4
            py-3
            backdrop-blur
            lg:hidden
          ">

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={
                  () =>
                    setMobileMenuOpen(
                      true
                    )
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-xl
                  text-slate-700
                "
              >
                ☰
              </button>


              <div>

                <p className="text-sm font-black text-slate-900">
                  REPAIR ROOM
                </p>


                <p className="text-[10px] font-semibold text-blue-600">
                  CMOB Department
                </p>

              </div>

            </div>


            <NotificationButton />

          </header>


          <main className="min-w-0 p-4 sm:p-6 lg:p-8">

            <div className="mx-auto max-w-7xl">

              {/* DESKTOP TOP BAR */}

              <div className="
                no-print
                mb-6
                hidden
                items-center
                justify-between
                rounded-2xl
                border
                border-blue-100
                bg-white
                px-5
                py-3
                shadow-sm
                lg:flex
              ">

                <div>

                  <p className="text-sm font-black text-slate-900">
                    REPAIR ROOM
                  </p>


                  <p className="text-xs text-slate-500">
                    CMOB Department
                  </p>

                </div>


                <div className="flex items-center gap-3">

                  <div className="
                    flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-slate-50
                    px-3
                    py-2
                    text-xs
                    font-semibold
                    text-slate-500
                  ">

                    <span
                      className={`h-2 w-2 rounded-full ${
                        connected
                          ? "animate-pulse bg-emerald-500"
                          : "bg-rose-500"
                      }`}
                    />


                    {
                      connected
                        ? "Live"
                        : "Reconnecting"
                    }

                  </div>


                  <NotificationButton />

                </div>

              </div>


              <Outlet />

            </div>

          </main>

        </div>

      </div>


      {/* LIVE TOAST */}

      {toast && (
        <div className="
          animate-toast-in
          fixed
          bottom-5
          right-5
          z-[10000]
          w-[calc(100vw-2rem)]
          max-w-sm
          rounded-2xl
          border
          border-blue-100
          bg-white
          p-4
          shadow-2xl
        ">

          <p className="font-black text-slate-900">
            {
              toast.title
            }
          </p>


          <p className="mt-1 text-sm text-slate-500">
            {
              toast.message
            }
          </p>

        </div>
      )}

    </div>
  );
}


export default StaffLayout;