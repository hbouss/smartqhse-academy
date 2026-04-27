"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

type DashboardStats = {
  selected_period?: string;
  kpis?: {
    total_users?: number;
    total_students?: number;
    total_paid_orders?: number;
    total_course_orders?: number;
    total_bundle_orders?: number;
    total_certificates?: number;
    total_enrollments?: number;
    completed_enrollments?: number;
    completion_rate?: number;
    revenue_total?: number;
    conversion_rate?: number;
    average_order_value?: number;
    revenue_course_total?: number;
    revenue_bundle_total?: number;
  };
  top_courses?: {
    id: number;
    title: string;
    slug: string;
    total_sales: number;
  }[];
  most_opened_courses?: {
    id: number;
    title: string;
    slug: string;
    total_opens: number;
  }[];
  most_completed_courses?: {
    id: number;
    title: string;
    slug: string;
    total_completed: number;
  }[];
  monthly_sales?: {
    month: string;
    total_sales: number;
    revenue: number;
  }[];
};

type ViewMode = "quick" | "detailed";
type PeriodMode = "30d" | "90d" | "12m" | "all";

function shortLabel(label: string, max = 28) {
  if (label.length <= max) return label;
  return `${label.slice(0, max)}…`;
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function AdminDashboardContent() {
  const { user, accessToken, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<DashboardStats | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("quick");
  const [period, setPeriod] = useState<PeriodMode>("all");

  useEffect(() => {
    const fetchStats = async () => {
      if (loading) return;

      if (!user || !accessToken) {
        router.push("/connexion");
        return;
      }

      if (!user.is_staff) {
        router.push("/");
        return;
      }

      try {
        setPageLoading(true);
        setError("");

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const res = await fetch(
          `${baseUrl}/analytics/admin-dashboard/?period=${period}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        const json = (await res.json()) as DashboardStats;

        if (!res.ok) {
          throw new Error("Impossible de charger le dashboard admin.");
        }

        setData(json);
      } catch {
        setError("Impossible de charger le dashboard admin.");
      } finally {
        setPageLoading(false);
      }
    };

    void fetchStats();
  }, [user, accessToken, loading, router, period]);

  const kpis = data?.kpis ?? {};

  const salesChartData = useMemo(() => {
    const items = data?.monthly_sales ?? [];
    return items.map((item) => ({
      ...item,
      monthLabel: item.month,
    }));
  }, [data?.monthly_sales]);

  const topSalesChartData = useMemo(() => {
    const items = data?.top_courses ?? [];
    return items.map((item) => ({
      ...item,
      shortTitle: shortLabel(item.title, 26),
    }));
  }, [data?.top_courses]);

  const openedChartData = useMemo(() => {
    const items = data?.most_opened_courses ?? [];
    return items.map((item) => ({
      ...item,
      shortTitle: shortLabel(item.title, 24),
    }));
  }, [data?.most_opened_courses]);

  const completedChartData = useMemo(() => {
    const items = data?.most_completed_courses ?? [];
    return items.map((item) => ({
      ...item,
      shortTitle: shortLabel(item.title, 24),
    }));
  }, [data?.most_completed_courses]);

  const topCourses = data?.top_courses ?? [];

  const renderKpiCard = (
    label: string,
    value: string | number,
    helper: string,
    tone: "default" | "cyan" | "emerald" | "amber" = "default"
  ) => {
    const toneClass =
      tone === "cyan"
        ? "text-cyan-400"
        : tone === "emerald"
        ? "text-emerald-400"
        : tone === "amber"
        ? "text-amber-400"
        : "text-slate-400";

    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
        <p className={`mb-2 text-sm font-semibold uppercase tracking-[0.2em] ${toneClass}`}>
          {label}
        </p>
        <p className="text-4xl font-bold text-white">{value}</p>
        <p className="mt-2 text-sm text-slate-400">{helper}</p>
      </div>
    );
  };

  const renderPeriodButton = (value: PeriodMode, label: string) => (
    <button
      onClick={() => setPeriod(value)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        period === value
          ? "bg-cyan-500 text-slate-950"
          : "border border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  if (loading || pageLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-20 text-white">
        <div className="mx-auto max-w-7xl">Chargement du dashboard admin...</div>
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
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Pilotage plateforme
            </p>
            <h1 className="mb-4 text-4xl font-bold">Dashboard admin premium</h1>
            <p className="max-w-3xl text-slate-300">
              Vue rapide pour décider immédiatement, vue détaillée pour analyser les ventes,
              le chiffre d’affaires, la conversion, l’engagement et la complétion.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="inline-flex rounded-full border border-slate-800 bg-slate-900 p-1">
              <button
                onClick={() => setViewMode("quick")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "quick"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Vue rapide
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  viewMode === "detailed"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                Vue détaillée
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {renderPeriodButton("30d", "30 jours")}
              {renderPeriodButton("90d", "90 jours")}
              {renderPeriodButton("12m", "12 mois")}
              {renderPeriodButton("all", "Depuis le début")}
            </div>
          </div>
        </div>

        {viewMode === "quick" && (
          <>
            <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-6">
              {renderKpiCard("Inscriptions", kpis.total_users ?? 0, "Comptes créés")}
              {renderKpiCard("Achats", kpis.total_paid_orders ?? 0, "Commandes payées", "cyan")}
              {renderKpiCard(
                "CA total",
                formatEuro(kpis.revenue_total ?? 0),
                "Chiffre d’affaires",
                "cyan"
              )}
              {renderKpiCard(
                "Panier moyen",
                formatEuro(kpis.average_order_value ?? 0),
                "Valeur moyenne / commande",
                "cyan"
              )}
              {renderKpiCard(
                "Conversion",
                `${kpis.conversion_rate ?? 0}%`,
                "Achats / comptes créés",
                "amber"
              )}
              {renderKpiCard(
                "Complétion",
                `${kpis.completion_rate ?? 0}%`,
                "Taux global",
                "emerald"
              )}
            </div>

            <div className="grid gap-10 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
                <div className="mb-6">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Tendance business
                  </p>
                  <h2 className="text-3xl font-bold">Ventes mensuelles</h2>
                </div>

                {salesChartData.length === 0 ? (
                  <p className="text-slate-300">Aucune donnée mensuelle disponible.</p>
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesChartData}>
                        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                        <XAxis dataKey="monthLabel" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: "#020617",
                            border: "1px solid #1e293b",
                            borderRadius: 16,
                            color: "#fff",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="total_sales"
                          name="Ventes"
                          stroke="#22d3ee"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
                <div className="mb-6">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Top ventes
                  </p>
                  <h2 className="text-3xl font-bold">Formations les plus vendues</h2>
                </div>

                {topSalesChartData.length === 0 ? (
                  <p className="text-slate-300">Aucune donnée disponible.</p>
                ) : (
                  <div className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topSalesChartData}>
                        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                        <XAxis dataKey="shortTitle" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: "#020617",
                            border: "1px solid #1e293b",
                            borderRadius: 16,
                            color: "#fff",
                          }}
                        />
                        <Bar dataKey="total_sales" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {viewMode === "detailed" && (
          <>
            <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-6">
              {renderKpiCard("Inscriptions", kpis.total_users ?? 0, "Comptes créés")}
              {renderKpiCard("Étudiants", kpis.total_students ?? 0, "Profils apprenants")}
              {renderKpiCard("Achats", kpis.total_paid_orders ?? 0, "Commandes payées", "cyan")}
              {renderKpiCard(
                "CA total",
                formatEuro(kpis.revenue_total ?? 0),
                "Chiffre d’affaires",
                "cyan"
              )}
              {renderKpiCard(
                "Panier moyen",
                formatEuro(kpis.average_order_value ?? 0),
                "Valeur moyenne / commande",
                "cyan"
              )}
              {renderKpiCard(
                "Conversion",
                `${kpis.conversion_rate ?? 0}%`,
                "Achats / comptes créés",
                "amber"
              )}
            </div>

            <div className="mb-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {renderKpiCard("Ventes formations", kpis.total_course_orders ?? 0, "Achats unitaires")}
              {renderKpiCard("Ventes packs", kpis.total_bundle_orders ?? 0, "Achats pack")}
              {renderKpiCard(
                "CA formations",
                formatEuro(kpis.revenue_course_total ?? 0),
                "Revenus des ventes unitaires",
                "cyan"
              )}
              {renderKpiCard(
                "CA packs",
                formatEuro(kpis.revenue_bundle_total ?? 0),
                "Revenus des ventes packs",
                "cyan"
              )}
              {renderKpiCard(
                "Complétion",
                `${kpis.completion_rate ?? 0}%`,
                "Taux global",
                "emerald"
              )}
            </div>

            <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="mb-6">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Tendance business
                </p>
                <h2 className="text-3xl font-bold">Ventes et chiffre d’affaires mensuels</h2>
              </div>

              {salesChartData.length === 0 ? (
                <p className="text-slate-300">Aucune donnée mensuelle disponible.</p>
              ) : (
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesChartData}>
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                      <XAxis dataKey="monthLabel" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis
                        yAxisId="left"
                        allowDecimals={false}
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid #1e293b",
                          borderRadius: 16,
                          color: "#fff",
                        }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="total_sales"
                        name="Ventes"
                        stroke="#22d3ee"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        name="CA"
                        stroke="#34d399"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="mb-10 grid gap-10 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
                <div className="mb-6">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Répartition revenus
                  </p>
                  <h2 className="text-3xl font-bold">CA formations vs packs</h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-300">Formations</span>
                      <span className="font-semibold text-cyan-300">
                        {formatEuro(kpis.revenue_course_total ?? 0)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-cyan-400"
                        style={{
                          width: `${
                            (kpis.revenue_total ?? 0) > 0
                              ? ((kpis.revenue_course_total ?? 0) / (kpis.revenue_total ?? 1)) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-300">Packs</span>
                      <span className="font-semibold text-emerald-300">
                        {formatEuro(kpis.revenue_bundle_total ?? 0)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{
                          width: `${
                            (kpis.revenue_total ?? 0) > 0
                              ? ((kpis.revenue_bundle_total ?? 0) / (kpis.revenue_total ?? 1)) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
                <div className="mb-6">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Résumé business
                  </p>
                  <h2 className="text-3xl font-bold">Lecture rapide</h2>
                </div>

                <div className="space-y-4 text-slate-300">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">Chiffre d’affaires total</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {formatEuro(kpis.revenue_total ?? 0)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">Panier moyen</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {formatEuro(kpis.average_order_value ?? 0)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-sm text-slate-400">Taux de conversion</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {kpis.conversion_rate ?? 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-10 grid gap-10 xl:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
                <div className="mb-6">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Performance commerciale
                  </p>
                  <h2 className="text-3xl font-bold">Top ventes</h2>
                </div>

                {topSalesChartData.length === 0 ? (
                  <p className="text-slate-300">Aucune donnée disponible.</p>
                ) : (
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topSalesChartData}>
                        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                        <XAxis dataKey="shortTitle" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: "#020617",
                            border: "1px solid #1e293b",
                            borderRadius: 16,
                            color: "#fff",
                          }}
                        />
                        <Bar dataKey="total_sales" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
                <div className="mb-6">
                  <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                    Engagement
                  </p>
                  <h2 className="text-3xl font-bold">Formations les plus ouvertes</h2>
                </div>

                {openedChartData.length === 0 ? (
                  <p className="text-slate-300">Aucune donnée disponible.</p>
                ) : (
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={openedChartData}>
                        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                        <XAxis dataKey="shortTitle" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: "#020617",
                            border: "1px solid #1e293b",
                            borderRadius: 16,
                            color: "#fff",
                          }}
                        />
                        <Bar dataKey="total_opens" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">
              <div className="mb-6">
                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
                  Complétion
                </p>
                <h2 className="text-3xl font-bold">Formations les plus terminées</h2>
              </div>

              {completedChartData.length === 0 ? (
                <p className="text-slate-300">Aucune donnée disponible.</p>
              ) : (
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={completedChartData}>
                      <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                      <XAxis dataKey="shortTitle" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: "#020617",
                          border: "1px solid #1e293b",
                          borderRadius: 16,
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="total_completed" fill="#34d399" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}