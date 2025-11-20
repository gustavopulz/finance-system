import { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import ModalBase from "../../components/ModalBase";

// Mock para lista de notificações
const initialNotifications = [
  { id: 1, title: "Bem-vindo!", message: "Seja bem-vindo ao Finance Systeme." },
  { id: 2, title: "Atualização", message: "Nova versão disponível em breve." },
];

type Notification = { id: number; title: string; message: string };

type NotificationFormProps = {
  onSave: (data: Omit<Notification, "id">) => void;
  onCancel: () => void;
  initial?: Omit<Notification, "id">;
};

function NotificationForm({
  onSave,
  onCancel,
  initial,
}: NotificationFormProps) {
  const [title, setTitle] = useState(initial?.title || "");
  const [message, setMessage] = useState(initial?.message || "");

  return (
    <form
      className="grid p-4 bg-white dark:bg-slate-900 rounded-xl shadow gap-6 mx-auto"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ title, message });
      }}
    >
      <label className="grid gap-1">
        <span className="text-sm font-medium">Título</span>
        <input
          className="input input-full bg-slate-900 text-white border border-slate-300 dark:bg-slate-900 dark:text-white dark:border-slate-700"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <label className="grid gap-1">
        <span className="text-sm font-medium">Mensagem</span>
        <textarea
          className="input input-full bg-slate-900 text-white border border-slate-300 dark:bg-slate-900 dark:text-white dark:border-slate-700 min-h-[80px]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>
      <div className="flex gap-2 justify-end mt-2">
        <button type="button" className="btn" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          Salvar
        </button>
      </div>
    </form>
  );
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [editing, setEditing] = useState<Notification | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function handleSave(data: Omit<Notification, "id">) {
    if (editing) {
      setNotifications((nots) =>
        nots.map((n) => (n.id === editing.id ? { ...n, ...data } : n))
      );
    } else {
      setNotifications((nots) => [...nots, { id: Date.now(), ...data }]);
    }
    setShowForm(false);
    setEditing(null);
  }

  function handleDelete(id: number) {
    setNotifications((nots) => nots.filter((n) => n.id !== id));
    setShowDeleteModal(false);
    setDeleteId(null);
  }

  return (
    <div className="flex min-h-screen px-4 sm:px-6 lg:px-20 gap-6 mx-auto">
      <AdminSidebar sidebarOpen={sidebarOpen} />
      <div className="hidden md:block sticky top-6 h-screen mx-2">
        <div className="relative h-full">
          <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-px bg-slate-300 dark:bg-slate-700" />
          <button
            aria-label={sidebarOpen ? "Fechar sidebar" : "Abrir sidebar"}
            onClick={() => setSidebarOpen((s) => !s)}
            className="absolute z-10 p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition left-1/2 top-3 -translate-x-1/2"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-700 dark:text-slate-200"
            >
              {sidebarOpen ? (
                <polyline points="15 18 9 12 15 6"></polyline>
              ) : (
                <polyline points="9 18 15 12 9 6"></polyline>
              )}
            </svg>
          </button>
        </div>
      </div>
      <main className="flex-1 py-8 px-8 max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Notificações Customizadas</h2>
        <button
          className="btn btn-primary mb-4"
          onClick={() => {
            setShowForm(true);
            setEditing(null);
          }}
        >
          Nova Notificação
        </button>

        <div className="grid gap-4 mt-4">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="bg-white dark:bg-slate-900 rounded-xl shadow flex flex-col gap-2 p-6 border border-slate-200 dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-lg">{n.title}</span>
                <div className="flex gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      setEditing(n);
                      setShowForm(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      setDeleteId(n.id);
                      setShowDeleteModal(true);
                    }}
                  >
                    Deletar
                  </button>
                </div>
              </div>
              <div className="text-slate-700 dark:text-slate-200 whitespace-pre-line">
                {n.message}
              </div>
            </div>
          ))}
        </div>

        {/* Modal para adicionar/editar */}
        <ModalBase
          open={showForm}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          maxWidth="md"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-3">
              {editing ? "Editar notificação" : "Nova notificação"}
            </h3>
            <NotificationForm
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
              initial={
                editing
                  ? { title: editing.title, message: editing.message }
                  : undefined
              }
            />
          </div>
        </ModalBase>

        {/* Modal para deletar */}
        <ModalBase
          open={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteId(null);
          }}
          maxWidth="sm"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-3">Confirmar exclusão</h3>
            <p className="mb-4">Deseja realmente excluir esta notificação?</p>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
              >
                Cancelar
              </button>
              <button
                className="btn btn-danger"
                onClick={() => deleteId !== null && handleDelete(deleteId)}
              >
                Excluir
              </button>
            </div>
          </div>
        </ModalBase>
      </main>
    </div>
  );
}
