// =====================================================
// REPAIR ROOM SHARED MODAL
// CMOB Department
// =====================================================
//
// Used by Staff modals.
//
// Important:
//
// createPortal() places the modal under document.body,
// therefore the ENTIRE application is behind the blur.
//
// It also follows Light / Dark theme.
//
// =====================================================

import {
  useEffect,
} from "react";

import {
  createPortal,
} from "react-dom";


function ModalPortal({
  open,
  onClose,
  children,
  maxWidth = "max-w-2xl",
  locked = false,
}) {

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }


      const previousOverflow =
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
            !locked
          ) {
            onClose?.();
          }
        };


      window.addEventListener(
        "keydown",
        handleKeyDown
      );


      return () => {
        document.body.style
          .overflow =
          previousOverflow;


        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
      };
    },
    [
      open,
      locked,
      onClose,
    ]
  );


  if (
    !open ||
    typeof document ===
      "undefined"
  ) {
    return null;
  }


  return createPortal(

    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-slate-950/70
        p-4
        backdrop-blur-md
        sm:p-6
      "
      onMouseDown={
        (
          event
        ) => {
          if (
            event.target ===
              event.currentTarget &&
            !locked
          ) {
            onClose?.();
          }
        }
      }
    >

      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={
          (
            event
          ) =>
            event.stopPropagation()
        }
        className={`
          rr-modal-surface
          animate-pop-in
          relative
          my-auto
          w-full
          ${maxWidth}
          overflow-hidden
          rounded-3xl
          border
          shadow-2xl
          shadow-slate-950/50
        `}
      >

        {
          children
        }

      </div>

    </div>,

    document.body
  );
}


export default ModalPortal;