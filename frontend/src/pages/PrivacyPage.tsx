import { Shield, Cookie, HelpCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function PoliticasContent() {
  return (
    <div className="mx-auto px-4 lg:px-20 2xl:px-96 ">
      <h1 className="py-4 text-3xl font-bold text-brand-400">
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
        <p className="leading-tight mt-4">
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
        <p className="leading-tight mt-4">
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

export default function PoliticasPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <PoliticasContent />
      {!auth?.user && (
        <div className="flex flex-col items-center justify-center gap-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg p-3 mt-10 mb-4 mx-auto max-w-md shadow-sm animate-fade-in">
          <span className="font-medium text-base">Você não está logado</span>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded bg-brand-400 text-white font-medium hover:bg-brand-500 transition"
              onClick={() => navigate("/login")}
            >
              Entrar
            </button>
            <button
              className="px-4 py-2 rounded border border-brand-400 text-brand-400 font-medium hover:bg-brand-50 transition"
              onClick={() => navigate("/register")}
            >
              Criar uma conta
            </button>
          </div>
        </div>
      )}
    </>
  );
}
