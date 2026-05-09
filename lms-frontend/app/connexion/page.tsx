"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function ConnexionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const returnTo = searchParams.get("returnTo") || "/bibliotheque";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const res = await fetch(`${baseUrl}/accounts/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Identifiants invalides");
      }

      await login(data.access, data.refresh);
      router.push(returnTo);
    } catch {
      setError("Connexion impossible. Vérifiez votre email et votre mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Connexion apprenant
          </p>

          <h1 className="mb-3 text-3xl font-bold">Connectez-vous à votre espace</h1>

          <p className="mb-6 text-sm leading-7 text-slate-300">
            Retrouvez vos formations achetées, reprenez votre progression et accédez à
            vos certificats.
          </p>

          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
            Nouveau sur la plateforme ?{" "}
            <Link
              href={`/inscription?returnTo=${encodeURIComponent(returnTo)}`}
              className="font-bold text-white underline underline-offset-4"
            >
              Créer mon compte
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              required
            />

            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              required
            />

            <div className="flex justify-end">
              <Link
                href="/mot-de-passe-oublie"
                className="text-sm text-cyan-400 transition hover:text-cyan-300"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            SmartQHSE Academy
          </p>

          <h2 className="mb-4 text-2xl font-bold">
            Une fois connecté, votre accès est automatique.
          </h2>

          <ul className="space-y-4 text-sm leading-7 text-slate-300">
            <li>✅ Accès immédiat après achat</li>
            <li>✅ Formations disponibles en ligne 24/7</li>
            <li>✅ Progression sauvegardée</li>
            <li>✅ Certificat disponible après finalisation</li>
            <li>✅ Paiement sécurisé par Stripe</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense>
      <ConnexionContent />
    </Suspense>
  );
}