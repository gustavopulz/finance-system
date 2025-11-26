import { NavLink } from "react-router-dom";
import {
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  Settings,
  PieChart,
  HelpCircle,
  Crown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { ProModal } from "./ProModal";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    theme === "dark"
      ? root.classList.add("dark")
      : root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}

export default function Header() {
  const { theme, setTheme } = useTheme();
  const auth = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [proOpen, setProOpen] = useState(false);

  // Links do menu
  const menuLinks = [
    { to: "/summary", label: "Resumo", icon: <PieChart size={16} /> },
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={16} />,
    },
    { to: "/info", label: "Ajuda", icon: <HelpCircle size={16} /> },
  ];

  const userMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-700/60">
      <div className="mx-auto px-4 lg:px-20 flex items-center justify-between h-[68px]">
        <div className="flex items-center gap-6">
          <NavLink to="/summary" className="flex items-center gap-2 group">
            <img
              src={
                theme === "dark"
                  ? "/finance-system-logo.png"
                  : "/finance-system-logo-light.png"
              }
              alt="Finance System Logo"
              className="h-9 md:h-10 w-auto transition-opacity group-hover:opacity-90"
            />
          </NavLink>
          <nav className="hidden md:flex items-stretch gap-1">
            {menuLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `nav-link flex items-center gap-1 ${
                    isActive ? "nav-link-active" : ""
                  }`
                }
              >
                {link.icon}
                <span
                  className={
                    "nav-link-label " +
                    (location.pathname === link.to ? "gradient-nav-text" : "")
                  }
                >
                  {link.label}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-md p-2 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition"
            title={theme === "dark" ? "Tema claro" : "Tema escuro"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            type="button"
            onClick={() => setProOpen(true)}
            className="hidden sm:inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white shadow hover:from-amber-500/90 hover:to-orange-600/90 transition relative"
            title="Plano Pro (em breve)"
          >
            <Crown size={16} className="drop-shadow" />
            <span className="hidden xl:inline">Pro</span>
          </button>
          <div
            className="relative"
            ref={userMenuRef}
            onMouseEnter={() => setUserMenuOpen(true)}
            onMouseLeave={() => setUserMenuOpen(false)}
          >
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="avatar-initials"
              title={auth?.user?.name || "Usuário"}
            >
              {(auth?.user?.name || "U")
                .split(/\s+/)
                .slice(0, 2)
                .map((s) => s[0]?.toUpperCase())
                .join("")}
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-0.5 -translate-y-1 w-56 rounded-xl border border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-slate-900 backdrop-blur-xl shadow-xl py-2 px-2 z-50">
                <div className="px-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 mb-2">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {auth?.user?.name || "Usuário"}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide font-semibold text-blue-600 dark:text-blue-400">
                    {auth?.user?.role === "admin" ? "Admin" : "Usuário"}
                  </p>
                </div>
                <NavLink
                  to="/user-settings"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-blue-50/70 dark:hover:bg-slate-700/60 rounded-md"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings size={16} /> Configurações
                </NavLink>
                {auth?.user?.role === "admin" && (
                  <NavLink
                    to="/admin"
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-blue-50/70 dark:hover:bg-slate-700/60 rounded-md"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} /> Admin
                  </NavLink>
                )}
                <button
                  onClick={() => {
                    auth?.logout();
                    setUserMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50/80 dark:hover:bg-red-500/20 rounded-md"
                >
                  <LogOut size={16} /> Sair
                </button>
              </div>
            )}
          </div>
          <button
            className="md:hidden rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            <svg
              width="24"
              height="24"
              stroke="currentColor"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <nav className="md:hidden px-4 pb-4 flex flex-col gap-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700/60 animate-fade-in">
          {menuLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white"
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.icon} {link.label}
            </NavLink>
          ))}
          <button
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/60"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />} Tema
          </button>
          <button
            onClick={() => {
              auth?.logout();
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20"
          >
            <LogOut size={16} /> Sair
          </button>
        </nav>
      )}
      <ProModal open={proOpen} onClose={() => setProOpen(false)} />
    </header>
  );
}
