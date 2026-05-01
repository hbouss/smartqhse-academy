"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const uid = useMemo(() => searchParams.get("uid") || "", [searchParams]);
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const canSubmit = uid && token && newPassword && confirmPassword && !loading;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!uid || !token) {
      setErrorMessage("Le lien de réinitialisation est invalide ou incomplet.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_API_BASE_URL manquant");
      }

      const res = await fetch(`${baseUrl}/accounts/password-reset-confirm/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid,
          token,
          new_password: newPassword,
        }),
      });

      const rawText = await res.text();
      let data: { message?: string; error?: string; detail?: string } | null = null;

      if (rawText) {
        try {
          data = JSON.parse(rawText) as {
            message?: string;
            error?: string;
            detail?: string;
          };
        } catch {
          throw new Error("Le backend n'a pas renvoyé un JSON valide.");
        }
      }

      if (!res.ok) {
        throw new Error(
          data?.detail || data?.error || data?.message || "Impossible de réinitialiser le mot de passe."
        );
      }

      setSuccessMessage(
        data?.message || "Votre mot de passe a bien été réinitialisé."
      );

      setTimeout(() => {
        router.push("/connexion");
      }, 1800);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la réinitialisation."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 md:p-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Réinitialisation
          </p>

          <h1 className="mb-4 text-3xl font-bold md:text-4xl">
            Définir un nouveau mot de passe
          </h1>

          <p className="mb-8 text-slate-300">
            Choisissez un nouveau mot de passe pour accéder à votre compte SmartQHSE Academy.
          </p>

          {!uid || !token ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <p className="font-semibold text-amber-300">Lien invalide</p>
              <p className="mt-2 text-sm text-slate-300">
                Le lien de réinitialisation est incomplet ou expiré.
              </p>
              <div className="mt-5">
                <Link
                  href="/mot-de-passe-oublie"
                  className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                >
                  Demander un nouveau lien
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Minimum 8 caractères"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Ressaisissez votre mot de passe"
                />
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                  {successMessage}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Mise à jour..." : "Réinitialiser mon mot de passe"}
                </button>

                <Link
                  href="/connexion"
                  className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
                >
                  Retour à la connexion
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}