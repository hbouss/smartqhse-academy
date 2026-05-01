"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900">
          <div className="border-b border-emerald-500/10 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-slate-900 px-10 py-10 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-4xl text-emerald-300">
              ✓
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Paiement confirmé
            </p>

            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              Votre formation est maintenant disponible
            </h1>

            <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-300">
              Votre achat a bien été validé. L’accès a été débloqué automatiquement
              et vous pouvez commencer votre formation immédiatement.
            </p>
          </div>

          <div className="grid gap-6 px-8 py-8 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
                Accès
              </p>
              <p className="text-slate-300">
                Votre formation a été ajoutée à votre bibliothèque.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
                Reprise
              </p>
              <p className="text-slate-300">
                Vous pourrez reprendre votre progression à tout moment.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
                Confirmation
              </p>
              <p className="text-slate-300">
                Un email de confirmation vous a été envoyé.
              </p>
            </div>
          </div>

          {sessionId && (
            <div className="px-8 pb-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                  Référence de session
                </p>
                <p className="mt-2 break-all text-sm text-slate-300">{sessionId}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 px-8 py-10">
            <Link
              href="/bibliotheque"
              className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
            >
              Accéder à ma bibliothèque
            </Link>

            <Link
              href="/mon-compte"
              className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
            >
              Voir mon compte
            </Link>

            <Link
              href="/"
              className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
            >
              Retour au dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}