"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type BundleBuyButtonProps = {
  bundleId: number;
};

export default function BundleBuyButton({ bundleId }: BundleBuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const handleCheckout = async () => {
    if (!user || !accessToken) {
      router.push("/connexion");
      return;
    }

    if (!legalAccepted) {
      alert(
        "Vous devez confirmer l’accès immédiat au contenu numérique et la perte du droit de rétractation avant de poursuivre."
      );
      return;
    }

    try {
      setLoading(true);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const res = await fetch(`${baseUrl}/payments/checkout-bundle/${bundleId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          legal_acknowledged: true,
          immediate_access_requested: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création du checkout pack.");
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error(error);
      alert("Impossible de lancer le paiement du pack.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-7 text-slate-300">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-amber-500 focus:ring-amber-500"
          />
          <span>
            Je demande l’accès immédiat au pack après paiement et reconnais
            expressément perdre mon droit de rétractation dès le début de l’accès aux
            contenus numériques.
          </span>
        </label>

        <p className="mt-3 text-xs leading-6 text-slate-400">
          En poursuivant, vous acceptez également nos{" "}
          <Link
            href="/conditions-generales-de-vente"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Conditions générales de vente
          </Link>{" "}
          et notre{" "}
          <Link
            href="/politique-de-confidentialite"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Politique de confidentialité
          </Link>.
        </p>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading || !legalAccepted}
        className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Redirection..." : "Acheter le pack"}
      </button>
    </div>
  );
}