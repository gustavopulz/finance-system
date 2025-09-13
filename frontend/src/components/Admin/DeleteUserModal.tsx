interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteUserModal({
  open,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-lg max-w-sm w-full">
        <h2 className="text-xl font-bold mb-4">Confirmar Exclusão</h2>
        <p>Tem certeza que deseja excluir este usuário?</p>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-700 text-white px-4 py-2 rounded-md transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition"
          >
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
