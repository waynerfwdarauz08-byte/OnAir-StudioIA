import useTranslation from "../../hooks/useTranslation.js";
import {
  useEffect,
  useRef,
} from "react";
import useAccessibility from "../../hooks/useAccessibility.js";

function ConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { translate } = useTranslation();
  const { language } = useAccessibility();
  const isEnglish = language === "en";
  const displayConfirmText = confirmText || (isEnglish ? "Confirm" : "Confirmar");
  const displayCancelText = cancelText || (isEnglish ? "Cancel" : "Cancelar");
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    confirmButtonRef.current?.focus();

    function closeWithEscape(event) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener(
      "keydown",
      closeWithEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        closeWithEscape
      );
    };
  }, [open, loading, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <span className="dialog-label">
          {isEnglish ? "CONFIRMATION REQUIRED" : "CONFIRMACIÓN REQUERIDA"}
        </span>

        <h2 id="confirm-dialog-title">{translate(title)}</h2>

        <p id="confirm-dialog-message">{translate(message)}</p>

        <div className="dialog-actions">
          <button
            type="button"
            className="button button-secondary"
            disabled={loading}
            onClick={onCancel}
          >
            {translate(displayCancelText)}
          </button>

          <button
            ref={confirmButtonRef}
            type="button"
            className={
              danger
                ? "button button-danger"
                : "button button-primary"
            }
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (isEnglish ? "Processing..." : "Procesando...") : translate(displayConfirmText)}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
