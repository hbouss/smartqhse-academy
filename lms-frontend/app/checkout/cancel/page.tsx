"use client";

import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900">
          <div className="border-b border-amber-500/10 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 px-10 py-10 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-4xl text-amber-300">
              !
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              Paiement annulé
            </p>

            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Votre commande n’a pas été finalisée
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-300">
              Aucun accès n’a été débloqué. Vous pouvez reprendre l’achat plus tard
              ou continuer à explorer le catalogue.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
                Aucun débit final
              </p>
              <p className="text-slate-300">
                La commande n’a pas activé l’accès à la formation.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
                Reprise possible
              </p>
              <p className="text-slate-300">
                Vous pouvez relancer l’achat quand vous le souhaitez.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
                Bibliothèque inchangée
              </p>
              <p className="text-slate-300">
                Vos formations déjà acquises restent disponibles.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 px-8 py-10">
            <Link
              href="/"
              className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Retour au catalogue
            </Link>

            <Link
              href="/bibliotheque"
              className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
            >
              Voir ma bibliothèque
            </Link>

            <Link
              href="/mon-compte"
              className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
            >
              Voir mon compte
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}