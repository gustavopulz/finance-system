import { Crown, X } from 'lucide-react';
import ModalBase from './ModalBase';

interface ProModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProModal({ open, onClose }: ProModalProps) {
  return (
    <ModalBase open={open} onClose={onClose} labelledBy="titulo-pro-modal" maxWidth="xl">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition" aria-label="Fechar">
        <X size={20} />
      </button>
      <div className="relative p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg ring-1 ring-amber-300/40">
            <Crown className="text-white" size={30} />
          </div>
          <div className="space-y-1">
            <h2 id="titulo-pro-modal" className="text-2xl font-semibold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">Plano Pro</h2>
            <p className="text-xs font-semibold tracking-wider text-amber-300/70 uppercase">Em desenvolvimento</p>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Recursos avançados para quem precisa ir além do básico: mais visão, automação e controle sobre finanças compartilhadas.
            </p>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4 mb-6 text-sm">
          <ul className="space-y-2 text-amber-200/90">
            <li className="flex gap-2"><span className="text-amber-400">•</span> Relatórios exportáveis (PDF / Excel)</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Alertas inteligentes & lembretes</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Dashboards por colaborador</li>
          </ul>
          <ul className="space-y-2 text-amber-200/90">
            <li className="flex gap-2"><span className="text-amber-400">•</span> Tags & categorização avançada</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Histórico detalhado de alterações</li>
            <li className="flex gap-2"><span className="text-amber-400">•</span> Prioridade em suporte e novidades</li>
          </ul>
        </div>
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs md:text-[13px] text-amber-200 mb-6 shadow-inner">
          <span className="font-semibold">Interesse em acesso antecipado?</span> Em breve abriremos inscrição para early testers — fique atento ao cabeçalho.
        </div>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-5 py-2 rounded-md bg-slate-700/70 hover:bg-slate-600/70 text-slate-200 text-sm font-medium transition">Fechar</button>
        </div>
      </div>
    </ModalBase>
  );
}
