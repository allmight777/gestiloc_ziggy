import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  RotateCcw,
  Download,
  Mail,
  BarChart3,
  Loader2,
  Wallet,
  Check,
  AlertTriangle,
  FileText,
  X,
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle,
  Info,
  DollarSign
} from "lucide-react";
import { accountingService, rentReceiptService } from "@/services/api";

/* ─── Types ─── */

interface PaymentRow {
  id: string;
  locataire: string;
  email: string;
  bien: string;
  adresse: string;
  montant: number;
  montant_formatted: string;
  echeance: string;
  statut: "paid" | "late" | "pending" | "cancelled" | "failed" | "declined";
  datePaiement: string;
  mode: string;
  property_id?: number;
  payment_id?: string;
}

interface PaymentsProps {
  notify: (msg: string, type: "success" | "info" | "error") => void;
}

interface Stats {
  expected_rent: number;
  received_rent: number;
  late_amount: number;
  recovery_rate: number;
  total_payments: number;
  paid_count: number;
  late_count: number;
}

/* ─── STATUT MAP ─── */

const STATUT_MAP: Record<string, "paid" | "late" | "pending" | "cancelled" | "failed" | "declined"> = {
  'approved': 'paid',
  'success': 'paid',
  'completed': 'paid',
  'overdue': 'late',
  'pending': 'pending',
  'initiated': 'pending',
  'cancelled': 'cancelled',
  'failed': 'failed',
  'declined': 'declined',
};

const STATUT_LABEL: Record<string, string> = {
  'paid': 'Payé',
  'late': 'En retard',
  'pending': 'En attente',
  'cancelled': 'Annulé',
  'failed': 'Échoué',
  'declined': 'Refusé',
};

/* ─── Component ─── */

