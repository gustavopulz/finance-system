import React from "react";
import { novidadesCards } from "./data/novidades.data";
import { Monitor, Wrench, Smartphone } from "lucide-react";

interface NovidadeCardProps {
  date: string;
  title: string;
  highlights: string[];
  adjustments: string[];
  mobile: string[];
}

function highlightKeywords(text: string) {
  const regex = /(\*[^*]+\*|_[^_]+_)/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (/^\*[^*]+\*$/.test(part)) {
      return (
        <b key={i} className="font-semibold">
          {part.slice(1, -1)}
        </b>
      );
    }
    if (/^_[^_]+_$/.test(part)) {
      return (
        <span key={i} className="text-slate-400 dark:text-slate-400">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

function SubCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-md bg-slate-100 dark:bg-slate-800/60 p-4 mb-3">
      <span className="font-semibold text-base flex items-center gap-2 mb-2">
        {icon} {title}
      </span>
      <ul className="list-disc pl-5 space-y-1 mt-1 text-slate-800 dark:text-slate-200">
        {items.map((item, i) => (
          <li key={i}>{highlightKeywords(item)}</li>
        ))}
      </ul>
    </div>
  );
}

function NovidadeCard({
  date,
  title,
  highlights,
  adjustments,
  mobile,
}: NovidadeCardProps) {
  return (
    <section className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
      <div className="flex items-center mb-2">
        <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full mr-3">
          Lançamento
        </span>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {date}
        </span>
      </div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <SubCard
        icon={<Monitor size={18} className="inline-block text-blue-500" />}
        title="Desktop"
        items={highlights}
      />
      <SubCard
        icon={<Wrench size={18} className="inline-block text-blue-500" />}
        title="Ajustes & Correções"
        items={adjustments}
      />
      <SubCard
        icon={<Smartphone size={18} className="inline-block text-blue-500" />}
        title="Mobile"
        items={mobile}
      />
    </section>
  );
}

export default function NovidadesPage() {
  return (
    <div className="container-app mx-auto px-4 sm:px-6 lg:px-20 grid gap-6">
      <h1 className="text-2xl font-bold mb-2">Novidades</h1>
      {novidadesCards.map((card, idx) => (
        <NovidadeCard key={card.date + idx} {...card} />
      ))}
    </div>
  );
}
