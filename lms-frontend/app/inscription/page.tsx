"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function InscriptionPage() {
  const router = useRouter();

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

      router.push("/connexion");
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
      <div className="mx-auto max-w-md rounded-3xl border border-cyan-500/20 bg-slate-900 p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
          Nouvel utilisateur
        </p>
        <h1 className="mb-6 text-3xl font-bold">Inscription</h1>

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
            {loading ? "Inscription..." : "Créer mon compte"}
          </button>
        </form>
      </div>
    </main>
  );
}