import { Suspense } from "react";
import CheckoutSuccessContent from "./CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
          <div className="mx-auto max-w-4xl">
            <div className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-slate-900 px-10 py-16 text-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Paiement
              </p>
              <h1 className="mb-4 text-4xl font-bold md:text-5xl">
                Chargement de la confirmation...
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-300">
                Nous préparons votre page de confirmation.
              </p>
            </div>
          </div>
        </main>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}