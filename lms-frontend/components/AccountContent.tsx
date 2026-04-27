"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

type MeResponse = {
  id: number;
  email: string;
  username: string;
  role: string;
  first_name?: string;
  last_name?: string;
  is_premium: boolean;
  is_staff: boolean;
};

type LibraryCourse = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  price_eur: string;
  enrolled_at: string;
  started_at: string | null;
  last_opened_at: string | null;
  completed_at: string | null;
  status: "not_started" | "in_progress" | "completed";
};

type OrderItem = {
  id: number;
  course: {
    id: number;
    title: string;
    slug: string;
  } | null;
  bundle: {
    id: number;
    title: string;
    slug: string;
  } | null;
  amount_eur: string;
  status: string;
  stripe_session_id: string;
  created_at: string;
};

type CertificateItem = {
  id: number;
  certificate_number: string;
  full_name: string;
  course: {
    id: number;
    title: string;
    slug: string;
  };
  issued_at: string;
  file_url: string | null;
};

export default function AccountContent() {
  const { user, accessToken, loading, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<MeResponse | null>(null);
  const [courses, setCourses] = useState<LibraryCourse[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchAccountData = async () => {
      if (loading) return;

      if (!user || !accessToken) {
        router.push("/connexion");
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const [profileRes, libraryRes, ordersRes, certificatesRes] = await Promise.all([
          fetch(`${baseUrl}/accounts/me/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/learning/my-library/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/payments/my-orders/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          fetch(`${baseUrl}/learning/my-certificates/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        const profileData = await profileRes.json();
        const libraryData = await libraryRes.json();
        const ordersData = await ordersRes.json();
        const certificatesData = await certificatesRes.json();

        if (!profileRes.ok) {
          throw new Error(profileData.error || "Impossible de charger le profil");
        }

        if (!libraryRes.ok) {
          throw new Error(libraryData.error || "Impossible de charger les formations");
        }

        if (!ordersRes.ok) {
          throw new Error(ordersData.error || "Impossible de charger les achats");
        }

        if (!certificatesRes.ok) {
          throw new Error(certificatesData.error || "Impossible de charger les certificats");
        }

        setProfile(profileData);
        setCourses(libraryData);
        setOrders(ordersData);
        setCertificates(certificatesData);
      } catch {
        setError("Impossible de charger les informations du compte.");
      } finally {
        setPageLoading(false);
      }
    };

    fetchAccountData();
  }, [user, accessToken, loading, router]);

  const stats = useMemo(() => {
    const total = courses.length;
    const inProgress = courses.filter((course) => course.status === "in_progress").length;
    const completed = courses.filter((course) => course.status === "completed").length;
    const notStarted = courses.filter((course) => course.status === "not_started").length;

    return {
      total,
      inProgress,
      completed,
      notStarted,
    };
  }, [courses]);

  const getStatusBadge = (status: LibraryCourse["status"]) => {
    if (status === "completed") {
      return (
        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
          Terminée
        </span>
      );
    }

    if (status === "in_progress") {
      return (
        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300">
          En cours
        </span>
      );
    }

    return (
      <span className="rounded-full bg-slate-700/60 px-3 py-1 text-sm font-medium text-slate-200">
        Non commencée
      </span>
    );
  };

  const getOrderTypeLabel = (order: OrderItem) => {
    return order.bundle ? "Pack" : "Formation";
  };

  const getOrderTitle = (order: OrderItem) => {
    if (order.bundle) return order.bundle.title;
    if (order.course) return order.course.title;
    return "Produit indisponible";
  };

  const getOrderHref = (order: OrderItem) => {
    if (order.bundle) return `/packs/${order.bundle.slug}`;
    if (order.course) return `/player/${order.course.slug}`;
    return "/mon-compte";
  };

  const getOrderStatusBadge = (status: string) => {
    return (
      <span
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          status === "paid"
            ? "bg-emerald-500/10 text-emerald-300"
            : status === "pending"
            ? "bg-amber-500/10 text-amber-300"
            : "bg-slate-700/60 text-slate-200"
        }`}
      >
        {status}
      </span>
    );
  };

  const displayName =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() ||
    profile?.username ||
    "-";

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!accessToken) {
      setPasswordError("Utilisateur non connecté.");
      return;
    }

    setPasswordLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const res = await fetch(`${baseUrl}/accounts/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          data?.current_password?.[0] ||
          data?.new_password?.[0] ||
          data?.confirm_password?.[0] ||
          data?.non_field_errors?.[0] ||
          data?.detail ||
          "Impossible de mettre à jour le mot de passe.";
        throw new Error(message);
      }

      setPasswordSuccess(data.message || "Votre mot de passe a bien été mis à jour.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError("Impossible de mettre à jour le mot de passe.");
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">Chargement du compte...</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl text-rose-400">{error}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Compte utilisateur
          </p>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Mon compte</h1>
          <p className="text-slate-300">
            Retrouvez vos informations, vos formations acquises, vos achats et vos certificats.
          </p>
        </div>

        <div className="mb-10 grid gap-6 xl:grid-cols-3">
          <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-6 sm:p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Profil
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Nom complet</p>
                <p className="text-xl font-semibold text-white">{displayName}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Nom utilisateur</p>
                <p className="text-lg text-white">{profile?.username || "-"}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="break-all text-lg text-white">{profile?.email || "-"}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-300">
                  Rôle : {profile?.role || "student"}
                </span>

                {profile?.is_staff && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300">
                    Staff
                  </span>
                )}

                {profile?.is_premium && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                    Premium
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Actions rapides
            </p>

            <div className="flex flex-col gap-4">
              <Link
                href="/bibliotheque"
                className="rounded-full bg-cyan-500 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Accéder à ma bibliothèque
              </Link>

              <Link
                href="/"
                className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-slate-500"
              >
                Retour au dashboard
              </Link>

              <button
                onClick={logout}
                className="rounded-full border border-rose-500/30 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400 hover:text-rose-200"
              >
                Déconnexion
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Sécurité du compte
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                placeholder="Mot de passe actuel"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                required
              />

              <input
                type="password"
                placeholder="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                required
              />

              <input
                type="password"
                placeholder="Confirmer le nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                required
              />

              {passwordSuccess && (
                <p className="text-sm text-emerald-400">{passwordSuccess}</p>
              )}

              {passwordError && (
                <p className="text-sm text-rose-400">{passwordError}</p>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
              >
                {passwordLoading ? "Mise à jour..." : "Modifier mon mot de passe"}
              </button>
            </form>
          </div>
        </div>

        <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Formations
            </p>
            <p className="text-4xl font-bold text-white">{stats.total}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              En cours
            </p>
            <p className="text-4xl font-bold text-white">{stats.inProgress}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Terminées
            </p>
            <p className="text-4xl font-bold text-white">{stats.completed}</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Non commencées
            </p>
            <p className="text-4xl font-bold text-white">{stats.notStarted}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Formations acquises
          </p>
          <h2 className="text-3xl font-bold">Mon activité</h2>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
            Aucune formation acquise pour le moment.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/player/${course.slug}`}
                className="rounded-2xl border border-cyan-500/20 bg-slate-900 p-6 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-1 hover:border-cyan-400/40"
              >
                <p className="mb-2 text-sm font-medium text-cyan-400">Formation acquise</p>
                <h3 className="mb-3 text-2xl font-semibold">{course.title}</h3>

                <p className="mb-5 text-sm leading-7 text-slate-300">
                  {course.short_description || "Description à compléter."}
                </p>

                <div className="mb-4 flex items-center gap-3">{getStatusBadge(course.status)}</div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {course.last_opened_at
                      ? "Dernière activité enregistrée"
                      : "Prêt à démarrer"}
                  </span>

                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-300">
                    Ouvrir
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-14">
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Paiements
            </p>
            <h2 className="text-3xl font-bold">Historique des achats</h2>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
              Aucun achat enregistré pour le moment.
            </div>
          ) : (
            <>
              <div className="space-y-4 md:hidden">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-400">
                          {getOrderTypeLabel(order)}
                        </p>
                        <h3 className="mt-1 text-base font-semibold text-white">
                          {getOrderTitle(order)}
                        </h3>
                      </div>

                      {getOrderStatusBadge(order.status)}
                    </div>

                    <div className="space-y-2 text-sm text-slate-300">
                      <p>
                        <span className="text-slate-400">Montant :</span> {order.amount_eur} €
                      </p>
                      <p>
                        <span className="text-slate-400">Date :</span>{" "}
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </p>
                      <p className="break-all">
                        <span className="text-slate-400">Session :</span> {order.stripe_session_id}
                      </p>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={getOrderHref(order)}
                        className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                      >
                        Voir le produit
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 md:block">
                <div className="grid grid-cols-[120px_2fr_1fr_1fr_1.2fr]">
                  <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Type
                  </div>
                  <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Produit
                  </div>
                  <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Montant
                  </div>
                  <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Statut
                  </div>
                  <div className="border-b border-slate-800 px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Date
                  </div>

                  {orders.map((order) => (
                    <div key={order.id} className="contents">
                      <div className="border-b border-slate-800 px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            order.bundle
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-cyan-500/10 text-cyan-300"
                          }`}
                        >
                          {getOrderTypeLabel(order)}
                        </span>
                      </div>

                      <div className="border-b border-slate-800 px-5 py-4">
                        <Link
                          href={getOrderHref(order)}
                          className="font-medium text-white transition hover:text-cyan-300"
                        >
                          {getOrderTitle(order)}
                        </Link>
                        <p className="mt-1 text-xs text-slate-500">
                          Session: {order.stripe_session_id}
                        </p>
                      </div>

                      <div className="border-b border-slate-800 px-5 py-4 text-white">
                        {order.amount_eur} €
                      </div>

                      <div className="border-b border-slate-800 px-5 py-4">
                        {getOrderStatusBadge(order.status)}
                      </div>

                      <div className="border-b border-slate-800 px-5 py-4 text-slate-300">
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-12">
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Certificats
            </p>
            <h2 className="text-3xl font-bold">Mes certificats obtenus</h2>
            <p className="mt-2 text-slate-300">
              Retrouvez ici l’ensemble des certificats acquis sur la plateforme.
            </p>
          </div>

          {certificates.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
              Aucun certificat disponible pour le moment.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {certificates.map((certificate) => (
                <div
                  key={certificate.id}
                  className="rounded-2xl border border-emerald-500/20 bg-slate-900 p-6 shadow-lg shadow-emerald-950/10"
                >
                  <p className="mb-2 text-sm font-medium text-emerald-400">
                    Certificat obtenu
                  </p>

                  <h3 className="mb-3 text-2xl font-semibold text-white">
                    {certificate.course.title}
                  </h3>

                  <div className="space-y-2 text-sm text-slate-300">
                    <p>
                      <span className="text-slate-400">Titulaire :</span>{" "}
                      {certificate.full_name}
                    </p>
                    <p>
                      <span className="text-slate-400">N° certificat :</span>{" "}
                      {certificate.certificate_number}
                    </p>
                    <p>
                      <span className="text-slate-400">Date d’émission :</span>{" "}
                      {new Date(certificate.issued_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  {certificate.file_url && (
                    <a
                      href={certificate.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                    >
                      Télécharger le certificat PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}