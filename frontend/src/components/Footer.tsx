import { NavLink } from 'react-router-dom';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="mx-auto px-4 lg:px-20 2xl:px-80">
        {/* Esquerda = descrição+devs | Direita = links */}
        <div className="flex flex-col md:flex-row justify-between gap-16 py-10">
          {/* Coluna Esquerda */}
          <div className="max-w-md">
            {/* Logo */}
            <NavLink
              to="/"
              className="flex items-center text-lg font-bold text-brand-700 dark:text-brand-400"
            >
              <img
                src="/finance-system-logo-light.png"
                alt="Finance System Logo"
                className="dark:hidden h-auto w-32 mr-2"
              />
              <img
                src="/finance-system-logo.png"
                alt="Finance System Logo"
                className="hidden dark:block h-auto w-32 mr-2"
              />
            </NavLink>

            {/* Descrição */}
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Gerencie suas finanças com clareza, segurança e praticidade.
            </p>

            {/* Desenvolvedores */}
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mt-8 mb-3">
              Desenvolvedores
            </h3>
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
              <a
                href="https://github.com/gustavopulz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Github size={16} /> Gustavo Ribeiro Pulz (@gustavopulz)
              </a>
              <a
                href="https://github.com/groxo-B"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:underline"
              >
                <Github size={16} /> Guilherme Roxo Basso (@groxo-B)
              </a>
            </div>
          </div>

          {/* Coluna Direita */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Navegação
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <NavLink to="/summary" className="hover:underline">
                  Resumo
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard" className="hover:underline">
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/user-settings" className="hover:underline">
                  Configurações da Conta
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/politicas-e-privacidade"
                  className="hover:underline"
                >
                  Termos, Políticas e Cookies
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-6 py-4 text-sm text-gray-600 dark:text-gray-400 flex justify-center">
          © {new Date().getFullYear()} Finance System. Todos os direitos
          reservados.
        </div>
      </div>
    </footer>
  );
}
