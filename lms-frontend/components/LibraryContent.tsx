"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

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

function truncateText(text: string, maxLength = 115) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export default function LibraryContent() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<LibraryCourse[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLibrary = async () => {
      if (loading) return;

      if (!user || !accessToken) {
        router.push("/connexion");
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const [libraryRes, certificatesRes] = await Promise.all([
          fetch(`${baseUrl}/learning/my-library/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
          fetch(`${baseUrl}/learning/my-certificates/`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ]);

        const libraryData = await libraryRes.json();
        const certificatesData = await certificatesRes.json();

        if (!libraryRes.ok) {
          throw new Error(libraryData.error || "Impossible de charger la bibliothèque");
        }

        if (!certificatesRes.ok) {
          throw new Error(certificatesData.error || "Impossible de charger les certificats");
        }

        setCourses(libraryData);
        setCertificates(certificatesData);
      } catch {
        setError("Impossible de charger la bibliothèque.");
      } finally {
        setPageLoading(false);
      }
    };

    fetchLibrary();
  }, [user, accessToken, loading, router]);

  const stats = useMemo(() => {
    const total = courses.length;
    const inProgress = courses.filter((course) => course.status === "in_progress").length;
    const completed = courses.filter((course) => course.status === "completed").length;

    const sortedByLastActivity = [...courses].sort((a, b) => {
      const aDate = a.last_opened_at ?? a.started_at ?? a.enrolled_at;
      const bDate = b.last_opened_at ?? b.started_at ?? b.enrolled_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const lastCourse =
      courses.find((course) => course.status === "in_progress") ||
      sortedByLastActivity[0] ||
      null;

    return {
      total,
      inProgress,
      completed,
      lastCourse,
    };
  }, [courses]);

  const certificatesBySlug = useMemo(() => {
    return certificates.reduce<Record<string, CertificateItem>>((acc, certificate) => {
      acc[certificate.course.slug] = certificate;
      return acc;
    }, {});
  }, [certificates]);

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

  const getActionLabel = (status: LibraryCourse["status"]) => {
    if (status === "completed") return "Voir la formation";
    if (status === "in_progress") return "Reprendre";
    return "Commencer";
  };

  const getActionClasses = (status: LibraryCourse["status"]) => {
    if (status === "completed") {
      return "bg-emerald-500 text-slate-950 hover:bg-emerald-400";
    }

    if (status === "in_progress") {
      return "bg-amber-500 text-slate-950 hover:bg-amber-400";
    }

    return "bg-cyan-500 text-slate-950 hover:bg-cyan-400";
  };

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">Chargement de la bibliothèque...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Espace apprenant
          </p>
          <h1 className="mb-4 text-3xl font-bold sm:text-4xl">Ma bibliothèque</h1>
          <p className="text-slate-300">
            Retrouvez ici vos formations achetées et accédez directement à leur contenu.
          </p>
        </div>

        {error && <p className="mb-6 text-rose-400">{error}</p>}

        {!error && (
          <div className="mb-10 grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Reprise rapide
              </p>
              <h2 className="mb-2 text-xl font-bold sm:text-2xl">
                {stats.lastCourse ? stats.lastCourse.title : "Aucune formation disponible"}
              </h2>
              <p className="mb-5 text-sm leading-7 text-slate-300">
                {stats.lastCourse
                  ? "Reprenez là où vous vous êtes arrêté."
                  : "Achetez une formation pour démarrer votre parcours."}
              </p>

              {stats.lastCourse ? (
                <Link
                  href={`/player/${stats.lastCourse.slug}`}
                  className="inline-flex w-full items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 sm:w-auto"
                >
                  Reprendre ma dernière formation
                </Link>
              ) : (
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-white transition hover:border-slate-500 sm:w-auto"
                >
                  Voir le catalogue
                </Link>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Total
              </p>
              <p className="text-4xl font-bold text-white">{stats.total}</p>
              <p className="mt-2 text-sm text-slate-400">Formation(s) acquise(s)</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                En cours
              </p>
              <p className="text-4xl font-bold text-white">{stats.inProgress}</p>
              <p className="mt-2 text-sm text-slate-400">À reprendre ou poursuivre</p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                Terminées
              </p>
              <p className="text-4xl font-bold text-white">{stats.completed}</p>
              <p className="mt-2 text-sm text-slate-400">Parcours finalisés</p>
            </div>
          </div>
        )}

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
            Aucune formation achetée pour le moment.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => {
              const certificate = certificatesBySlug[course.slug];
              const hasCertificate = course.status === "completed" && !!certificate?.file_url;

              return (
                <div
                  key={course.id}
                  className="flex min-h-[360px] flex-col rounded-2xl border border-cyan-500/20 bg-slate-900 p-5 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-1 hover:border-cyan-400/40 sm:p-6"
                >
                  <Link href={`/player/${course.slug}`} className="block">
                    <p className="mb-2 text-sm font-medium text-cyan-400">Formation acquise</p>
                    <h2 className="mb-3 text-xl font-semibold sm:text-2xl">{course.title}</h2>

                    <p className="mb-5 text-sm leading-7 text-slate-300 sm:hidden">
                      {truncateText(course.short_description || "Description à compléter.", 115)}
                    </p>

                    <p className="mb-5 hidden text-sm leading-7 text-slate-300 sm:block">
                      {course.short_description || "Description à compléter."}
                    </p>

                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      {getStatusBadge(course.status)}

                      {hasCertificate && (
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                          Certificat disponible
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="mt-auto flex flex-col gap-3">
                    <span className="text-sm text-slate-400">
                      {course.last_opened_at
                        ? "Dernière activité enregistrée"
                        : "Prêt à démarrer"}
                    </span>

                    <Link
                      href={`/player/${course.slug}`}
                      className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-center text-sm font-semibold transition sm:w-auto ${getActionClasses(
                        course.status
                      )}`}
                    >
                      {getActionLabel(course.status)}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}