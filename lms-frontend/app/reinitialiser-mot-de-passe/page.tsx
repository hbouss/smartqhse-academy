import { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
          <div className="mx-auto max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Réinitialisation
            </p>
            <h1 className="mb-4 text-3xl font-bold">Chargement...</h1>
            <p className="text-slate-300">
              Préparation du formulaire de réinitialisation.
            </p>
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}