import { useEffect, useState } from "react";
import styles from "./ToastViewport.module.css";

type Toast = { id: number; type: "success" | "error"; message: string };

export default function ToastViewport() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string; message?: string }>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      const toast: Toast = { id, type: detail.type === "error" ? "error" : "success", message: detail.message };
      setToasts((current) => [...current, toast]);
      window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== id)), 5000);
    };
    window.addEventListener("resource-tracker:toast", onToast);
    return () => window.removeEventListener("resource-tracker:toast", onToast);
  }, []);
  return <div className={styles.viewport} aria-live="polite" aria-atomic="false">{toasts.map((toast) => <div key={toast.id} className={`${styles.toast} ${toast.type === "error" ? styles.error : styles.success}`} role={toast.type === "error" ? "alert" : "status"}><span>{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>×</button></div>)}</div>;
}
