import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseBRL, MONTHS_PT } from "../../lib/format";
import type { Collaborator, Status, Account } from "../../lib/types";

type Props = {
  initial?: Account;
  collaborators: Collaborator[];
  filteredMonth?: number;
  filteredYear?: number;
  initialCollaboratorId?: string;
  mode?: "addAccount" | "editAccount" | "duplicate";
  onSave: (
    data: {
      collaboratorId: string;
      description: string;
      value: number;
      parcelasTotal: number | null;
      month: number;
      year: number;
      status: Status;
    },
    idToUpdate?: string
  ) => void;
  onClose: () => void;
};

const schema = z.object({
  collaboratorId: z.string().min(1, "Selecione um colaborador"),
  description: z.string().min(1, "Informe uma descrição"),
  value: z.string().min(1, "Informe um valor"),
  parcelasTotal: z.preprocess((val) => {
    if (val === "X") return "X";
    if (val === "-") return "-";
    return Number(val);
  }, z.union([z.literal("X"), z.literal("-"), z.number().min(1).max(48)])),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  status: z.enum(["Pendente", "Cancelado", "quitado"]),
});

type FormData = z.input<typeof schema>;

export default function AddFinanceDialog({
  collaborators,
  initial,
  filteredMonth,
  filteredYear,
  initialCollaboratorId,
  mode,
  onSave,
  onClose,
}: Props) {
  const now = new Date();
  const defaultMonth = filteredMonth ?? now.getMonth() + 1;
  const defaultYear = filteredYear ?? now.getFullYear();

  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      collaboratorId: initial?.collaboratorId
        ? String(initial.collaboratorId)
        : initialCollaboratorId
        ? String(initialCollaboratorId)
        : collaborators.length === 1
        ? String(collaborators[0].id)
        : "",
      description: initial?.description || "",
      value:
        initial?.value != null ? String(initial.value).replace(".", ",") : "",
      parcelasTotal: initial
        ? initial.parcelasTotal === null || initial.parcelasTotal === undefined
          ? "X"
          : initial.parcelasTotal === 0
          ? "-"
          : initial.parcelasTotal
        : "-",
      month: initial?.month ?? defaultMonth,
      year: initial?.year ?? defaultYear,
      status:
        initial?.status === "Pendente" ||
        initial?.status === "Cancelado" ||
        initial?.status === "quitado"
          ? initial.status
          : "Pendente",
    },
  });

  const { ref: descriptionRef, ...descriptionRegister } =
    register("description");
  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, "");
    if (!value) {
      setValue("value", "");
      return;
    }
    if (value.length < 3) {
      value = value.padStart(3, "0");
    }
    const reais = value.slice(0, -2);
    const centavos = value.slice(-2);
    const formatted = `${Number(reais)}${reais ? "" : "0"},${centavos}`;
    setValue("value", formatted);
  }

  useEffect(() => {
    if (!initial) {
      if (initialCollaboratorId) {
        setValue("collaboratorId", String(initialCollaboratorId));
      } else if (collaborators.length === 1) {
        setValue("collaboratorId", String(collaborators[0].id));
      }
    }
  }, [collaborators, initial, initialCollaboratorId, setValue]);

  useEffect(() => {
    if (descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, []);

  const submit: SubmitHandler<FormData> = (d) => {
    const parsedValue = parseBRL(d.value);
    if (isNaN(parsedValue)) {
      alert("Valor inválido. Por favor, informe um valor numérico.");
      return;
    }

    const payload: any = {
      collaboratorId: d.collaboratorId,
      description: String(d.description || "").trim(),
      value: parsedValue,
      month: d.month,
      year: d.year,
      status: d.status as Status,
    };

    if (d.parcelasTotal === "X") {
      payload.parcelasTotal = null;
    } else if (d.parcelasTotal === "-") {
      payload.parcelasTotal = 0;
    } else if (typeof d.parcelasTotal === "number") {
      payload.parcelasTotal = d.parcelasTotal;
    }

    onSave(payload, initial?.id);
    onClose();
  };

  const disabled = collaborators.length === 0;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-lg p-5 rounded-xl shadow-lg bg-white dark:bg-slate-900 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-500 hover:text-red-500 text-xl font-bold rounded-full w-8 h-8 flex items-center justify-center focus:outline-none"
          aria-label="Fechar"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold mb-3">
          {mode === "duplicate"
            ? "Duplicar finança"
            : mode === "editAccount"
            ? "Editar finança"
            : "Adicionar finança"}
        </h3>

        {disabled && (
          <div className="mb-3 text-sm text-red-600">
            Você ainda não tem colaboradores. Crie um colaborador primeiro.
          </div>
        )}

        <form className="grid gap-3" onSubmit={handleSubmit(submit)}>
          <label className="grid gap-1">
            <span className="text-sm font-medium">Colaborador</span>
            <select
              className="select select-full"
              {...register("collaboratorId")}
              disabled={disabled}
            >
              {collaborators.length > 1 && (
                <option value="" disabled>
                  Selecione um Colaborador
                </option>
              )}
              {collaborators.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Descrição</span>
            <input
              {...descriptionRegister}
              ref={(e) => {
                descriptionRef(e);
                descriptionInputRef.current = e;
              }}
              className="input input-full bg-slate-900 text-white border border-slate-300 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              placeholder="Ex.: Uber"
              disabled={disabled}
            />
            {errors.description && (
              <span className="text-xs text-red-600">
                {errors.description.message}
              </span>
            )}
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Valor (R$)</span>
            <input
              className="input input-full bg-slate-900 text-white border border-slate-300 dark:bg-slate-900 dark:text-white dark:border-slate-700"
              {...register("value")}
              placeholder="Ex.: 119,00"
              inputMode="decimal"
              disabled={disabled}
              onChange={handleValueChange}
              maxLength={10}
            />
            {errors.value && (
              <span className="text-xs text-red-600">
                {errors.value.message as string}
              </span>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm font-medium">Parcelas</span>
              <select
                className="select select-full"
                {...register("parcelasTotal")}
                disabled={disabled}
                defaultValue="-"
              >
                <option value="-">Avulsa</option>
                <option value="X">Fixo</option>
                {Array.from({ length: 48 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm font-medium">Início</span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="select"
                  {...register("month", { valueAsNumber: true })}
                  disabled={disabled}
                >
                  {MONTHS_PT.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  className="input bg-slate-900 text-white border border-slate-300 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                  type="number"
                  {...register("year", { valueAsNumber: true })}
                  disabled={disabled}
                />
              </div>
            </label>
          </div>

          <label className="grid gap-1">
            <span className="text-sm font-medium">Status</span>
            <select
              className="select select-full"
              {...register("status")}
              disabled={disabled}
            >
              <option value="Pendente">Pendente</option>
              <option value="Cancelado">Cancelado</option>
              {/* <option value="quitado">Quitado</option> */}
            </select>
          </label>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-md transition"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className="btn btn-primary"
              type="submit"
              disabled={disabled}
            >
              {mode === "duplicate"
                ? "Duplicar"
                : initial
                ? "Salvar alterações"
                : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
