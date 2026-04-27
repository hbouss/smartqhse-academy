import Link from "next/link";
import BuyButton from "@/components/BuyButton";

type Lesson = {
  id: number;
  title: string;
  order: number;
  lesson_type: string;
  estimated_duration_min: number;
  is_free_preview: boolean;
};

type Module = {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
};

type CourseDetail = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  price_eur: string;
  thumbnail_url: string | null;
  level: string;
  category: string;
  instructor: string;
  estimated_duration_hours: number;
  is_featured: boolean;
  modules: Module[];
};

async function getCourse(slug: string): Promise<CourseDetail> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const res = await fetch(`${baseUrl}/catalog/courses/${slug}/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Impossible de charger la formation");
  }

  return res.json();
}

function splitLongParagraph(line: string): string[] {
  const cleaned = line.replace(/\s+/g, " ").trim();

  if (cleaned.length <= 180) {
    return [cleaned];
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [
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

  if (current.trim()) {
    chunks.push(current.trim());
  }

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
          <span className="mt-[10px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
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

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourse(slug);

  const fullDescription =
    course.description || course.short_description || "Description à compléter.";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-16">
        <Link
          href="/"
          className="mb-6 inline-flex text-sm font-medium text-cyan-400 transition hover:text-cyan-300"
        >
          ← Retour au catalogue
        </Link>

        <div className="mb-8 overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-900">
          <div className="aspect-[16/9] w-full bg-slate-800 md:aspect-[16/7]">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Image de couverture à venir
              </div>
            )}
          </div>

          <div className="p-5 md:p-8">
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 md:text-sm">
                {course.category}
              </span>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 md:text-sm">
                {course.level}
              </span>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 md:text-sm">
                {course.estimated_duration_hours} h
              </span>

              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 md:text-sm">
                {course.instructor}
              </span>

              {course.is_featured && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 md:text-sm">
                  Mise en avant
                </span>
              )}
            </div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400 md:text-sm">
              Formation
            </p>

            <h1 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">
              {course.title}
            </h1>

            <p className="mb-6 text-base leading-7 text-slate-300 md:text-lg">
              {course.short_description || "Description à compléter."}
            </p>

            <div className="mb-8 space-y-4">
              <details
                open
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5"
              >
                <summary className="cursor-pointer list-none text-base font-semibold text-white md:text-lg">
                  <div className="flex items-center justify-between gap-4">
                    <span>Description détaillée</span>
                    <span className="text-cyan-400">Ouvrir</span>
                  </div>
                </summary>

                <div className="mt-4 rounded-xl bg-slate-900/40 p-4 md:p-5">
                  <div className="space-y-4">
                    {renderRichText(fullDescription)}
                  </div>
                </div>
              </details>

              <details className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-white md:text-lg">
                  <div className="flex items-center justify-between gap-4">
                    <span>Programme de la formation</span>
                    <span className="text-cyan-400">{course.modules.length} module(s)</span>
                  </div>
                </summary>

                <div className="mt-4 space-y-4">
                  {course.modules.map((module) => (
                    <div
                      key={module.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5"
                    >
                      <h2 className="mb-4 text-lg font-semibold md:text-xl">
                        {module.order}. {module.title}
                      </h2>

                      <div className="space-y-3">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-white">
                                {lesson.order}. {lesson.title}
                              </p>
                              <p className="text-sm text-slate-400">
                                {lesson.lesson_type} • {lesson.estimated_duration_min} min
                              </p>
                            </div>

                            {lesson.is_free_preview && (
                              <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                Aperçu gratuit
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-cyan-500/20 bg-slate-950/80 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-400">Accès immédiat après achat</p>
                <span className="mt-1 block text-2xl font-bold text-white md:text-3xl">
                  {course.price_eur === "0.00" ? "Gratuit" : `${course.price_eur} €`}
                </span>
              </div>

              <div className="w-full sm:w-auto">
                <BuyButton courseId={course.id} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}