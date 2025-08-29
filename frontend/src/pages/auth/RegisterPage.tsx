import React, { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { registerUser } from '../lib/api';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function RegisterPage() {
  // Controla se o usuário tentou registrar para mostrar erros de campos vazios
  const [, setTriedSubmit] = useState(false);
  const { notify } = useNotification();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    terms: false,
  });
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [termsError, setTermsError] = useState('');

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Limpa erro ao digitar
    if (name === 'email') setEmailError('');
    if (name === 'password') setPasswordError('');
    if (name === 'confirmPassword') setConfirmError('');
    if (name === 'name') setNameError('');
    if (name === 'terms') setTermsError('');
  }

  // Validação automática ao perder o foco
  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === 'email' && value) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        setEmailError('E-mail inválido.');
      }
    }
    if (name === 'password' && value) {
      if (value.length < 6) {
        setPasswordError('A senha deve ter pelo menos 6 caracteres.');
      }
    }
    if (name === 'confirmPassword' && value) {
      if (value !== formData.password) {
        setConfirmError('As senhas não coincidem.');
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTriedSubmit(true);
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setTermsError('');

    if (!formData.name.trim()) {
      setNameError('O nome é obrigatório.');
      valid = false;
    }
    if (!formData.email.trim()) {
      setEmailError('O e-mail é obrigatório.');
      valid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      setEmailError('E-mail inválido.');
      valid = false;
    }
    if (!formData.password) {
      setPasswordError('A senha é obrigatória.');
      valid = false;
    } else if (formData.password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres.');
      valid = false;
    }
    if (!formData.confirmPassword) {
      setConfirmError('Confirme sua senha.');
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      setConfirmError('As senhas não coincidem.');
      valid = false;
    }
    if (!formData.terms) {
      setTermsError('Você deve aceitar os termos e políticas.');
      valid = false;
    }
    if (!valid) return;
    try {
      const result = await registerUser(
        formData.email,
        formData.password,
        formData.name
      );
      if (!result.success) {
        if (result.message && result.message.toLowerCase().includes('email')) {
          setEmailError('Já existe um usuário com este e-mail.');
          const emailInput = document.getElementById('email');
          if (emailInput) emailInput.focus();
        } else {
          notify(result.message || 'Erro ao registrar.', 'error');
        }
        return;
      }
      notify('Cadastro realizado com sucesso!', 'success');
      window.location.href = '/login';
    } catch (err) {
      notify('Erro ao registrar.', 'error');
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-900 px-4"
      style={{ marginTop: '-1.5rem', marginBottom: '-1.5rem' }}
    >
      <div className="w-full max-w-sm bg-slate-800 rounded shadow-xl p-6">
        <h2 className="text-2xl font-medium text-center text-gray-200 mb-6">
          Inscreva-se
        </h2>

        {/* Botão Google */}
        <button
          type="button"
          className="flex items-center justify-center w-full px-4 py-2 bg-transparent text-white border border-slate-600 rounded shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
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
          {/* Nome */}
          <div className="relative mb-4">
            <label
              htmlFor="name"
              className={`cursor-text absolute left-3 top-[15px] text-sm transition-all ${
                nameFocused || formData.name
                  ? '-translate-y-9 left-2 text-brand-400 text-xs'
                  : 'text-gray-400'
              }`}
            >
              Nome
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              className="w-full px-3 py-3 border rounded bg-transparent text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder=""
              required
            />
            {nameError && (
              <span className="text-xs text-red-500 mt-1 block mb-2">
                {nameError}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="relative pt-3">
            <label
              htmlFor="email"
              className={`cursor-text absolute left-3 top-[27px] text-sm transition-all ${
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
              onBlur={(e) => {
                setEmailFocused(false);
                handleBlur(e);
              }}
              className="w-full px-3 py-3 border rounded bg-transparent text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder=""
            />
            {emailError && (
              <span className="text-xs text-red-500 mt-1 block mb-2">
                {emailError}
              </span>
            )}
          </div>

          {/* Senha */}
          <div className="relative pt-3">
            <label
              htmlFor="password"
              className={`cursor-text absolute left-3 top-[27px] text-sm transition-all ${
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
              onBlur={(e) => {
                setPasswordFocused(false);
                handleBlur(e);
              }}
              className="w-full px-3 py-3 border rounded bg-transparent text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            {passwordError && (
              <span className="text-xs text-red-500 mt-1 block">
                {passwordError}
              </span>
            )}
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
              onBlur={(e) => {
                setConfirmFocused(false);
                handleBlur(e);
              }}
              className="w-full px-3 py-3 border rounded bg-transparent text-white border-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
            {confirmError && (
              <span className="text-xs text-red-500 mt-1 block">
                {confirmError}
              </span>
            )}
          </div>

          {/* Checkbox termos */}
          <div className="mb-2">
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
                <a
                  href="/politicas-e-termos"
                  className="text-brand-400 hover:underline"
                >
                  termos
                </a>{' '}
                e{' '}
                <a
                  href="/politicas-e-termos"
                  className="text-brand-400 hover:underline"
                >
                  políticas
                </a>
                .
              </label>
            </div>
            {termsError && (
              <span className="text-xs text-red-500 mt-1 block">
                {termsError}
              </span>
            )}
          </div>

          {/* Botão Registrar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full px-4 py-2 text-white rounded bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring focus:ring-brand-400"
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
