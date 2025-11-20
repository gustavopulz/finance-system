import { Shield, Cookie, HelpCircle } from "lucide-react";

export default function PoliticasPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-20 ">
      <h1 className="py-6 text-3xl font-bold text-brand-400">
        Políticas de Privacidade & Uso de Cookies
      </h1>
      <section className="py-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-brand-500/20 text-brand-400">
            <Shield size={20} />
          </span>
          Privacidade
        </h2>
        <p className="mb-1 leading-tight">
          Sua privacidade é importante para nós. Todas as informações fornecidas
          são protegidas e utilizadas apenas para fins de funcionamento do
          sistema. Não compartilhamos seus dados com terceiros sem sua
          autorização.
        </p>
        <p className="leading-tight">
          Você pode solicitar a exclusão de sua conta e dados a qualquer momento
          entrando em contato com o suporte.
        </p>
      </section>
      <section className="py-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-brand-500/20 text-brand-400">
            <Cookie size={20} />
          </span>
          Cookies
        </h2>
        <p className="mb-1 leading-tight">
          Utilizamos cookies para melhorar sua experiência, manter sua sessão
          ativa e coletar informações estatísticas de uso. Os cookies não
          armazenam dados sensíveis ou pessoais.
        </p>
        <p className="leading-tight">
          Ao utilizar o sistema, você concorda com o uso de cookies conforme
          descrito nesta política.
        </p>
      </section>
      <section className="py-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-brand-500/20 text-brand-400">
            <HelpCircle size={20} />
          </span>
          Dúvidas?
        </h2>
        <p className="leading-tight">
          Para mais informações, entre em contato com nosso suporte.
        </p>
      </section>
    </div>
  );
}
