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

const PROMO_CODE = "ACADEMY10";

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

function getPromoPrice(price: string) {
  const amount = Number(price);
  if (!amount || amount <= 0) return null;
  return (amount * 0.9).toFixed(2);
}

function splitLongParagraph(line: string): string[] {
  const cleaned = line.replace(/\s+/g, " ").trim();

  if (cleaned.length <= 180) return [cleaned];

  const sentences =
    cleaned.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [
      cleaned,
    ];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;

    if (next.length > 160 && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = next;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

function parseContent(content: string) {
  const rawLines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  const items: Array<
    | { type: "title"; content: string }
    | { type: "bullet"; content: string }
    | { type: "paragraph"; content: string }
  > = [];

  rawLines.forEach((line) => {
    const isBullet = line.startsWith("-");
    const isShortTitle =
      !isBullet &&
      line.length <= 42 &&
      !line.includes(".") &&
      !line.includes(":") &&
      !line.includes(",") &&
      !line.includes(";");

    if (isShortTitle) {
      items.push({ type: "title", content: line });
      return;
    }

    if (isBullet) {
      items.push({
        type: "bullet",
        content: line.replace(/^-+\s*/, "").trim(),
      });
      return;
    }

    splitLongParagraph(line).forEach((chunk) => {
      items.push({ type: "paragraph", content: chunk });
    });
  });

  return items;
}

function renderRichText(content: string) {
  const parsed = parseContent(content);

  return parsed.map((item, index) => {
    if (item.type === "title") {
      return (
        <h3
          key={index}
          className="pt-2 text-base font-semibold leading-6 text-white md:pt-3 md:text-xl"
        >
          {item.content}
        </h3>
      );
    }

    if (item.type === "bullet") {
      return (
        <div key={index} className="flex items-start gap-3">
          <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
          <p className="text-[15px] leading-7 text-slate-300 md:text-base md:leading-8">
            {item.content}
          </p>
        </div>
      );
    }

    return (
      <p
        key={index}
        className="text-[15px] leading-7 text-slate-300 md:text-base md:leading-8"
      >
        {item.content}
      </p>
    );
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
  const promoPrice = getPromoPrice(bundle.price_eur);

  const fullDescription =
    bundle.description || bundle.short_description || "Description à compléter.";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-16">
        <Link
          href="/"
          className="mb-5 inline-flex text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
        >
          ← Retour au catalogue
        </Link>

        <div className="overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-900">
          <div className="aspect-[16/10] w-full bg-slate-800 sm:aspect-[16/9] md:aspect-[16/7]">
            {bundle.thumbnail_url ? (
              <img
                src={bundle.thumbnail_url}
                alt={bundle.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Image pack à venir
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5 md:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                Pack recommandé
              </span>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
                {bundle.courses.length} formation(s)
              </span>

              {bundle.is_featured && (
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">
                  Recommandé
                </span>
              )}

              {savings > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Économie de {savings.toFixed(2)} €
                </span>
              )}
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 md:text-sm">
              Pack de formations
            </p>

            <h1 className="mb-4 text-2xl font-bold leading-tight sm:text-3xl md:text-5xl">
              {bundle.title}
            </h1>

            <p className="mb-6 text-base leading-7 text-slate-300 md:text-lg">
              {bundle.short_description || "Description à compléter."}
            </p>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                ✅ Accès immédiat après achat
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
                ✅ Plusieurs formations incluses
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                ✅ Paiement sécurisé
              </div>
            </div>

            <div className="mb-8 space-y-4">
              <details className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white md:text-lg">
                        Description détaillée
                      </p>
                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        Appuyez ici pour afficher le détail du pack
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xl font-bold text-slate-950 transition group-open:rotate-180">
                      ↓
                    </div>
                  </div>
                </summary>

                <div className="mt-4 rounded-xl bg-slate-900/40 p-4 md:p-5">
                  <div className="space-y-4">{renderRichText(fullDescription)}</div>
                </div>
              </details>

              <details className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white md:text-lg">
                        Formations incluses
                      </p>
                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        {bundle.courses.length} formation(s) — appuyez pour voir le contenu
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xl font-bold text-slate-950 transition group-open:rotate-180">
                      ↓
                    </div>
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

                        <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-300">
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

                          <span className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-center text-sm font-semibold text-slate-950">
                            Voir la formation
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </details>

              <details className="group rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-white md:text-lg">
                        Résumé économique
                      </p>
                      <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                        Appuyez pour voir le détail du prix
                      </p>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-xl font-bold text-slate-950 transition group-open:rotate-180">
                      ↓
                    </div>
                  </div>
                </summary>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm text-slate-400">Prix séparé</p>
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

            <div id="achat" className="rounded-2xl border border-amber-500/20 bg-slate-950/80 p-4 sm:p-5">
              <div className="mb-5">
                <p className="text-sm text-slate-400">Offre de lancement</p>

                {savings > 0 && (
                  <span className="mt-1 block text-sm text-slate-400 line-through">
                    {totalCoursesPrice.toFixed(2)} €
                  </span>
                )}

                <span className="block text-2xl font-bold text-white md:text-3xl">
                  {promoPrice} € avec le code {PROMO_CODE}
                </span>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Utilisez le code promo au moment du paiement Stripe.
                </p>
              </div>

              <div className="w-full">
                <BundleBuyButton bundleId={bundle.id} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}