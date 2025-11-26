import { useEffect, useState, useRef } from "react";
import { novidadesCards } from "../pages/data/novidades.data";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY = "lastNovidadeReadd";

export function NovidadesModal() {
  const [open, setOpen] = useState(false);
  const [latest, setLatest] = useState(novidadesCards[0]);
  const navigate = useNavigate();
  const auth = useAuth();
  const prevUser = useRef<any>(null);
  const shownOnThisSession = useRef(false);

  useEffect(() => {
    if (!novidadesCards.length) return;
    const last = novidadesCards[0];
    setLatest(last);
    const lastRead = localStorage.getItem(STORAGE_KEY);

    if (
      auth?.user &&
      prevUser.current === null &&
      lastRead !== last.date &&
      !shownOnThisSession.current
    ) {
      setOpen(true);
      shownOnThisSession.current = true;
    }

    if (
      auth?.user &&
      prevUser.current === null &&
      lastRead !== last.date &&
      !shownOnThisSession.current
    ) {
      setOpen(true);
      shownOnThisSession.current = true;
    }
    prevUser.current = auth?.user ?? null;
  }, [auth?.user]);

  function handleClose() {
    setOpen(false);
  }

  function handleVerMais() {
    localStorage.setItem(STORAGE_KEY, latest.date);
    navigate("/novidades");
    setOpen(false);
  }

  if (!latest) return null;

  return (
    open && (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="w-full max-w-lg p-5 rounded-xl shadow-lg bg-white dark:bg-slate-900 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 text-slate-500 hover:text-red-500 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center focus:outline-none"
            aria-label="Fechar"
          >
            &times;
          </button>
          <h3 className="text-lg font-semibold mb-3">
            {latest.modalTitle || "Novidades!"}
          </h3>
          <div className="mb-3 py-4 text-base text-slate-700 dark:text-slate-200">
            {latest.modalDescription || latest.title}
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-md transition"
            >
              Fechar
            </button>
            <button onClick={handleVerMais} className="btn btn-primary">
              Ver mais
            </button>
          </div>
        </div>
      </div>
    )
  );
}
