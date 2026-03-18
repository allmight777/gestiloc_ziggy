// src/pages/Locataire/components/Payments.tsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  RefreshCw, Loader2, FileText, CreditCard, CheckCircle2,
  AlertTriangle, Home, TrendingUp, Clock, DollarSign,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { tenantPayments, type Invoice } from "@/services/tenantPayments";
import api from "@/services/api";

interface PaymentsProps {
  notify?: (message: string, type?: "success" | "error" | "info") => void;
}

interface ChartData { month: string; amount: number; count: number; }
interface DashStats {
  total_paid: number; total_pending: number; total_overdue: number;
  payments_count: number;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatMoney = (amount: any, currency?: string) => {
  const n = Number(amount ?? 0);
  const cur = (currency || "XOF").toUpperCase();
  try {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: cur,
      minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n).replace("XOF", "FCFA");
  } catch { return `${n.toFixed(0)} FCFA`; }
};

const formatDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const formatDateLong = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";

const safeString = (v: any) => (v == null ? "" : String(v));
const isPaid    = (inv: Invoice) => { const s = safeString(inv.status).toLowerCase(); return s === "paid" || s === "paye" || s === "payé"; };
const isPartial = (inv: Invoice) => safeString(inv.status).toLowerCase() === "partially_paid";
const isOverdue = (inv: Invoice) => { const s = safeString(inv.status).toLowerCase(); return s === "overdue" || s.includes("retard") || s.includes("late"); };

const statusInfo = (inv: Invoice) => {
  const s = safeString(inv.status).toLowerCase();
  if (isPaid(inv))     return { label: "Payée",            tone: "ok"   as const };
  if (isPartial(inv))  return { label: "Paiement partiel", tone: "warn" as const };
  if (isOverdue(inv))  return { label: "En retard",        tone: "warn" as const };
  if (s === "pending") return { label: "En attente",       tone: "idle" as const };
  if (s === "failed")  return { label: "Échouée",          tone: "warn" as const };
  return { label: inv.status ? String(inv.status) : "À payer", tone: "idle" as const };
};

const getDueKey  = (inv: Invoice) => safeString(inv.due_date  || inv.period_end  || inv.created_at || "");
const getPaidKey = (inv: Invoice) => safeString(inv.paid_at   || (inv as any).paidAt || inv.updated_at || inv.created_at || "");

const PRIMARY = "#70AE48";
const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

// ─── Micro-composants ────────────────────────────────────────────────────────

function StatusBadge({ inv }: { inv: Invoice }) {
  const { label, tone } = statusInfo(inv);
  const cls = tone === "ok" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : tone === "warn" ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-blue-50 text-blue-700 border-blue-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      {tone === "ok" && <CheckCircle2 size={10} />}
      {tone === "warn" && <AlertTriangle size={10} />}
      {tone === "idle" && <Clock size={10} />}
      {label}
    </span>
  );
}

// Tooltip personnalisé pour le BarChart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3 text-sm">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-base font-extrabold" style={{ color: PRIMARY }}>{formatMoney(payload[0].value)}</p>
      <p className="text-xs text-gray-400 mt-0.5">{payload[0].payload.count} paiement{payload[0].payload.count > 1 ? "s" : ""}</p>
    </div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

