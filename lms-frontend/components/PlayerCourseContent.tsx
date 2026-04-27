"use client";

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type Lesson = {
  id: number;
  title: string;
  order: number;
  lesson_type: string;
  text_content: string;
  video_url: string;
  adapt_url: string;
  estimated_duration_min: number;
  is_free_preview: boolean;
  is_completed: boolean;
};

type Module = {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
};

type PlayerCourse = {
  id: number;
  title: string;
  slug: string;
  short_description: string;
  description: string;
  price_eur: string;
  modules: Module[];
  enrollment_status: "not_started" | "in_progress" | "completed";
  started_at: string | null;
  last_opened_at: string | null;
  completed_at: string | null;
  last_lesson_id: number | null;
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

type AdaptProgressPayload = {
  lesson_id: number;
  bookmark: string;
  state_json: Record<string, unknown>;
  updated_at: string | null;
};

type AdaptProgressMessage = {
  type: "ADAPT_PROGRESS";
  bookmark?: string;
  state?: Record<string, unknown>;
};

type AdaptReadyMessage = {
  type: "ADAPT_READY";
};

function splitLongParagraph(line: string): string[] {
  const cleaned = line.replace(/\s+/g, " ").trim();

  if (!cleaned) return [];

  const sentences =
    cleaned.match(/[^.!?]+[.!?]?/g)?.map((s) => s.trim()).filter(Boolean) || [cleaned];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = current ? `${current} ${sentence}` : sentence;

    if (next.length > 135 && current) {
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

function parseRichText(content: string) {
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
      !line.includes(";") &&
      !line.includes(",");

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
      items.push({
        type: "paragraph",
        content: chunk,
      });
    });
  });

  return items;
}

