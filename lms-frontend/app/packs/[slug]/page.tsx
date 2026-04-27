import Link from "next/link";
import BundleBuyButton from "@/components/BundleBuyButton";

type BundleCourse = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  price_eur: string;
  thumbnail_url: string | null;
  level: string;
  category: string;
  instructor: string;
  estimated_duration_hours: number;
};

type BundleDetail = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  price_eur: string;
  thumbnail_url: string | null;
  is_featured: boolean;
  courses: BundleCourse[];
};

async function getBundle(slug: string): Promise<BundleDetail> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const res = await fetch(`${baseUrl}/catalog/bundles/${slug}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Impossible de charger le pack");
  }

  return res.json();
}

function renderRichText(content: string) {
  return content
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line, index) => {
      const isSectionTitle =
        !line.startsWith("-") &&
        line.length < 50 &&
        !line.includes(".");

      if (isSectionTitle) {
        return (
          <h3 key={index} className="pt-3 text-lg font-semibold text-white md:text-xl">
            {line}
          </h3>
        );
      }

      if (line.startsWith("-")) {
        return (
          <p key={index} className="pl-2 text-slate-300">
            {line}
          </p>
        );
      }

      return <p key={index}>{line}</p>;
    });
}

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const bundle = await getBundle(slug);

  const totalCoursesPrice = bundle.courses.reduce(
    (sum, course) => sum + Number(course.price_eur),
    0
  );

  const bundlePrice = Number(bundle.price_eur);
  const savings = totalCoursesPrice - bundlePrice;

  const fullDescription =
    bundle.description || bundle.short_description || "Description à compléter.";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-16">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
        >
          ← Retour au catalogue
        </Link>

        <div className="mb-8 overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900">
          <div className="flex min-h-[240px] w-full items-center justify-center bg-slate-950 md:min-h-[420px]">
            {bundle.thumbnail_url ? (
              <img
                src={bundle.thumbnail_url}
                alt={bundle.title}
                className="max-h-[520px] w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Image pack à venir
              </div>
            )}
          </div>

          <div className="p-5 md:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 md:text-sm">
                Pack recommandé
              </span>

              {bundle.is_featured && (
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 md:text-sm">
                  Mise en avant
                </span>
              )}

              {savings > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 md:text-sm">
                  Économie de {savings.toFixed(2)} €
                </span>
              )}
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400 md:text-sm">
              Pack
            </p>

            <h1 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">
              {bundle.title}
            </h1>

            <p className="mb-6 text-base leading-7 text-slate-300 md:text-lg">
              {bundle.short_description || "Description à compléter."}
            </p>

            <div className="mb-8 space-y-4">
              <details
                open
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-white md:text-lg">
                  <div className="flex items-center justify-between gap-4">
                    <span>Description détaillée</span>
                    <span className="text-cyan-400">+</span>
                  </div>
                </summary>

                <div className="mt-4 max-w-4xl space-y-4 text-sm leading-7 text-slate-300 md:text-base md:leading-8">
                  {renderRichText(fullDescription)}
                </div>
              </details>

              <details className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-white md:text-lg">
                  <div className="flex items-center justify-between gap-4">
                    <span>Formations incluses</span>
                    <span className="text-cyan-400">{bundle.courses.length} formation(s)</span>
                  </div>
                </summary>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {bundle.courses.map((course) => (
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

                      <div className="p-5">
                        <div className="mb-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                            {course.category}
                          </span>

                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                            {course.level}
                          </span>
                        </div>

                        <h3 className="mb-3 text-xl font-semibold text-white md:text-2xl">
                          {course.title}
                        </h3>

                        <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-300 md:line-clamp-none md:leading-7">
                          {course.short_description || "Description à compléter."}
                        </p>

                        <div className="mb-5 flex flex-wrap gap-4 text-sm text-slate-400">
                          <span>{course.estimated_duration_hours} h</span>
                          <span>{course.instructor}</span>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-lg font-bold text-white">
                            {course.price_eur} €
                          </span>

                          <span className="inline-flex items-center justify-center rounded-full bg-cyan-500/10 px-4 py-2 text-center text-sm font-medium text-cyan-300">
                            Voir la formation
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </details>

              <details className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-white md:text-lg">
                  <div className="flex items-center justify-between gap-4">
                    <span>Résumé économique</span>
                    <span className="text-cyan-400">Voir</span>
                  </div>
                </summary>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Prix des formations séparées</p>
                    <p className="mt-1 font-semibold text-white">
                      {totalCoursesPrice.toFixed(2)} €
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Prix du pack</p>
                    <p className="mt-1 font-semibold text-white">{bundle.price_eur} €</p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Économie</p>
                    <p className="mt-1 font-semibold text-emerald-300">
                      {savings > 0 ? `${savings.toFixed(2)} €` : "Aucune"}
                    </p>
                  </div>
                </div>
              </details>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-slate-950/80 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col">
                {savings > 0 && (
                  <span className="text-sm text-slate-500 line-through">
                    {totalCoursesPrice.toFixed(2)} €
                  </span>
                )}
                <span className="text-2xl font-bold text-white md:text-3xl">
                  {bundle.price_eur} €
                </span>
              </div>

              <div className="w-full sm:w-auto">
                <BundleBuyButton bundleId={bundle.id} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}