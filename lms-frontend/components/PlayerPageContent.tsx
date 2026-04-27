"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import PlayerCourseContent from "@/components/PlayerCourseContent";

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

export default function PlayerPageContent() {
  const params = useParams();
  const slug = params.slug as string;

  const { user, accessToken, loading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<PlayerCourse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      if (loading) return;

      if (!user || !accessToken) {
        router.push("/connexion");
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const res = await fetch(`${baseUrl}/learning/my-library/${slug}/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Impossible de charger la formation");
        }

        setCourse(data);
      } catch {
        setError("Impossible de charger la formation apprenant.");
      } finally {
        setPageLoading(false);
      }
    };

    void fetchCourse();
  }, [slug, user, accessToken, loading, router]);

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">Chargement de la formation...</div>
      </main>
    );
  }

  if (error || !course) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl text-rose-400">
          {error || "Formation introuvable."}
        </div>
      </main>
    );
  }

  return <PlayerCourseContent course={course} />;
}