import React from 'react';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="w-full py-4 px-2 md:py-6 md:px-6 text-center text-sm bg-white dark:bg-slate-900 dark:text-gray-400 text-gray-600 mt-8 border-t border-slate-800">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between max-w-4xl mx-auto min-h-auto gap-2">
        <div className="mb-2 md:mb-0 whitespace-nowrap">
          &copy; {year} Finance System. Todos os direitos reservados.
        </div>
        <div className="mb-2 md:mb-0 flex flex-wrap md:flex-nowrap items-center justify-center gap-2">
          <a
            href="/privacy"
            className="mx-2 text-blue-600 hover:underline whitespace-nowrap"
          >
            Política de Privacidade
          </a>
          <a
            href="#"
            className="mx-2 text-blue-600 hover:underline whitespace-nowrap"
          >
            Termos de Uso
          </a>
        </div>
      </div>
      <div className="mt-2 md:mt-4 flex flex-wrap md:flex-nowrap items-center justify-center gap-2">
        <span className="whitespace-nowrap">Desenvolvido por</span>
        <a
          href="https://github.com/gustavopulz"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-1 text-blue-600 hover:underline whitespace-nowrap"
        >
          Gustavo Ribeiro Pulz
        </a>
        <span className="whitespace-nowrap">e</span>
        <a
          href="https://github.com/groxo-b"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-1 text-blue-600 hover:underline whitespace-nowrap"
        >
          Guilherme Roxo
        </a>
      </div>
    </footer>
  );
};

export default Footer;
