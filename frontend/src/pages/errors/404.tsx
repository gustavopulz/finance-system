import { NavLink } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-slate-900 text-gray-800 dark:text-gray-200">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-xl mb-6">Página não encontrada</p>
      <NavLink to="/" className="btn btn-primary">
        Voltar para a página inicial
      </NavLink>
    </div>
  );
}