export const Payments: React.FC<PaymentsProps> = ({ notify }) => {
  const navigate = useNavigate();
  const [filterBien, setFilterBien] = useState<string>("all");
  const [linesPerPage, setLinesPerPage] = useState<string>("100");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentList, setPaymentList] = useState<PaymentRow[]>([]);
  const [filteredList, setFilteredList] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<Stats>({
    expected_rent: 0,
    received_rent: 0,
    late_amount: 0,
    recovery_rate: 0,
    total_payments: 0,
    paid_count: 0,
    late_count: 0
  });
  const [properties, setProperties] = useState<Array<{ id: number; name: string }>>([]);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{ 
    id: string; 
    tenantName: string; 
    tenantEmail: string; 
    paymentId: string;
    montant?: number;
    date?: string;
    bien?: string;
  } | null>(null);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [toast, setToast] = useState<{ show: boolean; type: string; title: string; message: string }>({
    show: false,
    type: "success",
    title: "",
    message: ""
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les transactions
      const transactionsResponse = await accountingService.getTransactions();
      
      // Récupérer les stats
      const statsResponse = await accountingService.getStats();

      // Traiter les transactions
      let transactionsArray = [];
      if (transactionsResponse) {
        if (Array.isArray(transactionsResponse)) {
          transactionsArray = transactionsResponse;
        } else if (transactionsResponse.data && Array.isArray(transactionsResponse.data)) {
          transactionsArray = transactionsResponse.data;
        }
      }

      // Transformer les données
      const mappedPayments = transactionsArray.map((transaction: any, index: number) => {
        const montant = parseFloat(transaction.amount) || 0;
        const paymentId = transaction.id;

        return {
          id: String(transaction.id || index + 1),
          locataire: transaction.locataire || 'Inconnu',
          email: transaction.email || '-',
          bien: transaction.property_name || 'Bien inconnu',
          adresse: '',
          montant,
          montant_formatted: `${montant.toLocaleString()} FCFA`,
          echeance: transaction.date ? new Date(transaction.date).toLocaleDateString('fr-FR') : '-',
          statut: STATUT_MAP[transaction.status] || 'pending',
          datePaiement: '-',
          mode: transaction.mode || 'Virement',
          property_id: transaction.property_id,
          payment_id: paymentId
        };
      });

      setPaymentList(mappedPayments);
      setFilteredList(mappedPayments);

      // Mettre à jour les stats
      if (statsResponse) {
        setKpis({
          expected_rent: statsResponse.monthly_expected || statsResponse.expected_rent || 0,
          received_rent: statsResponse.monthly_received || statsResponse.received_rent || 0,
          late_amount: statsResponse.monthly_late || statsResponse.late_amount || 0,
          recovery_rate: statsResponse.recovery_rate || 0,
          total_payments: statsResponse.total_payments || 0,
          paid_count: statsResponse.paid_count || 0,
          late_count: statsResponse.late_count || 0
        });
      }

      // Propriétés pour le filtre
      const uniquePropertiesMap = new Map();
      mappedPayments.forEach((payment: PaymentRow) => {
        if (payment.property_id && !uniquePropertiesMap.has(payment.property_id)) {
          uniquePropertiesMap.set(payment.property_id, {
            id: payment.property_id,
            name: payment.bien || `Bien ${payment.property_id}`
          });
        }
      });
      
      setProperties(Array.from(uniquePropertiesMap.values()));

    } catch (error) {
      console.error('Erreur paiements:', error);
      notify('Erreur lors du chargement des paiements', 'error');
      setPaymentList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = paymentList;

    // Filtre par bien
    if (filterBien !== "all") {
      const filterId = parseInt(filterBien);
      filtered = filtered.filter(p => p.property_id === filterId);
    }

    // Recherche textuelle
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.locataire.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.bien.toLowerCase().includes(term)
      );
    }

    setFilteredList(filtered);
  }, [filterBien, searchTerm, paymentList]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleResetFilters = () => {
    setFilterBien("all");
    setLinesPerPage("100");
    setSearchTerm("");
  };

  const handleShowSendModal = (paymentId: string, tenantName: string, tenantEmail: string, paymentIdOriginal: string, montant?: number, date?: string, bien?: string) => {
    if (!paymentIdOriginal) {
      notify("Erreur", "error");
      return;
    }
    
    setSelectedPayment({ 
      id: paymentId, 
      tenantName, 
      tenantEmail, 
      paymentId: paymentIdOriginal,
      montant,
      date,
      bien
    });
    setShowSendModal(true);
  };

  const handleCloseSendModal = () => {
    setShowSendModal(false);
    setSelectedPayment(null);
  };

  const handleShowExportModal = () => {
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  const handleSelectExportFormat = (format: "csv" | "pdf") => {
    setExportFormat(format);
  };

  const handleDownloadReceipt = async (paymentId: string, paymentIdOriginal?: string) => {
    if (!paymentIdOriginal) {
      notify("ID de paiement invalide", "error");
      return;
    }

    setDownloadingPdf(paymentId);
    
    try {
      // Extraire le nombre de l'ID (enlever le préfixe "p_" si présent)
      const numericId = parseInt(paymentIdOriginal.replace('p_', ''));
      
      if (isNaN(numericId)) {
        throw new Error("ID invalide");
      }
      
      const blob = await rentReceiptService.downloadPdf(numericId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quittance-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      notify("Quittance téléchargée", "success");
    } catch (error: any) {
      console.error('Erreur téléchargement:', error);
      notify("Erreur lors du téléchargement", "error");
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleSendReceipt = async () => {
    if (!selectedPayment || !selectedPayment.paymentId) {
      notify("ID de paiement invalide", "error");
      handleCloseSendModal();
      return;
    }

    setSendingEmail(true);
    
    try {
      const numericId = parseInt(selectedPayment.paymentId.replace('p_', ''));
      
      if (isNaN(numericId)) {
        throw new Error("ID invalide");
      }
      
      const response = await rentReceiptService.sendByEmail(numericId);
      
      if (response.success) {
        notify("Quittance envoyée avec succès", "success");
        handleCloseSendModal();
      } else {
        notify(response.message || "Erreur lors de l'envoi", "error");
      }
    } catch (error: any) {
      console.error('Erreur envoi email:', error);
      notify("Erreur lors de l'envoi de l'email", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleConfirmExport = () => {
    if (exportFormat === 'csv') {
      const headers = ['Locataire', 'Email', 'Bien', 'Montant', 'Échéance', 'Statut', 'Mode'];
      const rows = filteredList.map(p => [
        p.locataire,
        p.email,
        p.bien,
        p.montant_formatted,
        p.echeance,
        STATUT_LABEL[p.statut],
        p.mode
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `paiements_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      handleCloseExportModal();
      notify(`Fichier CSV généré avec ${filteredList.length} paiements`, "success");
    } else {
      handleCloseExportModal();
      notify("Export PDF", "info");
    }
  };

  const statutBadge = (statut: PaymentRow["statut"]) => {
    const classes = {
      paid: "status-paid",
      late: "status-late",
      pending: "status-pending",
      cancelled: "status-late",
      failed: "status-late",
      declined: "status-late"
    };

    const icons = {
      paid: <Check size={12} />,
      late: <AlertTriangle size={12} />,
      pending: <Clock size={12} />,
      cancelled: <XCircle size={12} />,
      failed: <AlertCircle size={12} />,
      declined: <XCircle size={12} />
    };

    return (
      <span className={`status-badge ${classes[statut]}`}>
        <span className="status-icon">{icons[statut]}</span>
        {STATUT_LABEL[statut]}
      </span>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');

        :root {
          --primary: #70AE48;
          --primary-dark: #5a8f3a;
          --primary-light: #f0f7eb;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        .payment-management {
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Manrope', sans-serif;
        }

        .page-header h1 {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.35rem;
        }

        .subtitle {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
        }

        /* Filters */
        .filters-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .filters-card h3 {
          font-size: 0.9rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .filter-group label {
          font-weight: 500;
          color: #333;
          font-size: 0.85rem;
        }

        .filter-group select {
          width: 100%;
          padding: 0.6rem;
          border: 1px solid var(--primary);
          border-radius: 6px;
          background: white;
          font-size: 0.9rem;
          color: #333;
          cursor: pointer;
          outline: none;
        }

        .filter-group select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(112, 174, 72, 0.1);
        }

        /* Search */
        .search-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .search-box {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f5f5f5;
          border: 1px solid var(--primary);
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          max-width: 500px;
        }

        .search-box input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.9rem;
          outline: none;
        }

        .btn-display {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.2rem;
          border: 1px solid var(--primary);
          border-radius: 6px;
          background: white;
          color: #000000;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .btn-display:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .stat-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.25rem;
          position: relative;
          overflow: hidden;
          border-left: 4px solid;
        }

        .green-border {
          border-left-color: var(--primary);
        }

        .blue-border {
          border-left-color: var(--primary);
        }

        .red-border {
          border-left-color: #f44336;
        }

        .orange-border {
          border-left-color: #FF9800;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .stat-title {
          font-size: 0.85rem;
          color: #666;
          font-weight: 500;
        }

        .stat-icon svg {
          width: 20px;
          height: 20px;
        }

        .stat-amount {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.4rem;
        }

        .stat-meta {
          font-size: 0.8rem;
          color: #999;
        }

        .trend-up {
          color: var(--primary);
        }

        /* Actions Bar */
        .actions-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.4rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(112, 174, 72, 0.3);
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1.4rem;
          background: white;
          color: var(--primary);
          border: 1px solid var(--primary);
          border-radius: 6px;
          font-weight: 500;
          font-size: 0.85rem;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: var(--primary-light);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(112, 174, 72, 0.1);
        }

        /* Table */
        .table-container {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow-x: auto;
          margin-bottom: 1.5rem;
        }

        .payments-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        .payments-table th {
          text-align: left;
          padding: 0.9rem 1rem;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
          font-size: 0.85rem;
        }

        .payments-table td {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
          font-size: 0.85rem;
        }

        .tenant-info,
        .property-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .tenant-name {
          color: var(--primary);
          font-weight: 600;
          font-size: 0.9rem;
        }

        .property-name {
          font-weight: 600;
          color: #333;
          font-size: 0.9rem;
        }

        .tenant-info small,
        .property-info small {
          color: #999;
          font-size: 0.75rem;
        }

        .amount {
          font-weight: 600;
          color: #333;
        }

        /* Status Badges */
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.9rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-paid {
          background: var(--primary);
          color: white;
        }

        .status-pending {
          background: #FF9800;
          color: white;
        }

        .status-late {
          background: #f44336;
          color: white;
        }

        .status-icon {
          display: inline-flex;
          align-items: center;
        }

        .payment-mode {
          color: var(--primary);
          font-weight: 500;
          font-size: 0.85rem;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 0.5rem;
        }

        .btn-action {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          color: #666;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-action svg {
          width: 16px;
          height: 16px;
        }

        .btn-action:hover {
          background: #f5f5f5;
          border-color: var(--primary);
          color: var(--primary);
          transform: translateY(-1px);
        }

        .btn-action.pdf:hover {
          background: #ffebcc;
          border-color: #FF9800;
          color: #FF9800;
        }

        .btn-action.email:hover {
          background: var(--primary-light);
          border-color: var(--primary);
          color: var(--primary);
        }

        .btn-action.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 2rem;
        }

        .empty-state-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          background: var(--primary-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.75rem;
        }

        .empty-icon svg {
          width: 24px;
          height: 24px;
          color: var(--primary);
        }

        .empty-state h3 {
          font-size: 1.1rem;
          color: #333;
          margin-bottom: 0.25rem;
        }

        .empty-state p {
          color: #999;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .empty-state .btn-primary {
          margin-top: 0.5rem;
        }

        /* Pagination */
        .pagination-container {
          display: flex;
          justify-content: center;
          margin-top: 1.5rem;
        }

        .pagination {
          display: flex;
          gap: 0.4rem;
          list-style: none;
          padding: 0;
        }

        .page-link {
          padding: 0.5rem 0.9rem;
          border: 1px solid #e0e0e0;
          border-radius: 5px;
          color: var(--primary);
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          font-size: 0.85rem;
        }

        .page-link:hover {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .page-item.active .page-link {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .page-item.disabled .page-link {
          color: #999;
          pointer-events: none;
          background: #f5f5f5;
        }

        /* MODAL STYLES */
        .overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(3px);
          z-index: 999;
          animation: fadeIn 0.2s ease;
        }

        .overlay.show {
          display: block;
        }

        .modal {
          display: none;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 90%;
          max-width: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          animation: slideIn 0.2s ease;
        }

        .modal.show {
          display: block;
        }

        .modal-content {
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          display: flex;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e0e0e0;
          position: relative;
        }

        .modal-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
        }

        .modal-icon.email-icon {
          background: var(--primary-light);
          color: var(--primary);
        }

        .modal-icon.export-icon {
          background: var(--primary-light);
          color: var(--primary);
        }

        .modal-icon svg {
          width: 24px;
          height: 24px;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin: 0;
        }

        .modal-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: none;
          border: none;
          color: #999;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
          font-size: 1.5rem;
        }

        .modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }

        .modal-body {
          padding: 2rem;
        }

        .modal-description {
          color: #666;
          margin-bottom: 1.5rem;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .modal-info {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .info-row {
          display: flex;
          margin-bottom: 0.75rem;
          font-size: 0.95rem;
        }

        .info-row:last-child {
          margin-bottom: 0;
        }

        .info-label {
          width: 100px;
          color: #666;
        }

        .info-value {
          flex: 1;
          color: #333;
          font-weight: 500;
        }

        .modal-message p {
          color: #666;
          margin-bottom: 0.75rem;
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .modal-message p.small {
          font-size: 0.85rem;
          color: #999;
        }

        /* Export Options */
        .export-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .export-option {
          display: flex;
          align-items: center;
          padding: 1.25rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-option:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .export-option.selected {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .option-radio {
          width: 20px;
          height: 20px;
          border: 2px solid #ccc;
          border-radius: 50%;
          margin-right: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .export-option.selected .option-radio {
          border-color: var(--primary);
        }

        .radio-inner {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--primary);
          opacity: 0;
        }

        .export-option.selected .radio-inner {
          opacity: 1;
        }

        .option-content {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .option-icon svg {
          width: 24px;
          height: 24px;
          color: var(--primary);
        }

        .option-text {
          display: flex;
          flex-direction: column;
        }

        .option-text strong {
          color: #333;
          font-size: 1rem;
          margin-bottom: 0.15rem;
        }

        .option-text span {
          font-size: 0.85rem;
          color: #999;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding: 1.5rem 2rem;
          border-top: 1px solid #e0e0e0;
        }

        .btn-cancel {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          color: #666;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel:hover {
          background: #f5f5f5;
          border-color: #999;
        }

        .btn-confirm {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: var(--primary);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-confirm:hover {
          background: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(112, 174, 72, 0.3);
        }

        .btn-confirm:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-icon svg {
          width: 16px;
          height: 16px;
        }

        /* ANIMATIONS */
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -55%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .payment-management {
            padding: 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filters-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }

          .actions-bar {
            flex-wrap: wrap;
          }

          .actions-bar button {
            flex: 1;
            min-width: 100%;
            justify-content: center;
          }

          .search-card {
            flex-direction: column;
            gap: 0.75rem;
          }

          .search-box {
            max-width: 100%;
          }

          .btn-display {
            width: 100%;
            justify-content: center;
          }

          .action-buttons {
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="payment-management">
        {/* Overlay */}
        <div className={`overlay ${showSendModal || showExportModal ? 'show' : ''}`} onClick={() => {
          setShowSendModal(false);
          setShowExportModal(false);
          setSelectedPayment(null);
        }} />

        {/* Header */}
        <div className="page-header">
          <h1>Gestion des paiements</h1>
          <p className="subtitle">Créez et recevez/confirmez en quelques clics et en toute sécurité</p>
        </div>

        {/* Filters Section */}
        <div className="filters-card">
          <h3>FILTRER - UTILISEZ LES OPTIONS CI-DESSOUS</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Bien</label>
              <select
                value={filterBien}
                onChange={(e) => setFilterBien(e.target.value)}
              >
                <option value="all">Tous les biens</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Lignes par page</label>
              <select
                value={linesPerPage}
                onChange={(e) => setLinesPerPage(e.target.value)}
              >
                <option value="10">10 lignes</option>
                <option value="25">25 lignes</option>
                <option value="50">50 lignes</option>
                <option value="100">100 lignes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Search & Display */}
        <div className="search-card">
          <div className="search-box">
            <span className="search-icon">
              <Search size={16} color="#70AE48" />
            </span>
            <input
              type="text"
              placeholder="Rechercher par locataire, email, bien..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button className="btn-display" onClick={handleResetFilters}>
            <span className="gear-icon">
              <RotateCcw size={14} />
            </span>
            Réinitialiser
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          {/* Loyers attendus */}
          <div className="stat-card green-border">
            <div className="stat-header">
              <span className="stat-title">Loyers attendus</span>
              <span className="stat-icon money">
                <DollarSign size={20} />
              </span>
            </div>
            <div className="stat-amount">{kpis.expected_rent.toLocaleString()} FCFA</div>
            <div className="stat-meta">{kpis.total_payments} paiements ce mois</div>
          </div>

          {/* Loyers reçus */}
          <div className="stat-card blue-border">
            <div className="stat-header">
              <span className="stat-title">Loyers reçus</span>
              <span className="stat-icon check">
                <CheckCircle size={20} />
              </span>
            </div>
            <div className="stat-amount">{kpis.received_rent.toLocaleString()} FCFA</div>
            <div className="stat-meta">{kpis.paid_count} paiements ce mois</div>
          </div>

          {/* En retard */}
          <div className="stat-card red-border">
            <div className="stat-header">
              <span className="stat-title">En retard</span>
              <span className="stat-icon warning">
                <AlertTriangle size={20} />
              </span>
            </div>
            <div className="stat-amount">{kpis.late_amount.toLocaleString()} FCFA</div>
            <div className="stat-meta">
              {paymentList.filter(p => p.statut === 'pending').length} paiements en attente
            </div>
          </div>

          {/* Taux de recouvrement */}
          <div className="stat-card orange-border">
            <div className="stat-header">
              <span className="stat-title">Taux de recouvrement</span>
              <span className="stat-icon chart">
                <BarChart3 size={20} />
              </span>
            </div>
            <div className="stat-amount">{kpis.recovery_rate}%</div>
            <div className="stat-meta trend-up">Mois en cours</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="actions-bar">
          <button
            className="btn-primary"
            onClick={() => navigate('/proprietaire/comptabilite/nouveau')}
          >
            <span className="plus-icon">
              <Plus size={16} />
            </span>
            Enregistrer un paiement
          </button>
          <button
            className="btn-secondary"
            onClick={handleShowExportModal}
          >
            <span className="export-icon">
              <Download size={16} />
            </span>
            Exporter
          </button>
        </div>

        {/* Payments Table */}
        <div className="table-container">
          <table className="payments-table">
            <thead>
              <tr>
                <th>Locataire</th>
                <th>Bien</th>
                <th>Montant</th>
                <th>Échéance</th>
                <th>Statut</th>
                <th>Mode</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <Loader2 className="animate-spin" size={24} color="#70AE48" />
                      <span>Chargement des transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length > 0 ? (
                filteredList.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="tenant-info">
                        <span className="tenant-name">{p.locataire}</span>
                        <small>{p.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="property-info">
                        <span className="property-name">{p.bien}</span>
                      </div>
                    </td>
                    <td className="amount">{p.montant_formatted}</td>
                    <td>{p.echeance}</td>
                    <td>{statutBadge(p.statut)}</td>
                    <td>{p.mode}</td>
                    <td>
                      <div className="action-buttons">
                        {/* Bouton télécharger */}
                        <button
                          className={`btn-action pdf ${downloadingPdf === p.id ? 'loading' : ''}`}
                          title="Télécharger la quittance"
                          onClick={() => handleDownloadReceipt(p.id, p.payment_id)}
                          disabled={downloadingPdf === p.id}
                        >
                          {downloadingPdf === p.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <FileText size={16} />
                          )}
                        </button>
                        
                        {/* Bouton envoyer par email */}
                        <button
                          className="btn-action email"
                          title="Envoyer la quittance par email"
                          onClick={() => {
                            handleShowSendModal(
                              p.id, 
                              p.locataire, 
                              p.email, 
                              p.payment_id || '', 
                              p.montant, 
                              p.echeance,
                              p.bien
                            );
                          }}
                        >
                          <Mail size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-state-content">
                      <div className="empty-icon">
                        <Wallet size={24} />
                      </div>
                      <h3>Aucun paiement trouvé</h3>
                      <p>Aucun paiement ne correspond à vos critères.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-container">
          <div className="pagination">
            <span className="page-item disabled">
              <span className="page-link">‹</span>
            </span>
            <span className="page-item active">
              <span className="page-link">1</span>
            </span>
            <span className="page-item">
              <span className="page-link">2</span>
            </span>
            <span className="page-item">
              <span className="page-link">3</span>
            </span>
            <span className="page-item">
              <span className="page-link">›</span>
            </span>
          </div>
        </div>
      </div>

      {/* MODALE D'ENVOI */}
      <div className={`modal ${showSendModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-icon email-icon">
              <Mail size={24} />
            </div>
            <h2>Envoyer la quittance</h2>
            <button className="modal-close" onClick={handleCloseSendModal}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="modal-info">
              <div className="info-row">
                <span className="info-label">Locataire :</span>
                <span className="info-value">{selectedPayment?.tenantName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email :</span>
                <span className="info-value">{selectedPayment?.tenantEmail}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Montant :</span>
                <span className="info-value">{selectedPayment?.montant?.toLocaleString()} FCFA</span>
              </div>
            </div>
            <div className="modal-message">
              <p>Envoyer la quittance par email au locataire.</p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={handleCloseSendModal} disabled={sendingEmail}>
              Annuler
            </button>
            <button 
              className="btn-confirm" 
              onClick={handleSendReceipt}
              disabled={sendingEmail}
            >
              {sendingEmail ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail size={16} />
                  Envoyer
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODALE D'EXPORT */}
      <div className={`modal ${showExportModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-icon export-icon">
              <Download size={24} />
            </div>
            <h2>Exporter</h2>
            <button className="modal-close" onClick={handleCloseExportModal}>
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="export-options">
              <div
                className={`export-option ${exportFormat === 'csv' ? 'selected' : ''}`}
                onClick={() => handleSelectExportFormat('csv')}
              >
                <div className="option-radio">
                  <div className="radio-inner"></div>
                </div>
                <div className="option-content">
                  <span className="option-icon">
                    <BarChart3 size={24} />
                  </span>
                  <div className="option-text">
                    <strong>CSV</strong>
                    <span>Format tableur</span>
                  </div>
                </div>
              </div>
              <div
                className={`export-option ${exportFormat === 'pdf' ? 'selected' : ''}`}
                onClick={() => handleSelectExportFormat('pdf')}
              >
                <div className="option-radio">
                  <div className="radio-inner"></div>
                </div>
                <div className="option-content">
                  <span className="option-icon">
                    <FileText size={24} />
                  </span>
                  <div className="option-text">
                    <strong>PDF</strong>
                    <span>Format document</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-cancel" onClick={handleCloseExportModal}>Annuler</button>
            <button className="btn-confirm" onClick={handleConfirmExport}>
              <span className="btn-icon">
                <Download size={16} />
              </span>
              Exporter
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payments;