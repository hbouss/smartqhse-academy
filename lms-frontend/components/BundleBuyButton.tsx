"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type BundleBuyButtonProps = {
  bundleId: number;
};

export default function BundleBuyButton({ bundleId }: BundleBuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const handleCheckout = async () => {
    if (!user || !accessToken) {
      router.push("/connexion");
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
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Redirection..." : "Acheter le pack"}
    </button>
  );
}