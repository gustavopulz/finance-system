import { useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { parseBRL, MONTHS_PT } from "../../lib/format";
import type { Collaborator, Status, Account } from "../../lib/types";
import ModalBase from "../ModalBase";

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
    idToUpdate?: string,
  ) => void;
  onClose: () => void;
};

const schema = z.object({
  collaboratorId: z.string().min(1, "Selecione um colaborador"),
  description: z.string().min(1, "Informe uma descrição"),
  value: z.string().min(1, "Informe um valor"),
  parcelasTotal: z.union([
    z.literal("X"),
    z.literal("-"),
    z.string().regex(/^\d+$/, "Parcelas inválidas"),
  ]),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  status: z.enum(["Pendente", "Cancelado", "quitado"]),
});

type FormData = z.infer<typeof schema>;

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
  const disabled = !Array.isArray(collaborators) || collaborators.length === 0;

  const descriptionInputRef = useRef<HTMLInputElement | null>(null);

  const toFormStatus = (status: Status | undefined): FormData["status"] => {
    if (status === "Cancelado") return "Cancelado";
    if (status === "quitado" || status === "Pago") return "quitado";
    return "Pendente";
  };

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      collaboratorId:
        initialCollaboratorId ||
        initial?.collaboratorId ||
        (collaborators[0]?.id ? String(collaborators[0].id) : ""),
      description: initial?.description || "",
      value:
        initial?.value !== undefined && initial?.value !== null
          ? String(initial.value.toFixed(2)).replace(".", ",")
          : "0,00",
      parcelasTotal: !initial
        ? "-"
        : initial.parcelasTotal === null || initial.parcelasTotal === undefined
          ? "X"
          : initial.parcelasTotal === 0 || initial.parcelasTotal === 1
            ? "-"
            : String(initial.parcelasTotal),
      month: initial?.month || defaultMonth,
      year: initial?.year || defaultYear,
      status: toFormStatus(initial?.status),
    },
  });

  useEffect(() => {
    if (descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, []);

  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const digits = String(e.target.value).replace(/\D/g, "").slice(0, 12);
    const cents = digits.length ? Number.parseInt(digits, 10) : 0;
    const formatted = (cents / 100).toFixed(2).replace(".", ",");
    setValue("value", formatted, { shouldDirty: true, shouldValidate: true });
  };

  const submit: SubmitHandler<FormData> = (data) => {
    let valueNumber = parseBRL(data.value);
    if (isNaN(valueNumber)) valueNumber = 0;
    let parcelasTotal: number | null = null;
    if (data.parcelasTotal === "X") {
      parcelasTotal = null;
    } else if (data.parcelasTotal === "-") {
      parcelasTotal = 0;
    } else {
      const parsedParcelas = Number(data.parcelasTotal);
      parcelasTotal = Number.isFinite(parsedParcelas) ? parsedParcelas : 0;
    }
    onSave(
      {
        collaboratorId: data.collaboratorId,
        description: data.description,
        value: valueNumber,
        parcelasTotal,
        month: data.month,
        year: data.year,
        status: data.status,
      },
      initial?.id,
    );
    reset();
    onClose();
  };

  const descriptionRegister = register("description");
  const descriptionRef = descriptionRegister.ref;

  return (
    <ModalBase
      open={true}
      onClose={onClose}
      maxWidth="lg"
      labelledBy="titulo-add-financa"
    >
      <h3 id="titulo-add-financa" className="text-lg font-semibold mb-3">
        {mode === "duplicate"
          ? "Duplicar Finança"
          : mode === "editAccount"
            ? "Editar Finança"
            : "Adicionar Finança"}
      </h3>

      <hr className="py-2 border-[#334155]"></hr>

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
            {Array.isArray(collaborators) && collaborators.length > 1 && (
              <option value="" disabled>
                Selecione um Colaborador
              </option>
            )}
            {Array.isArray(collaborators) &&
              collaborators.map((c) => (
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
              <option value="-" selected>
                Avulsa
              </option>
              <option value="X">Fixo</option>
              {Array.from({ length: 48 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={String(n)}>
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
            <option value="quitado">Quitado</option>
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
          <button className="btn btn-primary" type="submit" disabled={disabled}>
            {mode === "duplicate"
              ? "Duplicar"
              : initial
                ? "Salvar alterações"
                : "Salvar"}
          </button>
        </div>
      </form>
    </ModalBase>
  );
}
