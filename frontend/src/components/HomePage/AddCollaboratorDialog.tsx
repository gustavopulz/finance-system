import { useForm } from "react-hook-form";
import ModalBase from "../ModalBase";

type FormData = {
  nome: string;
};
export default function AddCollaboratorDialog({
  onSave,
  onClose,
  open = true,
}: {
  onSave: (nome: string) => void;
  onClose: () => void;
  open?: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const submit = (data: FormData) => {
    if (data.nome.length > 30) return;
    onSave(data.nome.trim());
  };

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      maxWidth="md"
      labelledBy="titulo-add-colab"
    >
      <h3 id="titulo-add-colab" className="text-lg font-semibold mb-3">
        Novo Colaborador
      </h3>

      <hr className="py-2 border-[#334155]"></hr>

      <form onSubmit={handleSubmit(submit)} className="grid gap-3">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Nome</span>
          <input
            className="input input-full"
            {...register("nome", { required: true, maxLength: 25 })}
            maxLength={25}
            placeholder="Ex.: João"
          />
          {errors.nome?.type === "maxLength" && (
            <span className="text-xs text-red-600">
              Máximo de 30 caracteres.
            </span>
          )}
        </label>
        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-md transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            Salvar
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
