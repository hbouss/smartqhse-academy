"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type BuyButtonProps = {
  courseId: number;
};

export default function BuyButton({ courseId }: BuyButtonProps) {
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

      const res = await fetch(`${baseUrl}/payments/checkout/${courseId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
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
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Redirection..." : "Acheter la formation"}
    </button>
  );
}