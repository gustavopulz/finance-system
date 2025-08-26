import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../lib/api'; // importa a função real

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!auth || !auth.login) {
        setError('Erro de autenticação');
        return;
      }

      // chama a API real
      await apiLogin(username, password);

      // busca e salva usuário autenticado no AuthContext
      await auth.login();
      // redireciona para a página inicial
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto mt-10 p-6 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700"
    >
      <h1 className="text-xl font-bold mb-4">Login</h1>
      {error && <p className="text-red-500">{error}</p>}
      <input
        placeholder="Usuário"
        className="input input-bordered w-full mb-2"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Senha"
        className="input input-bordered w-full mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn btn-primary w-full">Entrar</button>
    </form>
  );
}
