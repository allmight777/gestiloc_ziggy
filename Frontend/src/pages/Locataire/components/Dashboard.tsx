import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Wrench,
  ClipboardList,
  File,
  Key,
  DollarSign,
  Settings,
  Bell,
  HelpCircle,
  User,
  Home,
  ChevronRight,
  Eye,
  X,
  MessageCircle,
  Building,
  Loader,
  AlertCircle,
  Info,
  Calendar,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Users,
  Briefcase,
  Crown,
  Copy,
  Check,
  ArrowLeft,
  Wallet,
  Clock,
  AlertTriangle
} from "lucide-react";

import { Button } from "./ui/Button";
import { Skeleton } from "./ui/Skeleton";
import { Tab } from "../types";
import { PaymentModal } from "./PaymentModal";
import api from "@/services/api";

// Types pour les données de l'API
interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  country: string;
}

interface Landlord {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface Lease {
  id: number;
  uuid: string;
  lease_number: string;
  start_date: string;
  end_date: string;
  status: string;
  rent_amount: number;
  charges_amount: number;
  guarantee_amount: number;
  type: string;
  property: Property | null;
  landlord: Landlord | null;
}

interface Payment {
  id: number;
  amount: number;
  amount_net: number;
  fee_amount: number;
  status: string;
  payment_method: string;
  paid_at: string;
  created_at: string;
  property: {
    id: number;
    name: string;
    address: string;
  } | null;
  month: string | null;
}

interface Receipt {
  id: number;
  reference: string;
  amount: number;
  paid_month: string;
  month: number;
  year: number;
  issued_date: string;
  paid_at: string;
  status: string;
  type: string;
  property: {
    id: number;
    name: string;
  } | null;
  pdf_url: string | null;
}

interface Incident {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  property: {
    id: number;
    name: string;
  } | null;
  photos: string[];
}

interface Notice {
  id: number;
  notice_number: string;
  notice_date: string;
  effective_date: string;
  status: string;
  reason: string;
  created_at: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: string;
  type: string;
  description: string;
}

interface ApiResponse {
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
    roles: string[];
  };
  leases: Lease[];
  active_lease: Lease | null;
  payments: Payment[];
  receipts: Receipt[];
  incidents: Incident[];
  notices: Notice[];
  invoices: Invoice[];
  notifications: any[];
  notifications_unread_count: number;
  stats: {
    total_monthly: number;
    is_up_to_date: boolean;
    months_paid_count: number;
    open_incidents: number;
    in_progress_incidents: number;
    pending_notices: number;
    total_paid_ytd: number;
  };
}

