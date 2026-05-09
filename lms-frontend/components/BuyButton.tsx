"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type BuyButtonProps = {
  courseId: number;
};

export default function BuyButton({ courseId }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleCheckout = async () => {
    if (!user || !accessToken) {
      router.push(
        `/inscription?returnTo=${encodeURIComponent(`${pathname}?checkout=1#achat`)}`
      );
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

      const res = await fetch(`${baseUrl}/payments/checkout/${courseId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          legal_acknowledged: true,
          immediate_access_requested: true,
          promo_code: "ACADEMY10",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la création du checkout.");
      }

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      console.error(error);
      alert("Impossible de lancer le paiement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!user && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
          Créez votre compte gratuitement pour accéder au paiement sécurisé et recevoir
          immédiatement votre formation après achat.
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
        Offre de lancement : utilisez le code{" "}
        <span className="font-bold text-white">ACADEMY10</span> pour obtenir -10 %.
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-7 text-slate-300">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={legalAccepted}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
          />
          <span>
            Je demande l’accès immédiat à la formation après paiement et reconnais
            expressément perdre mon droit de rétractation dès le début de l’accès au
            contenu numérique.
          </span>
        </label>

        <p className="mt-3 text-xs leading-6 text-slate-400">
          En poursuivant, vous acceptez nos{" "}
          <Link href="/conditions-generales-de-vente" className="text-cyan-400 hover:text-cyan-300">
            Conditions générales de vente
          </Link>{" "}
          et notre{" "}
          <Link href="/politique-de-confidentialite" className="text-cyan-400 hover:text-cyan-300">
            Politique de confidentialité
          </Link>.
        </p>
      </div>

      <button
        onClick={handleCheckout}
        disabled={loading || !legalAccepted}
        className="w-full rounded-full bg-cyan-500 px-6 py-4 text-base font-bold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading
          ? "Redirection vers le paiement..."
          : user
          ? "Acheter maintenant"
          : "Créer mon compte et acheter"}
      </button>

      <p className="text-center text-xs text-slate-400">
        Paiement sécurisé par Stripe. Accès automatique après validation du paiement.
      </p>
    </div>
  );
}