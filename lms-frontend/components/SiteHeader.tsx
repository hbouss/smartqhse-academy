"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function SiteHeader() {
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 text-white md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="group flex min-w-0 items-center gap-3 transition hover:opacity-95"
          >
            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-cyan-400/25 bg-slate-900 shadow-[0_0_20px_rgba(34,211,238,0.16)] md:h-14 md:w-14">
              <Image
                src="/apple-touch-icon.png"
                alt="SmartQHSE Academy"
                fill
                sizes="(max-width: 768px) 48px, 56px"
                className="object-cover scale-110"
                priority
              />
            </div>

            <div className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold tracking-wide text-white transition group-hover:text-cyan-300 md:text-base">
                SmartQHSE Academy
              </span>
              <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-cyan-400/90 sm:block">
                QHSE • IA • Automatisation
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-4 text-sm lg:flex">
            <Link href="/" className="transition hover:text-cyan-300">
              Catalogue
            </Link>

            <Link href="/bibliotheque" className="transition hover:text-cyan-300">
              Bibliothèque
            </Link>

            {!loading && !user && (
              <>
                <Link href="/connexion" className="transition hover:text-cyan-300">
                  Connexion
                </Link>

                <Link
                  href="/inscription"
                  className="rounded-full bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Inscription
                </Link>
              </>
            )}

            {!loading && user && (
              <>
                {user.is_staff && (
                  <Link
                    href="/admin/dashboard"
                    className="rounded-full border border-cyan-500/30 px-4 py-2 font-semibold text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
                  >
                    Pilotage
                  </Link>
                )}

                <Link
                  href="/mon-compte"
                  className="font-medium text-white transition hover:text-cyan-300"
                >
                  Mon compte
                </Link>

                <span className="hidden text-slate-300 xl:inline">{user.email}</span>

                <button
                  onClick={logout}
                  className="rounded-full border border-slate-700 px-4 py-2 transition hover:border-slate-500 hover:text-cyan-300"
                >
                  Déconnexion
                </button>
              </>
            )}
          </nav>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:border-slate-500 hover:text-cyan-300 lg:hidden"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? "Fermer" : "Menu"}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 lg:hidden">
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="rounded-xl px-3 py-3 text-sm font-medium text-white transition hover:bg-slate-800 hover:text-cyan-300"
              >
                Catalogue
              </Link>

              <Link
                href="/bibliotheque"
                onClick={closeMobileMenu}
                className="rounded-xl px-3 py-3 text-sm font-medium text-white transition hover:bg-slate-800 hover:text-cyan-300"
              >
                Bibliothèque
              </Link>

              {!loading && !user && (
                <>
                  <Link
                    href="/connexion"
                    onClick={closeMobileMenu}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-white transition hover:bg-slate-800 hover:text-cyan-300"
                  >
                    Connexion
                  </Link>

                  <Link
                    href="/inscription"
                    onClick={closeMobileMenu}
                    className="inline-flex justify-center rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                  >
                    Inscription
                  </Link>
                </>
              )}

              {!loading && user && (
                <>
                  {user.is_staff && (
                    <Link
                      href="/admin/dashboard"
                      onClick={closeMobileMenu}
                      className="rounded-xl border border-cyan-500/20 px-3 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:bg-slate-800 hover:text-cyan-200"
                    >
                      Pilotage
                    </Link>
                  )}

                  <Link
                    href="/mon-compte"
                    onClick={closeMobileMenu}
                    className="rounded-xl px-3 py-3 text-sm font-medium text-white transition hover:bg-slate-800 hover:text-cyan-300"
                  >
                    Mon compte
                  </Link>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-300">
                    {user.email}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:text-cyan-300"
                  >
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}