function RichTextBlock({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  const items = useMemo(() => parseRichText(content), [content]);

  if (!items.length) {
    return (
      <p className="text-[14px] leading-7 text-slate-300 md:text-[15px] md:leading-8">
        Contenu à compléter.
      </p>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {items.map((item, index) => {
        if (item.type === "title") {
          return (
            <h3
              key={index}
              className="pt-1 text-base font-semibold leading-6 text-white md:pt-2 md:text-lg"
            >
              {item.content}
            </h3>
          );
        }

        if (item.type === "bullet") {
          return (
            <div key={index} className="flex items-start gap-3">
              <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
              <p className="text-[14px] leading-7 text-slate-300 md:text-[15px] md:leading-8">
                {item.content}
              </p>
            </div>
          );
        }

        return (
          <p
            key={index}
            className="text-[14px] leading-7 text-slate-300 md:text-[15px] md:leading-8"
          >
            {item.content}
          </p>
        );
      })}
    </div>
  );
}

function MobileAccordionItem({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
      >
        <span className="text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
          {title}
        </span>
        <span className="text-lg font-semibold text-white">{open ? "−" : "+"}</span>
      </button>

      {open && <div className="px-4 pb-4 text-sm leading-7 text-slate-300">{children}</div>}
    </div>
  );
}

export default function PlayerCourseContent({ course }: { course: PlayerCourse }) {
  const allLessons = useMemo(
    () => course.modules.flatMap((module) => module.lessons),
    [course.modules]
  );

  const initialLesson =
    allLessons.find((lesson) => lesson.id === course.last_lesson_id) || allLessons[0] || null;

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(initialLesson);
  const [completedLessonIds, setCompletedLessonIds] = useState<number[]>(
    allLessons.filter((lesson) => lesson.is_completed).map((lesson) => lesson.id)
  );
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [courseStatus, setCourseStatus] = useState(course.enrollment_status);
  const [courseCompleteLoading, setCourseCompleteLoading] = useState(false);

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [certificateLoading, setCertificateLoading] = useState(true);

  const [adaptProgress, setAdaptProgress] = useState<AdaptProgressPayload | null>(null);
  const [adaptProgressLoading, setAdaptProgressLoading] = useState(false);
  const [adaptFrameReady, setAdaptFrameReady] = useState(false);

  const { user, accessToken } = useAuth();

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestAdaptProgressRef = useRef<AdaptProgressPayload | null>(null);

  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "";

  const adaptLessons = allLessons.filter((lesson) => lesson.lesson_type === "adapt");
  const nonAdaptLessons = allLessons.filter((lesson) => lesson.lesson_type !== "adapt");

  const isAdaptFocusedCourse =
    adaptLessons.length === 1 &&
    (allLessons.length === 1 || (allLessons.length === 2 && nonAdaptLessons.length === 1));

  const isAdaptSelected = selectedLesson?.lesson_type === "adapt";
  const canUseFocusMode = isAdaptFocusedCourse && isAdaptSelected;

  const resolvedAdaptUrl = useMemo(() => {
    if (!selectedLesson?.adapt_url) return "";

    const rawUrl = selectedLesson.adapt_url.trim();
    const backendBase = backendBaseUrl.replace(/\/$/, "");

    if (!backendBase) {
      return rawUrl;
    }

    if (
      rawUrl.startsWith("http://127.0.0.1") ||
      rawUrl.startsWith("https://127.0.0.1") ||
      rawUrl.startsWith("http://localhost") ||
      rawUrl.startsWith("https://localhost")
    ) {
      try {
        const parsed = new URL(rawUrl);
        return `${backendBase}${parsed.pathname}${parsed.search}${parsed.hash}`;
      } catch {
        return rawUrl;
      }
    }

    if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
      return rawUrl;
    }

    return `${backendBase}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
  }, [selectedLesson?.adapt_url, backendBaseUrl]);

  const adaptOrigin = useMemo(() => {
    if (!resolvedAdaptUrl) return "";
    try {
      return new URL(resolvedAdaptUrl).origin;
    } catch {
      return "";
    }
  }, [resolvedAdaptUrl]);

  const currentCertificate = useMemo(() => {
    return certificates.find((certificate) => certificate.course.slug === course.slug) || null;
  }, [certificates, course.slug]);

  useEffect(() => {
    latestAdaptProgressRef.current = adaptProgress;
  }, [adaptProgress]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (canUseFocusMode && !isMobile) {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
  }, [canUseFocusMode, selectedLesson?.id, isMobile]);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        if (!accessToken) {
          setCertificates([]);
          return;
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${baseUrl}/learning/my-certificates/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Impossible de charger les certificats");
        }

        setCertificates(data);
      } catch (error) {
        console.error("Erreur chargement certificats :", error);
        setCertificates([]);
      } finally {
        setCertificateLoading(false);
      }
    };

    void fetchCertificates();
  }, [accessToken]);

  useEffect(() => {
    setAdaptFrameReady(false);

    const fetchAdaptProgress = async () => {
      if (!selectedLesson || selectedLesson.lesson_type !== "adapt" || !accessToken) {
        setAdaptProgress(null);
        return;
      }

      try {
        setAdaptProgressLoading(true);

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(`${baseUrl}/learning/adapt-progress/${selectedLesson.id}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Impossible de charger la progression Adapt");
        }

        setAdaptProgress(data);
      } catch (error) {
        console.error("Erreur chargement progression Adapt :", error);
        setAdaptProgress(null);
      } finally {
        setAdaptProgressLoading(false);
      }
    };

    void fetchAdaptProgress();
  }, [selectedLesson, accessToken]);

  const postRestoreToIframe = useCallback(() => {
    if (!iframeRef.current?.contentWindow || !selectedLesson || selectedLesson.lesson_type !== "adapt") {
      return;
    }

    const progress = latestAdaptProgressRef.current;

    iframeRef.current.contentWindow.postMessage(
      {
        type: "ADAPT_RESTORE",
        payload: {
          bookmark: progress?.bookmark || "",
          state: progress?.state_json || {},
        },
      },
      "*"
    );
  }, [selectedLesson]);

  const saveAdaptProgress = useCallback(
    async (bookmark: string, state: Record<string, unknown> = {}) => {
      if (!selectedLesson || selectedLesson.lesson_type !== "adapt" || !accessToken) return;

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        await fetch(`${baseUrl}/learning/adapt-progress/save/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            lesson_id: selectedLesson.id,
            course_slug: course.slug,
            bookmark,
            state_json: state,
          }),
        });
      } catch (error) {
        console.error("Erreur sauvegarde progression Adapt :", error);
      }
    },
    [selectedLesson, accessToken, course.slug]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent<AdaptProgressMessage | AdaptReadyMessage>) => {
      if (!selectedLesson || selectedLesson.lesson_type !== "adapt") return;
      if (!resolvedAdaptUrl || !adaptOrigin) return;
      if (event.origin !== adaptOrigin) return;

      if (event.data?.type === "ADAPT_READY") {
        setAdaptFrameReady(true);

        setTimeout(() => {
          postRestoreToIframe();
        }, 400);

        return;
      }

      if (event.data?.type === "ADAPT_PROGRESS") {
        const bookmark = event.data.bookmark || "";
        const state = event.data.state || {};

        setAdaptProgress({
          lesson_id: selectedLesson.id,
          bookmark,
          state_json: state,
          updated_at: new Date().toISOString(),
        });

        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(() => {
          void saveAdaptProgress(bookmark, state);
        }, 1200);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [selectedLesson, resolvedAdaptUrl, adaptOrigin, postRestoreToIframe, saveAdaptProgress]);

  const markComplete = async () => {
    if (!selectedLesson) return;

    try {
      setLoading(true);

      if (!user || !accessToken) {
        throw new Error("Utilisateur non connecté");
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/learning/lessons/${selectedLesson.id}/complete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Impossible de marquer la leçon comme terminée");
      }

      if (!completedLessonIds.includes(selectedLesson.id)) {
        setCompletedLessonIds((prev) => [...prev, selectedLesson.id]);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour de la progression.");
    } finally {
      setLoading(false);
    }
  };

  const refreshCertificates = async () => {
    try {
      if (!accessToken) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/learning/my-certificates/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de recharger les certificats");
      }

      setCertificates(data);
    } catch (error) {
      console.error("Erreur refresh certificats :", error);
    }
  };

  const markCourseComplete = async () => {
    try {
      setCourseCompleteLoading(true);

      if (!accessToken) {
        throw new Error("Utilisateur non connecté");
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${baseUrl}/learning/courses/${course.slug}/complete/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Impossible de terminer la formation");
      }

      setCourseStatus("completed");
      await refreshCertificates();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la mise à jour du statut de formation.");
    } finally {
      setCourseCompleteLoading(false);
    }
  };

  const saveLastOpenedLesson = async (lessonId: number) => {
    try {
      if (!accessToken) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      await fetch(`${baseUrl}/learning/courses/${course.slug}/last-lesson/${lessonId}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error("Erreur sauvegarde dernière leçon :", error);
    }
  };

  useEffect(() => {
    if (selectedLesson?.id) {
      void saveLastOpenedLesson(selectedLesson.id);
    }
  }, [selectedLesson?.id]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-[1760px] px-4 py-6 md:px-6 md:py-10">
        <div className="mb-6 md:mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            Espace apprenant
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">{course.title}</h1>
        </div>

        {isMobile && (
          <div className="mb-6 space-y-3">
            <MobileAccordionItem title="Aperçu">
              <RichTextBlock content={course.short_description || "Aucun aperçu disponible."} compact />
            </MobileAccordionItem>

            <MobileAccordionItem title="Description">
              <RichTextBlock content={course.description || "Description à compléter."} compact />
            </MobileAccordionItem>

            <MobileAccordionItem title="Programme">
              <div className="space-y-3">
                {course.modules.map((module) => (
                  <div key={module.id}>
                    <p className="font-semibold text-white">
                      {module.order}. {module.title}
                    </p>
                    <ul className="mt-2 space-y-1 text-slate-300">
                      {module.lessons.map((lesson) => (
                        <li key={lesson.id}>
                          {lesson.order}. {lesson.title} — {lesson.lesson_type} •{" "}
                          {lesson.estimated_duration_min} min
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </MobileAccordionItem>
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          {canUseFocusMode && !isMobile && (
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="rounded-full border border-cyan-500/30 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
              {sidebarOpen ? "Masquer le plan" : "Afficher le plan"}
            </button>
          )}

          {isAdaptSelected && resolvedAdaptUrl && (
            <a
              href={resolvedAdaptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-slate-500"
            >
              {isMobile ? "Ouvrir le module" : "Ouvrir en plein onglet"}
            </a>
          )}

          {isAdaptSelected && !adaptProgressLoading && adaptProgress?.bookmark && (
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              Reprise disponible
            </span>
          )}

          {isAdaptSelected && adaptFrameReady && (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Module synchronisé
            </span>
          )}
        </div>

        <div
          className={`grid gap-6 ${
            sidebarOpen && !isMobile
              ? "lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]"
              : "grid-cols-1"
          }`}
        >
          {sidebarOpen && (
            <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-5 lg:sticky lg:top-6 lg:self-start">
              <h2 className="mb-5 text-xl font-semibold">Contenu de la formation</h2>

              <div className="mt-3">
                {courseStatus === "completed" && (
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                    Formation terminée
                  </span>
                )}

                {courseStatus === "in_progress" && (
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-300">
                    Formation en cours
                  </span>
                )}

                {courseStatus === "not_started" && (
                  <span className="rounded-full bg-slate-700/60 px-3 py-1 text-sm font-semibold text-slate-200">
                    Formation non commencée
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-5">
                {course.modules.map((module) => (
                  <div key={module.id}>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-400">
                      {module.order}. {module.title}
                    </h3>

                    <div className="space-y-2">
                      {module.lessons.map((lesson) => {
                        const isCompleted = completedLessonIds.includes(lesson.id);
                        const isActive = selectedLesson?.id === lesson.id;

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                              isActive
                                ? "border-cyan-400 bg-cyan-500/10"
                                : "border-slate-800 bg-slate-950 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-white">
                                  {lesson.order}. {lesson.title}
                                </p>
                                <p className="text-sm text-slate-400">
                                  {lesson.lesson_type} • {lesson.estimated_duration_min} min
                                </p>
                              </div>

                              {isCompleted && (
                                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
                                  Terminé
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 md:p-8">
            {selectedLesson ? (
              <>
                {courseStatus === "completed" && currentCertificate?.file_url && (
                  <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-slate-950 px-5 py-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
                      Certificat disponible
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Votre formation est terminée. Vous pouvez maintenant télécharger votre certificat.
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <a
                        href={currentCertificate.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                      >
                        Télécharger mon certificat PDF
                      </a>

                      <span className="text-xs text-slate-400">
                        {currentCertificate.certificate_number}
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className={canUseFocusMode && !isMobile ? "max-w-6xl" : ""}>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                      Leçon
                    </p>
                    <h2
                      className={`font-bold leading-tight ${
                        canUseFocusMode && !isMobile
                          ? "text-3xl md:text-5xl"
                          : "text-2xl md:text-3xl"
                      }`}
                    >
                      {selectedLesson.title}
                    </h2>
                  </div>

                  <button
                    onClick={markComplete}
                    disabled={loading}
                    className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
                  >
                    {loading ? "Mise à jour..." : "Marquer comme terminée"}
                  </button>
                </div>

                {selectedLesson.lesson_type === "text" && (
                  <div className="max-w-4xl">
                    <RichTextBlock content={selectedLesson.text_content || "Contenu texte à compléter."} />
                  </div>
                )}

                {selectedLesson.lesson_type === "video" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                        Leçon vidéo
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Visionnez la vidéo directement dans le player.
                      </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-black">
                      {selectedLesson.video_url ? (
                        <video controls className="h-auto w-full" src={selectedLesson.video_url} />
                      ) : (
                        <div className="p-6 text-slate-300">Vidéo à brancher.</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedLesson.lesson_type === "adapt" && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-5 py-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                          Module interactif Adapt
                        </p>
                        <p className="mt-1 text-sm text-slate-300">
                          {isMobile
                            ? "Sur mobile, le module s’ouvre de manière plus confortable dans un nouvel onglet."
                            : "La progression interne du module est maintenant sauvegardée automatiquement."}
                        </p>
                      </div>

                      {resolvedAdaptUrl && (
                        <a
                          href={resolvedAdaptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-full border border-cyan-500/30 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
                        >
                          Ouvrir le module
                        </a>
                      )}
                    </div>

                    {isMobile ? (
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <p className="mb-4 text-sm leading-7 text-slate-300">
                          Pour une meilleure lisibilité sur iPhone, le module interactif s’ouvre
                          dans un nouvel onglet. Une fois terminé, revenez ici pour finaliser votre
                          progression.
                        </p>

                        {resolvedAdaptUrl && (
                          <a
                            href={resolvedAdaptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                          >
                            Ouvrir le module interactif
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                        {resolvedAdaptUrl ? (
                          <iframe
                            ref={iframeRef}
                            src={resolvedAdaptUrl}
                            title={selectedLesson.title}
                            className={`w-full bg-slate-950 ${
                              sidebarOpen
                                ? "h-[950px] md:h-[1100px] xl:h-[1250px]"
                                : "h-[1100px] md:h-[1300px] xl:h-[1500px]"
                            }`}
                            allow="fullscreen; autoplay"
                            allowFullScreen
                          />
                        ) : (
                          <div className="p-6 text-slate-300">Module Adapt à brancher.</div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={markCourseComplete}
                        disabled={courseCompleteLoading || courseStatus === "completed"}
                        className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {courseStatus === "completed"
                          ? "Formation terminée"
                          : courseCompleteLoading
                          ? "Mise à jour..."
                          : "Marquer la formation comme terminée"}
                      </button>
                    </div>

                    {courseStatus === "completed" &&
                      !certificateLoading &&
                      !currentCertificate && (
                        <div className="rounded-2xl border border-amber-500/20 bg-slate-950 px-5 py-4">
                          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                            Certificat en préparation
                          </p>
                          <p className="mt-2 text-sm text-slate-300">
                            Votre formation est terminée. Rechargez la page dans quelques instants
                            si le certificat n’apparaît pas encore.
                          </p>
                        </div>
                      )}
                  </div>
                )}
              </>
            ) : (
              <p>Aucune leçon disponible.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}