// Données fictives pour les utilisateurs non connectés
const mockDashboardData: ApiResponse = {
  user: {
    id: 0,
    email: "invite@example.com",
    first_name: "Invité",
    last_name: "",
    phone: "",
    roles: ["guest"]
  },
  leases: [
    {
      id: 1,
      uuid: "mock-lease-1",
      lease_number: "BAIL-2025-001",
      start_date: "2025-01-01",
      end_date: "2026-01-01",
      status: "active",
      rent_amount: 150000,
      charges_amount: 25000,
      guarantee_amount: 150000,
      type: "nu",
      property: {
        id: 1,
        name: "Appartement Moderne",
        address: "123 Rue de la Paix",
        city: "Dakar",
        postal_code: "12500",
        country: "Sénégal"
      },
      landlord: {
        id: 1,
        first_name: "Jean",
        last_name: "Dupont",
        email: "jean.dupont@example.com",
        phone: "+221 77 123 45 67"
      }
    }
  ],
  active_lease: {
    id: 1,
    uuid: "mock-lease-1",
    lease_number: "BAIL-2025-001",
    start_date: "2025-01-01",
    end_date: "2026-01-01",
    status: "active",
    rent_amount: 150000,
    charges_amount: 25000,
    guarantee_amount: 150000,
    type: "nu",
    property: {
      id: 1,
      name: "Appartement Moderne",
      address: "123 Rue de la Paix",
      city: "Dakar",
      postal_code: "12500",
      country: "Sénégal"
    },
    landlord: {
      id: 1,
      first_name: "Jean",
      last_name: "Dupont",
      email: "jean.dupont@example.com",
      phone: "+221 77 123 45 67"
    }
  },
  payments: [
    {
      id: 1,
      amount: 175000,
      amount_net: 175000,
      fee_amount: 0,
      status: "approved",
      payment_method: "Carte bancaire",
      paid_at: "2025-03-15T10:30:00Z",
      created_at: "2025-03-15T10:30:00Z",
      property: {
        id: 1,
        name: "Appartement Moderne",
        address: "123 Rue de la Paix"
      },
      month: "2025-03"
    },
    {
      id: 2,
      amount: 175000,
      amount_net: 175000,
      fee_amount: 0,
      status: "approved",
      payment_method: "Mobile Money",
      paid_at: "2025-02-14T09:15:00Z",
      created_at: "2025-02-14T09:15:00Z",
      property: {
        id: 1,
        name: "Appartement Moderne",
        address: "123 Rue de la Paix"
      },
      month: "2025-02"
    }
  ],
  receipts: [
    {
      id: 1,
      reference: "QUIT-2025-03-001",
      amount: 175000,
      paid_month: "2025-03",
      month: 3,
      year: 2025,
      issued_date: "2025-03-16",
      paid_at: "2025-03-15",
      status: "paid",
      type: "rent",
      property: {
        id: 1,
        name: "Appartement Moderne"
      },
      pdf_url: "/mock/receipt-1.pdf"
    },
    {
      id: 2,
      reference: "QUIT-2025-02-001",
      amount: 175000,
      paid_month: "2025-02",
      month: 2,
      year: 2025,
      issued_date: "2025-02-15",
      paid_at: "2025-02-14",
      status: "paid",
      type: "rent",
      property: {
        id: 1,
        name: "Appartement Moderne"
      },
      pdf_url: "/mock/receipt-2.pdf"
    }
  ],
  incidents: [
    {
      id: 1,
      title: "Fuite d'eau dans la cuisine",
      description: "Fuite sous l'évier qui nécessite une intervention rapide",
      category: "plomberie",
      priority: "high",
      status: "in_progress",
      created_at: "2025-03-10T08:00:00Z",
      updated_at: "2025-03-11T14:30:00Z",
      property: {
        id: 1,
        name: "Appartement Moderne"
      },
      photos: []
    }
  ],
  notices: [],
  invoices: [],
  notifications: [],
  notifications_unread_count: 0,
  stats: {
    total_monthly: 175000,
    is_up_to_date: true,
    months_paid_count: 2,
    open_incidents: 0,
    in_progress_incidents: 1,
    pending_notices: 0,
    total_paid_ytd: 350000
  }
};

// ---------- helpers ----------
const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const prevMonthKey = (ym: string) => {
  const [yS, mS] = ym.split("-");
  const y = Number(yS);
  const m = Number(mS);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  d.setMonth(d.getMonth() - 1);
  return monthKey(d);
};

const fmtMoney = (n: number, currency = "FCFA") =>
  `${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} ${currency}`;

const safeDate = (v?: string | null) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

