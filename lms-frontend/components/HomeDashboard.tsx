"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type Course = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  price_eur: string;
  is_published: boolean;
  thumbnail_url: string | null;
  level: string;
  category: string;
  instructor: string;
  estimated_duration_hours: number;
  is_featured: boolean;
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

type Bundle = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  price_eur: string;
  thumbnail_url: string | null;
  is_featured: boolean;
  is_published: boolean;
  courses: {
    id: number;
    title: string;
    slug: string;
  }[];
};

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeout = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

function truncateText(text: string, maxLength = 120) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export default function HomeDashboard() {
  const { user, accessToken, loading } = useAuth();

  const [catalogCourses, setCatalogCourses] = useState<Course[]>([]);
  const [libraryCourses, setLibraryCourses] = useState<LibraryCourse[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (loading) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!baseUrl) {
        setPageError("Configuration API introuvable.");
        setPageLoading(false);
        return;
      }

      setPageError("");
      setPageLoading(true);

      try {
        const [catalogRes, bundlesRes] = await Promise.allSettled([
          fetchWithTimeout(`${baseUrl}/catalog/courses/`),
          fetchWithTimeout(`${baseUrl}/catalog/bundles/`),
        ]);

        if (catalogRes.status === "fulfilled" && catalogRes.value.ok) {
          const catalogData = (await catalogRes.value.json()) as Course[];
          setCatalogCourses(catalogData);
        } else {
          setCatalogCourses([]);
          console.error("Erreur chargement catalog/courses");
        }

        if (bundlesRes.status === "fulfilled" && bundlesRes.value.ok) {
          const bundlesData = (await bundlesRes.value.json()) as Bundle[];
          setBundles(bundlesData);
        } else {
          setBundles([]);
          console.error("Erreur chargement catalog/bundles");
        }

        if (user && accessToken) {
          try {
            const libraryRes = await fetchWithTimeout(`${baseUrl}/learning/my-library/`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            });

            if (libraryRes.ok) {
              const libraryData = (await libraryRes.json()) as LibraryCourse[];
              setLibraryCourses(libraryData);
            } else {
              setLibraryCourses([]);
            }
          } catch (error) {
            console.error("Erreur chargement bibliothèque :", error);
            setLibraryCourses([]);
          }
        } else {
          setLibraryCourses([]);
        }
      } catch (error) {
        console.error("Erreur chargement home :", error);
        setPageError("Certaines données n'ont pas pu être chargées.");
      } finally {
        setPageLoading(false);
      }
    };

    void fetchData();
  }, [user, accessToken, loading]);

  const stats = useMemo(() => {
    const total = libraryCourses.length;
    const inProgress = libraryCourses.filter(
      (course) => course.status === "in_progress"
    ).length;
    const completed = libraryCourses.filter(
      (course) => course.status === "completed"
    ).length;

    const sortedByLastActivity = [...libraryCourses].sort((a, b) => {
      const aDate = a.last_opened_at ?? a.started_at ?? a.enrolled_at;
      const bDate = b.last_opened_at ?? b.started_at ?? b.enrolled_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const lastCourse =
      libraryCourses.find((course) => course.status === "in_progress") ||
      sortedByLastActivity[0] ||
      null;

    return {
      total,
      inProgress,
      completed,
      lastCourse,
    };
  }, [libraryCourses]);

  const recommendedCourses = catalogCourses.filter(
    (course) => !libraryCourses.some((owned) => owned.id === course.id)
  );

  const visitorFoundationCourses = useMemo(() => {
    return catalogCourses.filter(
      (course) =>
        course.title.toLowerCase().includes("fondamentaux") ||
        course.category?.toLowerCase().includes("ia & qhse") ||
        course.category?.toLowerCase().includes("socle")
    );
  }, [catalogCourses]);

  const visitorSpecializationCourses = useMemo(() => {
    return catalogCourses.filter(
      (course) =>
        !(
          course.title.toLowerCase().includes("fondamentaux") ||
          course.category?.toLowerCase().includes("ia & qhse") ||
          course.category?.toLowerCase().includes("socle")
        )
    );
  }, [catalogCourses]);

  const foundationCourses = useMemo(() => {
    return recommendedCourses.filter(
      (course) =>
        course.title.toLowerCase().includes("fondamentaux") ||
        course.category?.toLowerCase().includes("ia & qhse") ||
        course.category?.toLowerCase().includes("socle")
    );
  }, [recommendedCourses]);

  const specializationCourses = useMemo(() => {
    return recommendedCourses.filter(
      (course) =>
        !(
          course.title.toLowerCase().includes("fondamentaux") ||
          course.category?.toLowerCase().includes("ia & qhse") ||
          course.category?.toLowerCase().includes("socle")
        )
    );
  }, [recommendedCourses]);

  const formatBundleCourses = (bundle: Bundle) => {
    return bundle.courses.map((course) => course.title).join(" + ");
  };

  const renderCourseGrid = (courses: Course[]) => {
    if (courses.length === 0) {
      return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
          Aucun parcours disponible dans cette rubrique pour le moment.
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/formations/${course.slug}`}
            className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-1 hover:border-cyan-400/40"
          >
            <div className="aspect-[16/9] w-full bg-slate-800">
              {course.thumbnail_url ? (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Visuel à venir
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {course.category}
                </span>

                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                  {course.level}
                </span>

                {course.is_featured && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                    Mise en avant
                  </span>
                )}
              </div>

              <h2 className="mb-3 text-2xl font-semibold text-white">
                {course.title}
              </h2>

              <p className="mb-4 text-sm leading-7 text-slate-300 sm:hidden">
                {truncateText(course.short_description || "Description à compléter.", 110)}
              </p>

              <p className="mb-4 hidden text-sm leading-7 text-slate-300 sm:block">
                {course.short_description || "Description à compléter."}
              </p>

              <div className="mb-5 flex flex-wrap gap-4 text-sm text-slate-400">
                <span>{course.estimated_duration_hours} h</span>
                <span>{course.instructor}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold text-white">
                  {course.price_eur === "0.00" ? "Gratuit" : `${course.price_eur} €`}
                </span>

                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-medium text-cyan-300">
                  Voir la formation
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  const renderBundleGrid = () => {
    if (bundles.length === 0) {
      return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
          Aucun pack publié pour le moment.
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2">
        {bundles.map((bundle) => (
          <Link
            key={bundle.id}
            href={`/packs/${bundle.slug}`}
            className="overflow-hidden rounded-2xl border border-amber-500/20 bg-slate-900 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-1 hover:border-amber-400/40"
          >
            <div className="aspect-[16/9] w-full bg-slate-800">
              {bundle.thumbnail_url ? (
                <img
                  src={bundle.thumbnail_url}
                  alt={bundle.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  Visuel pack à venir
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  Pack recommandé
                </span>

                {bundle.is_featured && (
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                    Mise en avant
                  </span>
                )}
              </div>

              <h2 className="mb-3 text-2xl font-semibold text-white">
                {bundle.title}
              </h2>

              <p className="mb-4 text-sm leading-7 text-slate-300 sm:hidden">
                {truncateText(bundle.short_description || "Pack à découvrir.", 110)}
              </p>

              <p className="mb-4 hidden text-sm leading-7 text-slate-300 sm:block">
                {bundle.short_description || "Pack à découvrir."}
              </p>

              <div className="mb-5 text-sm text-slate-400">
                {formatBundleCourses(bundle)}
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-lg font-bold text-white">
                  {bundle.price_eur} €
                </span>

                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium text-amber-300">
                  Voir le pack
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">Chargement du dashboard...</div>
      </main>
    );
  }

  if (pageError && !catalogCourses.length && !bundles.length) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl rounded-2xl border border-rose-500/20 bg-slate-900 p-8 text-rose-300">
          {pageError}
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-12 max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              SmartQHSE Academy
            </p>

            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
              Plateforme premium de formation QHSE, IA et automatisation
            </h1>

            <p className="text-lg text-slate-300">
              La plateforme premium pour se former au QHSE, à l’intelligence artificielle
              et à l’automatisation des audits, actions et processus de pilotage.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/connexion"
                className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Se connecter
              </Link>

              <Link
                href="/inscription"
                className="rounded-full border border-cyan-500/30 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
              >
                Créer un compte
              </Link>
            </div>
          </div>

          {pageError && (
            <div className="mb-8 rounded-2xl border border-amber-500/20 bg-slate-900 p-6 text-amber-300">
              Certaines données nont pas pu être chargées, mais le catalogue reste accessible.
            </div>
          )}

          <div className="mb-16">
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Socle & fondamentaux
              </p>
              <h2 className="text-3xl font-bold">
                Commencez par la base indispensable
              </h2>
            </div>
            {renderCourseGrid(visitorFoundationCourses)}
          </div>

          <div className="mb-16">
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Formations spécialisées
              </p>
              <h2 className="text-3xl font-bold">
                Approfondissez avec des parcours opérationnels
              </h2>
            </div>
            {renderCourseGrid(visitorSpecializationCourses)}
          </div>

          <div className="mt-16">
            <div className="mb-6">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                Packs recommandés
              </p>
              <h2 className="text-3xl font-bold">
                Des parcours combinés pour aller plus vite
              </h2>
            </div>
            {renderBundleGrid()}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Dashboard apprenant
          </p>
          <h1 className="mb-4 text-4xl font-bold">
            Bonjour {user.username || user.email}
          </h1>
          <p className="max-w-3xl text-slate-300">
            Retrouvez vos formations, reprenez votre progression et accédez
            rapidement à votre bibliothèque.
          </p>
        </div>

        {pageError && (
          <div className="mb-8 rounded-2xl border border-amber-500/20 bg-slate-900 p-6 text-amber-300">
            Certaines données secondaires ont pas pu être chargées.
          </div>
        )}

        <div className="mb-10 grid gap-5 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="rounded-3xl border border-cyan-500/20 bg-slate-900 p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Reprise rapide
            </p>
            <h2 className="mb-2 text-2xl font-bold">
              {stats.lastCourse
                ? stats.lastCourse.title
                : "Aucune formation en cours"}
            </h2>
            <p className="mb-5 text-sm leading-7 text-slate-300">
              {stats.lastCourse
                ? "Reprenez directement votre dernière formation."
                : "Commencez votre premier parcours depuis le catalogue."}
            </p>

            {stats.lastCourse ? (
              <Link
                href={`/player/${stats.lastCourse.slug}`}
                className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                Reprendre ma dernière formation
              </Link>
            ) : (
              <Link
                href="/bibliotheque"
                className="inline-flex rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
              >
                Voir ma bibliothèque
              </Link>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Total
            </p>
            <p className="text-4xl font-bold text-white">{stats.total}</p>
            <p className="mt-2 text-sm text-slate-400">
              Formation(s) acquise(s)
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
              En cours
            </p>
            <p className="text-4xl font-bold text-white">{stats.inProgress}</p>
            <p className="mt-2 text-sm text-slate-400">À reprendre</p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Terminées
            </p>
            <p className="text-4xl font-bold text-white">{stats.completed}</p>
            <p className="mt-2 text-sm text-slate-400">Parcours finalisés</p>
          </div>
        </div>

        <div className="mb-12 flex flex-wrap gap-4">
          <Link
            href="/bibliotheque"
            className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Accéder à ma bibliothèque
          </Link>

          <Link
            href="/"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-slate-500"
          >
            Explorer le catalogue
          </Link>
        </div>

        <div className="mb-16">
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Socle & fondamentaux
            </p>
            <h2 className="text-3xl font-bold">La base stratégique</h2>
          </div>
          {renderCourseGrid(foundationCourses)}
        </div>

        <div className="mb-16">
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Formations spécialisées
            </p>
            <h2 className="text-3xl font-bold">À découvrir</h2>
          </div>
          {renderCourseGrid(specializationCourses)}
        </div>

        <div className="mt-16">
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Packs recommandés
            </p>
            <h2 className="text-3xl font-bold">
              Combinez stratégie et spécialisation
            </h2>
          </div>
          {renderBundleGrid()}
        </div>
      </section>
    </main>
  );
}