import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNotification } from "../../context/NotificationContext";
import { listUsers, deleteUser, changeUserRole } from "../../lib/api";
import UserTable from "../../components/Admin/UserTable";
import type { User } from "../../components/Admin/UserTable";
import DeleteUserModal from "../../components/Admin/DeleteUserModal";
import AdminSidebar from "../../components/Admin/AdminSidebar";

export default function AdminPage() {
  const { notify } = useNotification();
  const auth = useAuth();
  if (auth?.loading)
    return (
      <div className="w-full flex items-center justify-center py-20">
        <span className="text-gray-500 dark:text-gray-400 text-lg">
          Carregando...
        </span>
      </div>
    );
  if (!auth?.user) return <Navigate to="/login" replace />;
  if (auth.user.role !== "admin") return <Navigate to="/" replace />;
  async function handleToggleAdmin(user: User) {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      await changeUserRole(user.id, newRole);
      await refresh();
    } catch (err: any) {
      notify("Erro ao atualizar papel do usuário", "error");
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  // Removido setShowModal pois não é utilizado
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<"name" | "role" | "email" | null>(
    null
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listUsers();
      // Ordena por cargo (role) antes de setar os usuários
      const sorted = data
        .map(
          (u: { id: number; name: string; role: string; email?: string }) => ({
            ...u,
            email: u.email ?? "",
          })
        )
        .sort((a: User, b: User) => a.role.localeCompare(b.role));
      setUsers(sorted);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    if (userToDelete === null) return;
    try {
      await deleteUser(userToDelete);
      setShowDeleteModal(false);
      setUserToDelete(null);
      await refresh();
    } catch (err: any) {
      notify(err.message || "Erro ao excluir usuário", "error");
    }
  }

  function handleSort(key: "name" | "role" | "email") {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  }

  function handleDeleteUser(userId: number) {
    setUserToDelete(userId);
    setShowDeleteModal(true);
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
      <main className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Administração de Usuários</h1>
        </div>
        <UserTable
          users={users}
          loading={loading}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={handleSort}
          onToggleAdmin={handleToggleAdmin}
          onDeleteUser={handleDeleteUser}
        />
        <DeleteUserModal
          open={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleConfirmDelete}
        />
      </main>
    </div>
  );
}
