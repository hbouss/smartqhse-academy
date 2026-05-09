"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function InscriptionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const returnTo = searchParams.get("returnTo") || "/bibliotheque";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const res = await fetch(`${baseUrl}/accounts/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          username,
          password,
          role: "student",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          data?.first_name?.[0] ||
          data?.last_name?.[0] ||
          data?.email?.[0] ||
          data?.username?.[0] ||
          data?.password?.[0] ||
          data?.role?.[0] ||
          data?.detail ||
          "Inscription impossible";
        throw new Error(message);
      }

      const loginRes = await fetch(`${baseUrl}/accounts/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        router.push(`/connexion?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      await login(loginData.access, loginData.refresh);
      router.push(returnTo);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Inscription impossible.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-start">
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Création de compte
          </p>

          <h1 className="mb-3 text-3xl font-bold">Créez votre espace apprenant</h1>

          <p className="mb-6 text-sm leading-7 text-slate-300">
            Votre compte permet de sécuriser votre achat, d’accéder immédiatement à vos
            formations et de retrouver votre progression à tout moment.
          </p>

          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-7 text-emerald-100">
            ✅ Création gratuite · ✅ Connexion automatique · ✅ Retour direct vers l’achat
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              required
            />

            <input
              type="text"
              placeholder="Nom"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              required
            />

            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
              required
            />

            <input
              type="text"
              placeholder="Nom d’utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

            {error && <p className="text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
            >
              {loading ? "Création du compte..." : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Déjà inscrit ?{" "}
            <Link
              href={`/connexion?returnTo=${encodeURIComponent(returnTo)}`}
              className="font-semibold text-cyan-400 hover:text-cyan-300"
            >
              Se connecter
            </Link>
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Pourquoi créer un compte ?
          </p>

          <h2 className="mb-4 text-2xl font-bold">
            Votre formation reste disponible dans votre bibliothèque.
          </h2>

          <ul className="space-y-4 text-sm leading-7 text-slate-300">
            <li>✅ Accès à votre bibliothèque personnelle</li>
            <li>✅ Reprise de la formation quand vous voulez</li>
            <li>✅ Suivi de progression</li>
            <li>✅ Certificat après finalisation</li>
            <li>✅ Accès automatique après paiement Stripe</li>
          </ul>

          <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
            Offre de lancement : pensez au code{" "}
            <span className="font-bold text-white">ACADEMY10</span> au moment du paiement.
          </div>
        </div>
      </div>
    </main>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense>
      <InscriptionContent />
    </Suspense>
  );
}