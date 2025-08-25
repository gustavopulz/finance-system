import { useForm } from 'react-hook-form';

type FormData = {
  nome: string;
};

export default function AddCollaboratorDialog({
  onSave,
  onClose,
}: {
  onSave: (nome: string) => void;
  onClose: () => void;
}) {
  const { register, handleSubmit } = useForm<FormData>();

  const submit = (data: FormData) => {
    console.log('📤 Enviando para API:', data); // <-- debug
    onSave(data.nome.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md p-5">
        <h3 className="text-lg font-semibold mb-3">Novo colaborador</h3>

        <form onSubmit={handleSubmit(submit)} className="grid gap-3">
          <label className="grid gap-1">
            <span className="text-sm font-medium">Nome</span>
            <input
              className="input input-full"
              {...register('nome', { required: true })} // <-- garante "nome"
              placeholder="Ex.: João"
            />
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