interface DashboardProps {
  activeTab?: string;
  notify: (message: string, type: 'success' | 'error' | 'info') => void;
  onNavigate?: (tab: Tab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeTab = 'home',
  notify,
  onNavigate
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Data states
  const [dashboardData, setDashboardData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Derived date keys
  const currentYM = useMemo(() => monthKey(new Date()), []);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      // Si non authentifié, utiliser les données fictives
      setDashboardData(mockDashboardData);
      setLoading(false);
    }
  }, []);

  // Charger les données depuis l'API Laravel (seulement si authentifié)
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get('/tenant/dashboard');

        if (cancelled) return;

        console.log('Données reçues:', response.data);
        setDashboardData(response.data);

      } catch (err: any) {
        console.error('[DASH] Erreur chargement données:', err);
        if (!cancelled) {
          if (err.response?.status === 401) {
            setIsAuthenticated(false);
            setDashboardData(mockDashboardData);
          } else {
            setError(err.response?.data?.message || 'Erreur lors du chargement des données');
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // ---------- derived stats ----------
  const activeLease = dashboardData?.active_lease;

  const rentMonthly = useMemo(() => activeLease?.rent_amount || 0, [activeLease]);
  const chargesMonthly = useMemo(() => activeLease?.charges_amount || 0, [activeLease]);
  const totalMonthly = useMemo(() => rentMonthly + chargesMonthly, [rentMonthly, chargesMonthly]);

  const receipts = useMemo(() => dashboardData?.receipts || [], [dashboardData]);
  const incidents = useMemo(() => dashboardData?.incidents || [], [dashboardData]);
  const notices = useMemo(() => dashboardData?.notices || [], [dashboardData]);
  const payments = useMemo(() => dashboardData?.payments || [], [dashboardData]);
  const leases = useMemo(() => dashboardData?.leases || [], [dashboardData]);

  const receiptsSorted = useMemo(() => {
    const arr = [...receipts];
    arr.sort((a, b) => {
      const da = safeDate(a.issued_date || "")?.getTime() ?? 0;
      const db = safeDate(b.issued_date || "")?.getTime() ?? 0;
      if (db !== da) return db - da;
      return (b.paid_month || "").localeCompare(a.paid_month || "");
    });
    return arr;
  }, [receipts]);

  const lastReceipt = useMemo(() => receiptsSorted[0] || null, [receiptsSorted]);

  const locationCount = useMemo(() => leases.length || 0, [leases]);

  const openIncidents = useMemo(
    () => incidents?.filter((i: Incident) => i.status === "open").length || 0,
    [incidents]
  );

  const inProgressIncidents = useMemo(
    () => incidents?.filter((i: Incident) => i.status === "in_progress").length || 0,
    [incidents]
  );

  const pendingNotices = useMemo(
    () => notices.filter((n: Notice) => String(n.status) === "pending").length,
    [notices]
  );

  const latePayments = useMemo(() => {
    return payments.filter((p: Payment) =>
      p.status === 'pending' || p.status === 'initiated'
    ).length;
  }, [payments]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
    notify(`${type === 'email' ? 'Email' : 'Téléphone'} copié !`, 'success');
  };

  // Afficher le contenu selon l'onglet actif
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="h-40 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-40 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-64 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center animate-fadeIn">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="text-red-600 mb-4 font-medium">{error}</p>
          <Button onClick={() => window.location.reload()} variant="secondary" className="bg-white border-red-200 text-red-600 hover:bg-red-50">
            Réessayer
          </Button>
        </div>
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <>
            {/* Styles injectés */}
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Manrope:wght@400;500;600;700;800&display=swap');
              .font-merriweather { font-family: 'Merriweather', serif; }
              .font-manrope { font-family: 'Manrope', sans-serif; }
              @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-10px); }
              }
              .animate-float { animation: float 3s ease-in-out infinite; }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
              @keyframes slideUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
              }
              .animate-slideUp { animation: slideUp 0.4s ease-out; }
            `}</style>

            {/* Bannière mode démo si non authentifié */}
            {!isAuthenticated && (
              <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl p-4 mb-6 text-white shadow-lg animate-fadeIn">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <HelpCircle size={20} />
                    </div>
                    <div>
                      <p className="font-medium font-manrope">Mode Démonstration</p>
                      <p className="text-sm text-white/90 font-manrope">Les données affichées sont fictives. Connectez-vous pour voir vos véritables informations.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="px-4 py-2 bg-white text-amber-600 rounded-lg hover:bg-amber-50 transition-colors text-sm font-medium font-manrope"
                  >
                    Se connecter
                  </button>
                </div>
              </div>
            )}

            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 mb-8 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/10 animate-fadeIn"
              style={{ background: 'linear-gradient(135deg, #8CCC63 0%, #529D21 100%)' }}>
              <div className="z-10 text-center md:text-left max-w-xl">
                <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-black mb-4 font-merriweather leading-tight">
                  {!isAuthenticated
                    ? 'Bienvenue sur IMONA !'
                    : dashboardData?.user?.first_name
                      ? `Bonjour, ${dashboardData.user.first_name} !`
                      : 'Bienvenue sur IMONA !'}
                </h1>
                <p className="text-white/95 text-sm sm:text-base leading-relaxed font-manrope font-medium">
                  {!isAuthenticated
                    ? 'Découvrez la gestion locative simplifiée. Testez toutes les fonctionnalités en mode démo.'
                    : 'Retrouvez ici toutes les informations de votre location. Gérez vos quittances, contactez votre propriétaire et suivez l\'état de votre logement en toute simplicité.'}
                </p>
              </div>
              <img
                src="/Ressource_gestiloc/hand.png"
                alt="Welcome"
                className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 object-contain z-10 filter drop-shadow-2xl animate-float"
              />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-3xl opacity-30" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 sm:gap-6 mb-12 animate-slideUp">
              {[
                { id: 'receipts', label: 'Mes quittances', icon: '/Ressource_gestiloc/Mes_quittances.png' },
                { id: 'interventions', label: 'Nouvelle intervention', icon: '/Ressource_gestiloc/Tools.png' },
                { id: 'tasks', label: 'Nouvelle tâche', icon: '/Ressource_gestiloc/Nouvelles_taches.png' },
                { id: 'notes', label: 'Nouvelle note', icon: '/Ressource_gestiloc/Edit Property.png' },
                { id: 'documents', label: 'Nouveau document', icon: '/Ressource_gestiloc/Document In Folder.png' },
              ].map(action => (
                <button
                  key={action.id}
                  onClick={() => onNavigate?.(action.id as Tab)}
                  className="flex flex-col items-center justify-center gap-3 group cursor-pointer bg-white p-5 transition-all hover:shadow-2xl hover:shadow-green-500/10 hover:-translate-y-2 active:scale-[0.98] w-full aspect-square md:aspect-auto md:h-[160px] rounded-2xl border border-gray-100"
                  style={{ boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)' }}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-50 flex items-center justify-center p-3 group-hover:bg-green-50 transition-colors">
                    <img src={action.icon} alt={action.label} className="w-full h-full object-contain filter group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-gray-900 text-center font-manrope group-hover:text-green-600 transition-colors leading-tight px-1">{action.label}</span>
                </button>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 mb-12 animate-slideUp">
              {/* Locations Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col h-[280px] relative shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-gray-900 font-merriweather">Locations</h3>
                  <img src="/Ressource_gestiloc/parametre_loc.png" alt="Settings" className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-6">
                    <img src="/Ressource_gestiloc/Key Security.png" alt="Key" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                    <div className="text-center">
                      <p className="text-5xl sm:text-6xl font-black text-green-600 font-merriweather leading-none drop-shadow-sm">{locationCount}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 font-manrope">
                        {locationCount > 1 ? 'Locations' : 'Location'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.('location')}
                  className="absolute bottom-5 right-6 text-sm font-bold text-green-600 hover:text-green-700 font-manrope flex items-center gap-1 group"
                >
                  Tout afficher <ChevronRightIcon size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Loyers en retard Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col h-[280px] relative shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-gray-900 font-merriweather">Loyers en retard</h3>
                  <img src="/Ressource_gestiloc/parametre_loc.png" alt="Settings" className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-6">
                    <img src="/Ressource_gestiloc/Dollar Bag.png" alt="Money" className="w-20 h-20 sm:w-24 sm:h-24 object-contain" />
                    <div className="text-center">
                      <p className="text-5xl sm:text-6xl font-black text-orange-500 font-merriweather leading-none drop-shadow-sm">{latePayments}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2 font-manrope">
                        {latePayments > 1 ? 'Retards' : 'Retard'}
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.('payments')}
                  className="absolute bottom-5 right-6 text-sm font-bold text-green-600 hover:text-green-700 font-manrope flex items-center gap-1 group"
                >
                  Tout afficher <ChevronRightIcon size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Interventions Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col h-[280px] relative shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-gray-900 font-merriweather">Interventions</h3>
                  <img src="/Ressource_gestiloc/parametre_loc.png" alt="Settings" className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-4 w-full">
                    <img src="/Ressource_gestiloc/Tools.png" alt="Tools" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                    <div className="flex flex-1 justify-around">
                      <div className="text-center">
                        <p className="text-3xl sm:text-4xl font-black text-gray-900 font-merriweather leading-none">{openIncidents}</p>
                        <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mt-1 font-manrope">Ouvertes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl sm:text-4xl font-black text-orange-500 font-merriweather leading-none">0</p>
                        <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mt-1 font-manrope">En retard</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl sm:text-4xl font-black text-green-500 font-merriweather leading-none">{inProgressIncidents}</p>
                        <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mt-1 font-manrope">En cours</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.('interventions')}
                  className="absolute bottom-5 right-6 text-sm font-bold text-green-600 hover:text-green-700 font-manrope flex items-center gap-1 group"
                >
                  Tout afficher <ChevronRightIcon size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Tâches Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col h-[280px] relative shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-black text-gray-900 font-merriweather">Tâches</h3>
                  <img src="/Ressource_gestiloc/parametre_loc.png" alt="Settings" className="w-5 h-5 opacity-40 hover:opacity-100 cursor-pointer transition-opacity" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-6 w-full">
                    <img src="/Ressource_gestiloc/Inspection.png" alt="Tasks" className="w-16 h-16 sm:w-20 sm:h-20 object-contain" />
                    <div className="flex flex-1 justify-around gap-4">
                      <div className="text-center">
                        <p className="text-3xl sm:text-4xl font-black text-gray-900 font-merriweather leading-none">0</p>
                        <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mt-1 font-manrope">Ouvertes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl sm:text-4xl font-black text-orange-500 font-merriweather leading-none">0</p>
                        <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest mt-1 font-manrope">En retard</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate?.('tasks')}
                  className="absolute bottom-5 right-6 text-sm font-bold text-green-600 hover:text-green-700 font-manrope flex items-center gap-1 group"
                >
                  Tout afficher <ChevronRightIcon size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </>
        );

      case 'location':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 font-merriweather">Ma Location</h2>
              <button
                onClick={() => onNavigate?.('home')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-green-600 transition-colors font-manrope"
              >
                <ArrowLeft size={18} /> Retour
              </button>
            </div>
            {activeLease ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-merriweather">{activeLease.property?.name || 'Détails du logement'}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-manrope">Adresse</p>
                    <p className="font-medium text-gray-900 font-manrope">
                      {activeLease.property?.address || 'Non spécifiée'}
                      {activeLease.property?.city ? `, ${activeLease.property.city}` : ''}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-manrope">Loyer mensuel</p>
                    <p className="font-medium text-gray-900 font-manrope">{fmtMoney(activeLease.rent_amount || 0)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-manrope">Charges</p>
                    <p className="font-medium text-gray-900 font-manrope">{fmtMoney(activeLease.charges_amount || 0)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-manrope">Total mensuel</p>
                    <p className="font-medium text-green-600 font-manrope font-bold">{fmtMoney(totalMonthly)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-manrope">Date de début</p>
                    <p className="font-medium text-gray-900 font-manrope">{new Date(activeLease.start_date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-manrope">Date de fin</p>
                    <p className="font-medium text-gray-900 font-manrope">
                      {activeLease.end_date
                        ? new Date(activeLease.end_date).toLocaleDateString('fr-FR')
                        : 'Non spécifiée'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-manrope">Type de bail</p>
                    <p className="font-medium text-gray-900 font-manrope">
                      {activeLease.type === 'nu' ? 'Location nue' : 'Location meublée'}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-manrope">Numéro de bail</p>
                    <p className="font-medium text-gray-900 font-manrope font-mono text-sm">{activeLease.lease_number}</p>
                  </div>
                </div>

                {/* Propriétaire */}
                {activeLease.landlord && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-md font-semibold text-gray-900 mb-3 font-merriweather">Propriétaire</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-manrope">{activeLease.landlord.first_name} {activeLease.landlord.last_name}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-manrope">{activeLease.landlord.email}</span>
                        <button onClick={() => copyToClipboard(activeLease.landlord?.email || '', 'email')} className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors">
                          {copiedText === 'email' ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400" />}
                        </button>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        <span className="text-gray-900 font-manrope">{activeLease.landlord.phone}</span>
                        <button onClick={() => copyToClipboard(activeLease.landlord?.phone || '', 'phone')} className="ml-auto p-1 hover:bg-gray-200 rounded transition-colors">
                          {copiedText === 'phone' ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-gray-400" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <img src="/Ressource_gestiloc/Key Security.png" alt="No lease" className="w-24 h-24 mx-auto mb-4 opacity-50" />
                <p className="text-gray-500 font-manrope mb-2">Aucune location active</p>
                <p className="text-sm text-gray-400 font-manrope">Vous n'avez pas encore de bail actif.</p>
              </div>
            )}
          </div>
        );

      case 'receipts':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 font-merriweather">Mes Quittances</h2>
              <button
                onClick={() => onNavigate?.('home')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-green-600 transition-colors font-manrope"
              >
                <ArrowLeft size={18} /> Retour
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-merriweather">Historique des quittances</h3>
                {receipts && receipts.length > 0 ? (
                  <div className="space-y-3">
                    {receipts.map((receipt: Receipt) => (
                      <div key={receipt.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900 font-manrope">Mois: {receipt.paid_month}</p>
                          <p className="text-sm text-gray-500 font-manrope">
                            Émis le: {new Date(receipt.issued_date).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-sm text-gray-500 font-manrope">
                            {receipt.property?.name && `Bien: ${receipt.property.name}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 font-manrope">{fmtMoney(receipt.amount || 0)}</p>
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle size={10} /> Payé
                          </span>
                          {receipt.pdf_url && (
                            <a
                              href={receipt.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-xs text-green-600 hover:underline font-manrope"
                            >
                              Télécharger
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-manrope">Aucune quittance disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'interventions':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 font-merriweather">Mes Interventions</h2>
              <button
                onClick={() => onNavigate?.('home')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-green-600 transition-colors font-manrope"
              >
                <ArrowLeft size={18} /> Retour
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-merriweather">Historique des interventions</h3>
                {incidents && incidents.length > 0 ? (
                  <div className="space-y-3">
                    {incidents.map((incident: Incident) => (
                      <div key={incident.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 font-manrope">{incident.title}</p>
                          <p className="text-sm text-gray-500 font-manrope">{incident.description.substring(0, 100)}...</p>
                          <p className="text-xs text-gray-400 font-manrope mt-1">
                            {new Date(incident.created_at).toLocaleDateString('fr-FR')}
                            {incident.property?.name && ` • ${incident.property.name}`}
                          </p>
                        </div>
                        <div className="ml-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            incident.status === 'open' ? 'bg-red-100 text-red-700' :
                            incident.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {incident.status === 'open' ? 'Ouvert' :
                              incident.status === 'in_progress' ? 'En cours' :
                                'Résolu'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wrench className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-manrope">Aucune intervention en cours</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 font-merriweather">Paiements</h2>
              <button
                onClick={() => onNavigate?.('home')}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-green-600 transition-colors font-manrope"
              >
                <ArrowLeft size={18} /> Retour
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 font-merriweather">Historique des paiements</h3>
                {payments && payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.map((payment: Payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900 font-manrope">
                            {payment.payment_method === 'card' ? 'Paiement par carte' :
                              payment.payment_method === 'mobile_money' ? 'Mobile Money' :
                                payment.payment_method === 'virement' ? 'Virement' :
                                  payment.payment_method === 'especes' ? 'Espèces' :
                                    payment.payment_method === 'cheque' ? 'Chèque' : 'Paiement'}
                          </p>
                          <p className="text-sm text-gray-500 font-manrope">
                            Date: {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('fr-FR') : 'N/A'}
                          </p>
                          {payment.property?.name && (
                            <p className="text-sm text-gray-500 font-manrope">Bien: {payment.property.name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 font-manrope">{fmtMoney(payment.amount)}</p>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'approved' ? 'bg-green-100 text-green-700' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                          }`}>
                            {payment.status === 'approved' ? 'Approuvé' :
                              payment.status === 'pending' ? 'En attente' :
                                payment.status === 'initiated' ? 'Initialisé' :
                                  payment.status === 'cancelled' ? 'Annulé' :
                                    payment.status === 'failed' ? 'Échoué' : payment.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-manrope">Aucun paiement enregistré</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500 font-manrope">Onglet non trouvé</p>
          </div>
        );
    }
  };

  return (
    <>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={totalMonthly || 0}
        notify={notify}
      />

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default Dashboard;