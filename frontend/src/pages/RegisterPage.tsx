import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });

  const [usernameFocused, setUsernameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (!formData.terms) {
      setError('Você deve aceitar os termos e políticas.');
      return;
    }

    setError('');
    console.log('Registro enviado:', formData);
    // aqui você chama sua API de cadastro
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-900 px-4"
      style={{ marginTop: '-1.5rem', marginBottom: '-1.5rem' }}
    >
      <div className="w-full max-w-sm bg-slate-800 rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-medium text-center text-gray-200 mb-6">
          Inscreva-se
        </h2>

        {/* Botão Google */}
        <button
          type="button"
          className="flex items-center justify-center w-full px-4 py-2 bg-transparent text-white border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
        >
          <img src="/Google.png" alt="Google" className="w-5 h-5 mr-2" />
          Continue com Google
        </button>

        {/* Divider */}
        <div className="flex items-center w-full my-6">
          <div className="flex-grow border-t border-slate-600"></div>
          <span className="mx-4 text-sm text-gray-400">ou</span>
          <div className="flex-grow border-t border-slate-600"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Usuário */}
          <div className="relative">
            <label
              htmlFor="username"
              className={`cursor-text absolute left-3 top-[15px] text-sm transition-all ${
                usernameFocused || formData.username
                  ? '-translate-y-9 left-2 text-brand-400 text-xs'
                  : 'text-gray-400'
              }`}
            >
              Nome
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              className="w-full mb-3 px-3 py-3 border rounded-md bg-transparent text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder=""
            />
          </div>

          {/* Email */}
          <div className="relative">
            <label
              htmlFor="email"
              className={`cursor-text absolute left-3 top-[15px] text-sm transition-all ${
                emailFocused || formData.email
                  ? '-translate-y-9 left-2 text-brand-400 text-xs'
                  : 'text-gray-400'
              }`}
            >
              E-mail
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

          {/* Senha */}
          <div className="relative">
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
              className="absolute top-0 bottom-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-200"
              style={{ height: '100%' }}
            >
              {showPassword ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Confirmar Senha */}
          <div className="relative pt-3">
            <label
              htmlFor="confirmPassword"
              className={`cursor-text absolute left-3 top-[27px] text-sm transition-all ${
                confirmFocused || formData.confirmPassword
                  ? '-translate-y-9 left-2 text-brand-400 text-xs'
                  : 'text-gray-400'
              }`}
            >
              Confirmar senha
            </label>
            <input
              type={showConfirm ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              className="w-full px-3 py-3 border rounded-md bg-transparent text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder=""
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute mt-3 inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-200"
            >
              {showConfirm ? (
                <FaEyeSlash className="w-4 h-4" />
              ) : (
                <FaEye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Checkbox termos */}
          <div className="flex items-center gap-2 text-sm text-gray-300 justify-start">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              checked={formData.terms}
              onChange={handleInputChange}
              className="register-checkbox"
            />
            <label htmlFor="terms">
              Eu concordo com os{' '}
              <a href="/termos" className="text-brand-400 hover:underline">
                termos
              </a>{' '}
              e{' '}
              <a href="/politicas" className="text-brand-400 hover:underline">
                políticas
              </a>
              .
            </label>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Botão Registrar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full px-4 py-2 text-white rounded-md bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring focus:ring-brand-400"
            >
              Registrar
            </button>
          </div>

          <div className="text-center mt-4 text-sm text-gray-400">
            Já tem uma conta?{' '}
            <a href="/login" className="hover:underline text-brand-400">
              Conecte-se!
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
