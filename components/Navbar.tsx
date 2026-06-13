"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

interface NavbarProps {
  title: string;
  backHref?: string;
  showBack?: boolean;
  userName?: string;
  userRole?: string;
}

export default function Navbar({ title, backHref = "/dashboard", showBack = true, userName, userRole }: NavbarProps) {
  const router = useRouter();
  const [showLogout, setShowLogout] = useState(false);

  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBack && (
              <>
                <button
                  onClick={() => router.push(backHref)}
                  className="text-zinc-400 hover:text-white transition-colors text-sm flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </button>
                <span className="text-zinc-700">|</span>
              </>
            )}
            <div className="flex items-center gap-2.5">
              {/* Ícone de chave — remete à hotelaria */}
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span className="font-semibold text-white text-sm tracking-tight">Urban Estoque</span>
              <span className="text-zinc-700">|</span>
              <span className="text-zinc-400 text-sm">{title}</span>
            </div>
          </div>

          {userName && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-medium text-white leading-tight">{userName}</p>
                <p className="text-xs text-zinc-500">{userRole}</p>
              </div>
              <button
                onClick={() => setShowLogout(true)}
                className="text-xs border border-zinc-700 hover:border-zinc-500 text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Pop-up de confirmação de logout */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-sm p-6">
            <h3 className="font-semibold text-white text-sm mb-1">Sair do sistema</h3>
            <p className="text-zinc-400 text-xs mb-5">Tem certeza que deseja encerrar sua sessão?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogout(false)}
                className="flex-1 border border-zinc-700 hover:border-zinc-500 text-zinc-300 py-2 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white py-2 text-sm font-semibold transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
