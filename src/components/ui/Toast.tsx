"use client";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => close.current(), 4000);
    return () => clearTimeout(timer);
  }, [message]);
  const root =
    typeof document !== "undefined"
      ? document.getElementById("toast-root")
      : null;
  if (!message || !root) return null;
  return createPortal(
    <div className="notice" role="status">
      {message}
      <button type="button" aria-label="Tutup notifikasi" onClick={onClose}>
        &times;
      </button>
    </div>,
    root,
  );
}
