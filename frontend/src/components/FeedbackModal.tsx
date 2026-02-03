import { useMemo, useState } from "react";
import ModalBase from "./ModalBase";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

type FeedbackKind = "suggestion" | "bug";

const DISCORD_WEBHOOK_URL =
  import.meta.env.VITE_DISCORD_WEBHOOK_URL ||
  "https://discord.com/api/webhooks/1468337135735279741/rZEVljsBPrvDJqDnY1plwoZBliH-ju-bgpTbRYeiFWnQoNwRRnCbxdmCyDJAeHBHV-wh";

function clampText(value: string, max: number) {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1) + "…";
}

function toPtBrLabel(kind: FeedbackKind) {
  return kind === "suggestion" ? "Sugestão / Ideia" : "Problema / Bug";
}

export default function FeedbackModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const auth = useAuth();
  const { notify } = useNotification();

  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [category, setCategory] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const categories = useMemo(() => {
    const suggestionCategories = [
      { value: "feature", label: "Nova funcionalidade" },
      { value: "ui", label: "Melhoria de interface (UI/UX)" },
      { value: "automation", label: "Automação / Atalho" },
      { value: "performance", label: "Performance" },
      { value: "other", label: "Outro" },
    ];

    const bugCategories = [
      { value: "login", label: "Login / Autenticação" },
      { value: "dashboard", label: "Dashboard" },
      { value: "home", label: "Página inicial / Resumo" },
      { value: "finance", label: "Financeiro / Lançamentos" },
      { value: "settings", label: "Configurações" },
      { value: "performance", label: "Lentidão / Performance" },
      { value: "other", label: "Outro" },
    ];

    return kind === "suggestion" ? suggestionCategories : bugCategories;
  }, [kind]);

  const canSubmit =
    !submitting &&
    kind &&
    category.trim().length > 0 &&
    title.trim().length >= 3 &&
    description.trim().length >= 10;

  function resetForm() {
    setKind("bug");
    setCategory("");
    setTitle("");
    setDescription("");
    setSubmitting(false);
  }

  async function handleSubmit() {
    if (!canSubmit) {
      notify(
        "Preencha: tipo, categoria, título (min. 3) e descrição (min. 10).",
        "info",
      );
      return;
    }

    const user = auth?.user;
    const now = new Date();

    const safeTitle = clampText(title, 256);
    const safeDescription = clampText(description, 3500);

    const categoryLabel =
      categories.find((c) => c.value === category)?.label || category;

    const embed = {
      title:
        kind === "suggestion" ? "Nova Sugestão Recebida" : "Novo Bug Reportado",
      color: kind === "suggestion" ? 0x3b82f6 : 0xef4444,
      fields: [
        { name: "Tipo", value: toPtBrLabel(kind), inline: true },
        { name: "Categoria", value: categoryLabel, inline: true },
        { name: "Título", value: safeTitle, inline: false },
        { name: "Descrição", value: safeDescription, inline: false },
        {
          name: "Usuário",
          value: user
            ? `${user.name} (${user.email})\nID: ${user.id} | Role: ${user.role}`
            : "Não autenticado",
          inline: false,
        },
        {
          name: "Data",
          value: now.toLocaleString("pt-BR"),
          inline: true,
        },
      ],
      timestamp: now.toISOString(),
      footer: { text: "Finance System • Feedback" },
    };

    try {
      setSubmitting(true);
      const res = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Webhook falhou: ${res.status} ${text}`);
      }

      notify("Feedback enviado. Obrigado!", "success");
      onClose();
      resetForm();
    } catch (e) {
      console.error(e);
      notify(
        "Não foi possível enviar agora. Tente novamente em instantes.",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalBase
      open={open}
      onClose={onClose}
      maxWidth="lg"
      labelledBy="fb-title"
    >
      <h3 id="fb-title" className="text-lg font-semibold mb-3">
        Enviar feedback
      </h3>

      <hr className="py-2 border-[#334155]"></hr>

      <p className="text-sm text-slate-600 dark:text-slate-300">
        Conte sua ideia ou reporte um problema. Quanto mais detalhes, melhor.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block mb-1 font-medium text-slate-700 dark:text-slate-200">
              Tipo
            </span>
            <select
              className="select select-full"
              value={kind}
              onChange={(e) => {
                const next = e.target.value as FeedbackKind;
                setKind(next);
                setCategory("");
              }}
            >
              <option value="suggestion">Sugestão / Ideia</option>
              <option value="bug">Problema / Bug</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="block mb-1 font-medium text-slate-700 dark:text-slate-200">
              Categoria
            </span>
            <select
              className="select select-full"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Selecione…</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="text-sm">
          <span className="block mb-1 font-medium text-slate-700 dark:text-slate-200">
            Título
          </span>
          <input
            className="input input-full"
            placeholder={
              kind === "suggestion"
                ? "Ex: Atalho para duplicar lançamentos"
                : "Ex: Erro ao salvar uma despesa"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={256}
          />
        </label>

        <label className="text-sm">
          <span className="block mb-1 font-medium text-slate-700 dark:text-slate-200">
            Descrição
          </span>
          <textarea
            className="input input-full min-h-[130px]"
            placeholder={
              kind === "suggestion"
                ? "Descreva como seria o ideal e por quê."
                : "O que aconteceu, o que você esperava, e como reproduzir (passo a passo)."
            }
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={3500}
          />
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Dica: se for bug, inclua passos para reproduzir.</span>
            <span>{description.length}/3500</span>
          </div>
        </label>

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="border border-slate-300 dark:border-slate-700 flex items-center gap-2 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-md transition"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className={`btn btn-primary ${!canSubmit ? "opacity-60 cursor-not-allowed" : ""}`}
            disabled={!canSubmit}
          >
            {submitting ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </ModalBase>
  );
}
