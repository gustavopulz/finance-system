import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaEyeSlash, FaEye } from 'react-icons/fa';

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!auth || !auth.login) {
        setError('Erro de autenticação');
        return;
      }
      await auth.login(formData.email, formData.password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Credenciais inválidas');
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-900 px-4"
      style={{ marginTop: '-1.5rem', marginBottom: '-1.5rem' }}
    >
      <div className="w-full max-w-sm bg-slate-800 rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-medium text-center text-gray-200 mb-6">
          Conecte-se
        </h2>

        {/* Botão Google melhorado */}
        <button
          type="button"
          className="flex items-center justify-center w-full px-4 py-2 bg-transparent text-white border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
        >
          <img src="/Google.png" alt="Google" className="w-5 h-5 mr-2" />
          Continue com Google
        </button>

        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-slate-600"></div>
          <span className="mx-4 text-sm text-gray-400">ou</span>
          <div className="flex-grow border-t border-slate-600"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Input Email */}
          <div className="relative">
            <label
              htmlFor="email"
              className={`cursor-text absolute left-3 top-[15px] text-sm transition-all ${
                emailFocused || formData.email
                  ? '-translate-y-9 left-2 text-brand-400 text-xs'
                  : 'text-gray-400'
              }`}
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              className="w-full mb-3 px-3 py-3 border rounded-md bg-transparent text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder=""
            />
          </div>

          {/* Input Senha */}
          <div className="relative mb-10">
            <label
              htmlFor="password"
              className={`cursor-text absolute left-3 top-[15px] text-sm transition-all ${
                passwordFocused || formData.password
                  ? '-translate-y-9 left-2 text-brand-400 text-xs'
                  : 'text-gray-400'
              }`}
            >
              Senha
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              className="w-full px-3 py-3 border rounded-md bg-transparent text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder=""
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-200"
            >
              {showPassword ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Botão de Login */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-4 py-2 text-white rounded-md bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring focus:ring-brand-400"
            >
              Entrar
            </button>
          </div>

          <div className="text-center mt-4 text-sm text-gray-400">
            Não tem uma conta?{' '}
            <a href="/register" className="hover:underline text-brand-400">
              Cadastre-se agora!
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