export const Payments: React.FC<PaymentsProps> = ({ notify }) => {
  const pushNotify = (msg: string, type: "success" | "error" | "info" = "info") => notify?.(msg, type);

  const [loading,      setLoading]      = useState(true);
  const [err,          setErr]          = useState<string | null>(null);
  const [items,        setItems]        = useState<Invoice[]>([]);
  const [payingId,     setPayingId]     = useState<number | null>(null);
  const [showPaid,     setShowPaid]     = useState(true);

  // Chart data
  const [chartData,    setChartData]    = useState<ChartData[]>([]);
  const [dashStats,    setDashStats]    = useState<DashStats | null>(null);
  const [chartLoading, setChartLoading] = useState(true);

  // ── Chargement factures ──────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true); setErr(null);
    try {
      const list = await tenantPayments.listTenantInvoices();
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      setErr(e?.message || "Impossible de charger les factures.");
    } finally { setLoading(false); }
  };

  // ── Chargement dashboard (graphiques) ────────────────────────────────────────

  const loadDashboard = useCallback(async () => {
    setChartLoading(true);
    try {
      const r = await api.get("/tenant/payments/dashboard");
      console.log("[Dashboard] response:", r.data);
      if (r.data.success) {
        const cd = r.data.data.chart_data || [];
        const st = r.data.data.stats || null;
        console.log("[Dashboard] chart_data:", cd);
        console.log("[Dashboard] stats:", st);
        setChartData(cd);
        setDashStats(st);
      } else {
        // Essai fallback: construire des données depuis les factures payées
        console.warn("[Dashboard] success=false, data:", r.data);
      }
    } catch (e: any) {
      console.error("[Dashboard] error:", e?.response?.status, e?.response?.data, e?.message);
    }
    finally { setChartLoading(false); }
  }, []);

  useEffect(() => { load(); loadDashboard(); }, [loadDashboard]);

  // ── Normalize / split ────────────────────────────────────────────────────────

  const normalized = useMemo(() => tenantPayments.normalizeInvoices(items || []), [items]);

  const { payable, paid } = useMemo(() => {
    const p1: typeof normalized = [], p2: typeof normalized = [];
    for (const inv of normalized) isPaid(inv) ? p2.push(inv) : p1.push(inv);
    p1.sort((a, b) => getDueKey(a).localeCompare(getDueKey(b)));
    p2.sort((a, b) => getPaidKey(b).localeCompare(getPaidKey(a)));
    return { payable: p1, paid: p2 };
  }, [normalized]);

  const stats = useMemo(() => {
    const cur        = tenantPayments.pickCurrency(normalized[0] || {}, "XOF");
    const totalToPay = payable.reduce((s, inv: any) => s + (inv._remaining ?? inv._total ?? 0), 0);
    const totalPaid  = paid.reduce((s, inv: any) => s + (inv._total ?? 0), 0);
    return { cur, payableCount: payable.length, paidCount: paid.length, totalToPay, totalPaid };
  }, [normalized, payable, paid]);

  const pieData = useMemo(() => {
    if (!dashStats) return [];
    return [
      { name: "Payé",      value: dashStats.total_paid    },
      { name: "En attente",value: dashStats.total_pending },
      { name: "Impayés",   value: dashStats.total_overdue },
    ].filter(d => d.value > 0);
  }, [dashStats]);

  const hasBarData = chartData.some(d => d.amount > 0);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handlePay = async (invoiceId: number) => {
    setPayingId(invoiceId); setErr(null);
    try {
      pushNotify("Redirection vers le paiement…", "info");
      const { checkout_url } = await tenantPayments.initInvoicePayment(invoiceId);
      window.location.href = checkout_url;
    } catch (e: any) {
      const backendMsg =
        e?.response?.data?.message || e?.response?.data?.error ||
        (e?.response?.data?.errors
          ? Object.values(e.response.data.errors as Record<string, string[]>).flat().join(" · ")
          : null);
      const httpStatus = e?.response?.status ? `[HTTP ${e.response.status}] ` : "";
      const m = backendMsg ? `${httpStatus}${backendMsg}` : e?.message || "Erreur lors du paiement.";
      pushNotify(m, "error"); setErr(m);
      console.error("[handlePay]", { status: e?.response?.status, data: e?.response?.data });
    } finally { setPayingId(null); }
  };

  const handleReceipt = async (invoiceId: number) => {
    try {
      const blob = await tenantPayments.downloadReceipt(invoiceId);
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e: any) { pushNotify(e?.message || "Impossible de télécharger la quittance.", "error"); }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .payments-page { font-family: 'DM Sans', sans-serif; }
        .mono { font-family: 'DM Mono', monospace; }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .animate-slideUp { animation: slideUp 0.25s cubic-bezier(.16,1,.3,1); }
        .stat-card { transition: transform 0.2s ease; }
        .stat-card:hover { transform: translateY(-2px); }
        .invoice-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        @media (min-width: 1024px) { .invoice-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; } }
        .invoice-card { height: 100%; transition: box-shadow 0.15s, border-color 0.15s, transform 0.2s; }
        .invoice-card:hover { box-shadow: 0 8px 24px rgba(112,174,72,0.15); border-color: #b6dfa0; transform: translateY(-2px); }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8 payments-page">

        {/* ── EN-TÊTE ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
       
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Mes factures</h1>
            <p className="mt-1 text-sm font-semibold text-gray-500">
              Consulte tes loyers/charges et paie en 1 clic via FedaPay.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowPaid(v => !v)}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <FileText size={16} />
              {showPaid ? "Masquer les payées" : "Afficher les payées"}
            </button>
            <button onClick={() => { load(); loadDashboard(); }} disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-60 transition-colors">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Actualiser
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "À payer",    value: stats.payableCount,                      icon: <Clock size={20} />,        bg: "#fffbeb", ic: "#f59e0b" },
            { label: "Payées",     value: stats.paidCount,                          icon: <CheckCircle2 size={20} />, bg: "#ecfdf5", ic: "#10b981" },
            { label: "Restant",    value: formatMoney(stats.totalToPay, stats.cur), icon: <AlertTriangle size={20} />,bg: "#fef2f2", ic: "#ef4444" },
            { label: "Total payé", value: formatMoney(stats.totalPaid, stats.cur),  icon: <TrendingUp size={20} />,   bg: "#f0f9eb", ic: PRIMARY   },
          ].map((s, i) => (
            <div key={i} className="stat-card rounded-xl p-5 border border-gray-100" style={{ background: s.bg }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white shrink-0"
                     style={{ background: s.ic }}>
                  {s.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500">{s.label}</p>
                  <p className="text-xl font-extrabold text-gray-900 mono">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── GRAPHIQUES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Bar chart — évolution 12 mois */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Évolution des paiements</h3>
                <p className="text-xs text-gray-400 mt-0.5">Montants des 12 derniers mois</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                   style={{ background: "#f0f9e8" }}>
                <TrendingUp size={16} style={{ color: PRIMARY }} />
              </div>
            </div>

            {chartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-gray-200" />
              </div>
            ) : !hasBarData ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <TrendingUp size={36} className="text-gray-100 mb-3" />
                <p className="text-sm font-semibold text-gray-400">Aucun paiement enregistré</p>
                <p className="text-xs text-gray-300 mt-1">Les données apparaîtront ici après ton premier paiement</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }} barCategoryGap="35%">
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={PRIMARY}  stopOpacity={1}    />
                      <stop offset="100%" stopColor="#a3d977"  stopOpacity={0.8}  />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }} interval={0} angle={-35} textAnchor="end" height={55} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={44} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(112,174,72,0.06)", radius: 4 }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.amount > 0 ? "url(#barGrad)" : "#e5e7eb"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pie chart — répartition */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Répartition</h3>
                <p className="text-xs text-gray-400 mt-0.5">Par statut</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                <DollarSign size={16} className="text-purple-500" />
              </div>
            </div>

            {chartLoading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-gray-200" />
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <DollarSign size={36} className="text-gray-100 mb-3" />
                <p className="text-sm font-semibold text-gray-400">Aucune donnée</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="42%" innerRadius={52} outerRadius={82}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatMoney(v), "Montant"]}
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", fontFamily: "DM Sans" }} />
                  <Legend iconType="circle" iconSize={8}
                    wrapperStyle={{ fontSize: "12px", fontFamily: "DM Sans", paddingTop: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── ALERTES ── */}
        {err && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <p className="text-sm font-bold text-red-700">{err}</p>
          </div>
        )}

        {loading && (
          <div className="rounded-2xl border border-gray-100 p-8 text-center">
            <Loader2 size={32} className="animate-spin mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-gray-400">Chargement des factures…</p>
          </div>
        )}

        {!loading && !err && (
          <div className="space-y-8">

            {/* ── À PAYER ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">À payer</h2>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border ${
                  payable.length ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}>
                  {payable.length ? `${payable.length} en attente` : "Tout est réglé ✅"}
                </span>
              </div>

              {payable.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
                  <CheckCircle2 size={48} className="mx-auto mb-3 text-emerald-300" />
                  <p className="text-base font-semibold text-gray-500">Aucune facture à payer — tu es à jour ✅</p>
                </div>
              ) : (
                <div className="invoice-grid">
                  {payable.map((inv: any) => {
                    const currency  = tenantPayments.pickCurrency(inv, "XOF");
                    const total     = inv._total ?? inv.amount_total ?? inv.amount ?? 0;
                    const remaining = inv._remaining ?? total;

                    return (
                      <div key={inv.id} className="invoice-card rounded-2xl border border-gray-100 bg-white overflow-hidden flex flex-col">
                        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${PRIMARY}, #a3d977)` }} />

                        <div className="p-5 flex flex-col flex-1">
                          {/* En-tête */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">Facture</p>
                              <p className="text-base font-extrabold text-gray-900">{inv.invoice_number || `#${inv.id}`}</p>
                            </div>
                            <StatusBadge inv={inv} />
                          </div>

                          {/* Détails */}
                          <div className="space-y-2.5 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-400">Échéance</span>
                              <span className="text-sm font-bold text-gray-800">{formatDateLong(inv.due_date)}</span>
                            </div>
                            {inv.type && (
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400">Type</span>
                                <span className="text-sm font-bold text-gray-800 capitalize">
                                  {inv.type === "rent" ? "Loyer" : inv.type === "deposit" ? "Caution" : inv.type}
                                </span>
                              </div>
                            )}
                            {(inv.period_start || inv.period_end) && (
                              <div className="flex items-start justify-between gap-4">
                                <span className="text-xs font-semibold text-gray-400 shrink-0">Période</span>
                                <span className="text-sm font-bold text-gray-800 text-right">
                                  {formatDate(inv.period_start)} → {formatDate(inv.period_end)}
                                </span>
                              </div>
                            )}
                            {inv.lease?.property?.name && (
                              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                <Home size={13} className="text-gray-400 shrink-0" />
                                <span className="text-sm font-medium text-gray-700 truncate">{inv.lease.property.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Montant + bouton */}
                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-0.5">
                                {isPartial(inv) ? "Reste à payer" : "Montant"}
                              </p>
                              <p className="text-2xl font-extrabold text-gray-900 mono leading-none">
                                {formatMoney(isPartial(inv) ? remaining : total, currency)}
                              </p>
                            </div>
                            <button onClick={() => handlePay(inv.id)} disabled={payingId === inv.id}
                              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:opacity-90 hover:scale-[1.02]"
                              style={{ background: `linear-gradient(135deg, ${PRIMARY}, #5a9038)`, boxShadow: "0 2px 10px rgba(112,174,72,0.35)" }}>
                              {payingId === inv.id
                                ? <><Loader2 size={14} className="animate-spin" /> Redirection…</>
                                : <><CreditCard size={14} /> Payer</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── PAYÉES ── */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <h2 className="text-xl font-extrabold text-gray-900">Paiements effectués</h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
                  {paid.length} payé(s)
                </span>
                <button onClick={() => setShowPaid(v => !v)}
                  className="ml-auto text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                  {showPaid ? "Masquer" : "Afficher"}
                </button>
              </div>

              {!showPaid ? (
                <p className="text-sm font-semibold text-gray-400 text-center py-8">Liste masquée</p>
              ) : paid.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center">
                  <DollarSign size={48} className="mx-auto mb-3 text-gray-200" />
                  <p className="text-base font-semibold text-gray-500">Aucun paiement enregistré</p>
                  <p className="text-sm text-gray-400 mt-2">Quand tu paieras une facture, elle apparaîtra ici.</p>
                </div>
              ) : (
                <div className="invoice-grid">
                  {paid.map((inv: any) => {
                    const currency = tenantPayments.pickCurrency(inv, "XOF");
                    const total    = inv._total ?? inv.amount_total ?? inv.amount ?? 0;
                    const paidAt   = inv._paidAt ?? inv.paid_at ?? inv.updated_at ?? null;

                    return (
                      <div key={inv.id} className="invoice-card rounded-2xl border border-gray-100 bg-white overflow-hidden flex flex-col">
                        <div className="h-1.5 w-full bg-emerald-100" />
                        <div className="p-5 flex flex-col flex-1">
                          {/* En-tête */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-1">Facture</p>
                              <p className="text-base font-extrabold text-gray-900">{inv.invoice_number || `#${inv.id}`}</p>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 size={10} /> Payée
                            </span>
                          </div>

                          {/* Détails */}
                          <div className="space-y-2.5 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-400">Échéance</span>
                              <span className="text-sm font-bold text-gray-800">{formatDateLong(inv.due_date)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-400">Payée le</span>
                              <span className="text-sm font-bold text-gray-800">{paidAt ? formatDateLong(String(paidAt)) : "—"}</span>
                            </div>
                            {inv.lease?.property?.name && (
                              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                <Home size={13} className="text-gray-400 shrink-0" />
                                <span className="text-sm font-medium text-gray-700 truncate">{inv.lease.property.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Montant + bouton */}
                          <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100">
                            <div>
                              <p className="text-xs font-semibold text-gray-400 mb-0.5">Montant</p>
                              <p className="text-2xl font-extrabold text-gray-900 mono leading-none">{formatMoney(total, currency)}</p>
                            </div>
                            <button onClick={() => handleReceipt(inv.id)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                              <FileText size={15} /> Quittance
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Payments;