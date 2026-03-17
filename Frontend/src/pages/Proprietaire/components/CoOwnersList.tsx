import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { DelegatePropertyModal } from './DelegatePropertyModal';
import api from '@/services/api';

interface Property {
  id: number; name: string; address: string; city: string;
  postal_code?: string; rent_amount?: string; surface?: number;
  property_type?: string; status?: string;
}
interface Delegation {
  id: number; property_id: number; property: Property;
  status: 'active' | 'revoked' | 'expired';
  permissions: string[]; delegated_at: string; expires_at?: string; notes?: string;
}
interface CoOwner {
  id: number; user_id: number; first_name: string; last_name: string;
  email: string; company_name?: string; phone?: string; address_billing?: string;
  is_professional: boolean; invitation_type: 'co_owner' | 'agency';
  license_number?: string; status: 'active' | 'inactive' | 'suspended';
  joined_at?: string; meta?: any; delegations?: Delegation[];
  ifu?: string; rccm?: string; vat_number?: string;
  created_at?: string; updated_at?: string; delegations_count?: number;
}
interface CoOwnerInvitation {
  id: number; email: string; name: string; token: string;
  expires_at: string; accepted_at?: string; created_at: string;
  invited_by_type: 'landlord' | 'co_owner'; target_type: 'co_owner' | 'landlord';
  meta?: any; invitation_type: 'co_owner' | 'agency'; is_professional: boolean;
}
interface CoOwnersListProps {
  notify: (msg: string, type: "success" | "info" | "error") => void;
}

const css = `
  :root {
    --primary: #70AE48; --primary-dark: #5c8f3a; --primary-light: #f0f9e6;
    --primary-soft: rgba(112,174,72,0.08); --primary-border: rgba(112,174,72,0.2);
    --purple: #8b5cf6; --purple-light: #f5f3ff;
    --green: #10b981; --green-light: #d1fae5;
    --amber: #f59e0b; --amber-light: #fef3c7;
    --red: #ef4444; --red-light: #fee2e2;
    --gray-50: #f9fafb; --gray-100: #f3f4f6; --gray-200: #e5e7eb;
    --gray-300: #d1d5db; --gray-400: #9ca3af; --gray-500: #6b7280;
    --gray-600: #4b5563; --gray-700: #374151; --gray-800: #1f2937; --gray-900: #111827;
    --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
    --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  }

  .co-container { max-width: 1400px; margin: 0 auto; }

  .co-header-section { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
  .co-header-title h2 { font-size: 2rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.25rem; }
  .co-header-title p { color: var(--gray-500); font-size: 0.95rem; }
  .co-header-actions { display: flex; gap: 0.75rem; }

  .co-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem 1.25rem; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; font-family: inherit; }
  .co-btn-primary { background: var(--primary); color: white; box-shadow: var(--shadow-sm); }
  .co-btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .co-btn-outline { background: white; border-color: var(--gray-300); color: var(--gray-700); }
  .co-btn-outline:hover { background: var(--gray-50); border-color: var(--primary); color: var(--primary); }
  .co-btn-sm { padding: 0.5rem 1rem; font-size: 0.813rem; }

  .co-filters-card { background: white; border-radius: 1.25rem; padding: 1.5rem; margin-bottom: 2rem; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); }
  .co-filters-form { display: flex; flex-direction: column; gap: 1rem; }
  @media (min-width: 640px) { .co-filters-form { flex-direction: row; } }
  .co-search-wrapper { flex: 1; position: relative; }
  .co-search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--gray-400); pointer-events: none; }
  .co-search-input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border: 1px solid var(--gray-300); border-radius: 0.75rem; font-size: 0.95rem; background: white; box-sizing: border-box; font-family: inherit; outline: none; }
  .co-search-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }
  .co-filters-group { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .co-filter-select { padding: 0.75rem 1rem; border: 1px solid var(--gray-300); border-radius: 0.75rem; font-size: 0.95rem; background: white; cursor: pointer; min-width: 160px; font-family: inherit; outline: none; }
  .co-filter-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-soft); }

  .co-stats-grid { display: grid; grid-template-columns: repeat(1,1fr); gap: 1rem; margin-bottom: 2rem; }
  @media (min-width: 768px) { .co-stats-grid { grid-template-columns: repeat(4,1fr); } }
  .co-stat-card { background: white; border-radius: 1.25rem; padding: 1.5rem; border: 1px solid var(--gray-200); box-shadow: var(--shadow-sm); }
  .co-stat-content { display: flex; align-items: center; justify-content: space-between; }
  .co-stat-info p { color: var(--gray-500); font-size: 0.875rem; margin-bottom: 0.25rem; }
  .co-stat-info h3 { font-size: 2rem; font-weight: 700; color: var(--gray-900); }
  .co-stat-icon { width: 3rem; height: 3rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center; }
  .co-stat-icon.blue { background: #e6f0ff; color: #3b82f6; }
  .co-stat-icon.purple { background: #f3e8ff; color: var(--purple); }
  .co-stat-icon.green { background: #e0f2e9; color: var(--green); }

  .co-card { background: white; border-radius: 1.5rem; border: 1px solid var(--gray-200); overflow: hidden; margin-bottom: 1rem; box-shadow: var(--shadow-sm); transition: all 0.3s; }
  .co-card:hover { box-shadow: var(--shadow-lg); border-color: var(--primary-border); }

  .co-card-header { padding: 1.5rem; border-bottom: 1px solid var(--gray-200); }
  .co-card-header.agency { background: linear-gradient(135deg, #faf5ff, #f3e8ff); }
  .co-card-header.coowner { background: linear-gradient(135deg, #f0f9eb, #e6f3da); }
  .co-card-header-content { display: flex; align-items: flex-start; justify-content: space-between; }

  .co-user-info { display: flex; align-items: center; gap: 1rem; }
  .co-avatar { width: 3.5rem; height: 3.5rem; border-radius: 1rem; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem; color: white; box-shadow: var(--shadow-md); }
  .co-avatar.agency { background: linear-gradient(135deg, var(--purple), #a78bfa); }
  .co-avatar.coowner { background: linear-gradient(135deg, var(--primary), #8bc34a); }
  .co-user-details h3 { font-size: 1.25rem; font-weight: 600; color: var(--gray-900); margin-bottom: 0.25rem; }
  .co-user-meta { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

  .co-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.375rem 0.75rem; border-radius: 2rem; font-size: 0.75rem; font-weight: 600; border: 1px solid; }
  .co-badge-agency { background: #f3e8ff; color: var(--purple); border-color: #d8b4fe; }
  .co-badge-coowner { background: var(--primary-light); color: var(--primary-dark); border-color: var(--primary-border); }
  .co-badge-active { background: var(--green-light); color: #166534; border-color: #86efac; }
  .co-badge-inactive { background: var(--gray-100); color: var(--gray-600); border-color: var(--gray-300); }
  .co-badge-suspended { background: var(--red-light); color: #991b1b; border-color: #fecaca; }
  .co-badge-pending { background: var(--amber-light); color: #92400e; border-color: #fcd34d; }

  .co-status-section { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
  .co-date-text { font-size: 0.75rem; color: var(--gray-500); }

  .co-quick-info { padding: 1rem 1.5rem; background: var(--gray-50); border-bottom: 1px solid var(--gray-200); }
  .co-quick-info-wrapper { display: flex; flex-direction: column; gap: 1rem; }
  @media (min-width: 640px) { .co-quick-info-wrapper { flex-direction: row; align-items: center; justify-content: space-between; } }
  .co-info-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem; }
  .co-info-tag { display: flex; align-items: center; gap: 0.5rem; color: var(--gray-600); font-size: 0.875rem; }
  .co-action-buttons { display: flex; gap: 0.5rem; }

  .co-toggle-btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1rem; background: white; border: 1px solid var(--gray-300); border-radius: 0.75rem; font-size: 0.875rem; color: var(--gray-700); cursor: pointer; font-family: inherit; }
  .co-toggle-btn:hover { background: var(--gray-50); border-color: var(--primary); color: var(--primary); }
  .co-view-btn { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.5rem 1.25rem; background: var(--primary); color: white; border-radius: 0.75rem; font-size: 0.875rem; font-weight: 500; border: none; cursor: pointer; font-family: inherit; }
  .co-view-btn:hover { background: var(--primary-dark); transform: translateY(-1px); }

  .co-details-section { padding: 2rem; border-top: 1px solid var(--gray-200); }
  .co-details-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 2rem; }
  @media (min-width: 1024px) { .co-details-grid { grid-template-columns: repeat(3,1fr); } }

  .co-detail-card { background: white; border: 1px solid var(--gray-200); border-radius: 1.25rem; padding: 1.5rem; box-shadow: var(--shadow-sm); }
  .co-detail-title { display: flex; align-items: center; gap: 0.75rem; font-size: 1.125rem; font-weight: 600; color: var(--gray-900); padding-bottom: 1rem; margin-bottom: 1.25rem; border-bottom: 1px solid var(--gray-200); }
  .co-detail-title svg { color: var(--primary); }
  .co-info-row { margin-bottom: 1rem; }
  .co-info-label { font-size: 0.75rem; font-weight: 600; color: var(--gray-500); text-transform: uppercase; letter-spacing: 0.02em; margin-bottom: 0.25rem; }
  .co-info-value { display: flex; align-items: center; gap: 0.5rem; color: var(--gray-900); font-weight: 500; }

  .co-delegations-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
  .co-delegations-title { display: flex; align-items: center; gap: 1rem; }
  .co-title-icon { padding: 0.75rem; background: linear-gradient(135deg, var(--primary), #8bc34a); border-radius: 1rem; color: white; box-shadow: var(--shadow-md); }
  .co-delegations-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
  @media (min-width: 1024px) { .co-delegations-grid { grid-template-columns: repeat(2,1fr); } }

  .co-delegation-card { position: relative; background: white; border-radius: 1.5rem; padding: 1.5rem; border: 2px solid rgba(112,174,72,0.15); box-shadow: 0 10px 25px -5px rgba(112,174,72,0.1); transition: all 0.3s; }
  .co-delegation-card:hover { border-color: var(--primary); box-shadow: 0 20px 30px -10px rgba(112,174,72,0.2); transform: translateY(-2px); }
  .co-delegation-header { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
  @media (min-width: 640px) { .co-delegation-header { flex-direction: row; justify-content: space-between; align-items: center; } }
  .co-property-info { display: flex; align-items: center; gap: 1rem; }
  .co-property-icon { padding: 0.75rem; background: linear-gradient(135deg, var(--primary), #8bc34a); border-radius: 1rem; color: white; }
  .co-property-name { font-weight: 700; font-size: 1.25rem; color: var(--gray-900); margin-bottom: 0.25rem; }
  .co-property-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .co-expiry-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: linear-gradient(135deg, #fef3c7, #fffbeb); border-radius: 1rem; border: 1px solid #fcd34d; }

  .co-property-details { background: linear-gradient(135deg, #f8fafc, #f0f9eb); border-radius: 1rem; padding: 1.25rem; margin-bottom: 1.5rem; border: 1px solid rgba(112,174,72,0.15); }
  .co-property-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
  @media (min-width: 768px) { .co-property-grid { grid-template-columns: repeat(2,1fr); } }
  .co-property-item { display: flex; align-items: flex-start; gap: 0.75rem; }
  .co-item-icon { padding: 0.5rem; background: white; border-radius: 0.75rem; border: 1px solid rgba(112,174,72,0.2); flex-shrink: 0; }
  .co-item-content p { font-size: 0.813rem; font-weight: 600; color: var(--gray-600); margin-bottom: 0.125rem; }
  .co-item-content span { font-weight: 600; color: var(--gray-900); }

  .co-notes-box { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-radius: 1rem; padding: 1.25rem; border: 1px solid #fcd34d; margin-bottom: 1.5rem; }
  .co-permissions-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 0.75rem; margin-top: 1rem; }
  @media (min-width: 768px) { .co-permissions-grid { grid-template-columns: repeat(4,1fr); } }
  .co-permission-item { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1rem; background: linear-gradient(135deg, white, var(--primary-light)); border-radius: 1rem; border: 1px solid rgba(112,174,72,0.2); transition: all 0.3s; }
  .co-permission-item:hover { border-color: var(--primary); transform: scale(1.05); box-shadow: var(--shadow-md); }
  .co-permission-icon { padding: 0.5rem; background: linear-gradient(135deg, var(--primary), #8bc34a); border-radius: 0.75rem; color: white; margin-bottom: 0.5rem; }

  .co-invitations-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; margin-top: 1rem; }
  @media (min-width: 768px) { .co-invitations-grid { grid-template-columns: repeat(2,1fr); } }
  .co-invitation-card { background: linear-gradient(135deg, #fef3c7, #fffbeb); border-radius: 1.25rem; padding: 1.5rem; border: 1px solid #fcd34d; }
  .co-invitation-header { display: flex; align-items: flex-start; gap: 1rem; }
  .co-invitation-icon { padding: 0.75rem; background: #fcd34d; border-radius: 1rem; color: #92400e; flex-shrink: 0; }

  .co-empty { background: white; border-radius: 1.5rem; padding: 3rem; text-align: center; border: 1px solid var(--gray-200); }
  .co-del-empty { text-align: center; padding: 3rem; background: var(--gray-50); border-radius: 1.5rem; border: 2px dashed var(--gray-300); }

  @keyframes co-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .co-spin { animation: co-spin 1s linear infinite; }

  .co-modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px); opacity: 0; visibility: hidden; transition: all 0.3s ease; }
  .co-modal-overlay.active { opacity: 1; visibility: visible; }
  .co-modal-container { background: white; border-radius: 24px; width: 90%; max-width: 400px; padding: 24px; transform: scale(0.9); transition: transform 0.3s ease; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); }
  .co-modal-overlay.active .co-modal-container { transform: scale(1); }
  .co-modal-icon { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; }
  .co-modal-icon.warning { background: var(--amber-light); color: var(--amber); }
  .co-modal-icon.info { background: var(--primary-light); color: var(--primary); }
  .co-modal-icon.danger { background: var(--red-light); color: var(--red); }
  .co-modal-title { font-size: 1.25rem; font-weight: 700; color: var(--gray-900); text-align: center; margin-bottom: 8px; }
  .co-modal-message { color: var(--gray-600); text-align: center; margin-bottom: 24px; line-height: 1.6; font-size: 0.95rem; }
  .co-modal-actions { display: flex; gap: 12px; justify-content: center; }
  .co-modal-btn { padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; border: none; min-width: 120px; font-family: inherit; }
  .co-modal-btn-primary { background: var(--primary); color: white; }
  .co-modal-btn-primary:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-2px); }
  .co-modal-btn-secondary { background: var(--gray-100); color: var(--gray-700); }
  .co-modal-btn-secondary:hover:not(:disabled) { background: var(--gray-200); }
  .co-modal-btn-danger { background: var(--red); color: white; }
  .co-modal-btn-danger:hover:not(:disabled) { background: #dc2626; transform: translateY(-2px); }
  .co-modal-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none !important; }
`;

export const CoOwnersList: React.FC<CoOwnersListProps> = ({ notify }) => {
  const [coOwners, setCoOwners] = useState<CoOwner[]>([]);
  const [invitations, setInvitations] = useState<CoOwnerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedCoOwner, setSelectedCoOwner] = useState<CoOwner | null>(null);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [expandedCoOwners, setExpandedCoOwners] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean; title: string; message: string; type: 'warning' | 'info' | 'danger';
    onConfirm: (() => Promise<void>) | null; loading: boolean;
  }>({ open: false, title: '', message: '', type: 'warning', onConfirm: null, loading: false });

  const openConfirmModal = (title: string, message: string, type: 'warning' | 'info' | 'danger', onConfirm: () => Promise<void>) => {
    setConfirmModal({ open: true, title, message, type, onConfirm, loading: false });
  };
  const closeConfirmModal = () => setConfirmModal(m => ({ ...m, open: false, onConfirm: null, loading: false }));
  const handleModalConfirm = async () => {
    if (!confirmModal.onConfirm) return;
    setConfirmModal(m => ({ ...m, loading: true }));
    await confirmModal.onConfirm();
    closeConfirmModal();
  };

  const fetchCoOwners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/co-owners');
      let coOwnersData: any[] = [];
      let invitationsData: any[] = [];
      if (response.data?.data?.co_owners) { coOwnersData = response.data.data.co_owners; invitationsData = response.data.data.invitations || []; }
      else if (response.data?.co_owners) { coOwnersData = response.data.co_owners; invitationsData = response.data.invitations || []; }
      else if (Array.isArray(response.data)) { coOwnersData = response.data; }

      const transformed = coOwnersData.map((c: any) => {
        const meta = c.meta || {};
        return {
          id: c.id, user_id: c.user_id, first_name: c.first_name || '', last_name: c.last_name || '',
          email: c.email || '', company_name: c.company_name || '', phone: c.phone || meta.phone || '',
          address_billing: c.address_billing || '', is_professional: c.is_professional || false,
          invitation_type: (c.invitation_type || (c.is_professional ? 'agency' : 'co_owner')) as 'co_owner' | 'agency',
          license_number: c.license_number || '', status: c.status || 'active',
          joined_at: c.joined_at || c.created_at, meta,
          ifu: c.ifu || meta.ifu || '', rccm: c.rccm || meta.rccm || '', vat_number: c.vat_number || meta.vat_number || '',
          delegations: c.delegations || [], delegations_count: (c.delegations || []).length || c.delegations_count || 0,
          created_at: c.created_at, updated_at: c.updated_at,
        };
      });
      setCoOwners(transformed);

      setInvitations(invitationsData.map((inv: any) => {
        const meta = inv.meta || {};
        return {
          id: inv.id, email: inv.email, name: inv.name, token: inv.token || '',
          expires_at: inv.expires_at, created_at: inv.created_at,
          invited_by_type: 'landlord' as const, target_type: 'co_owner' as const,
          is_professional: meta.is_professional || inv.is_professional || false,
          invitation_type: (inv.invitation_type || (meta.is_professional ? 'agency' : 'co_owner')) as 'co_owner' | 'agency',
          meta,
        };
      }));
    } catch (error: any) {
      notify(`Erreur: ${error.message || 'Impossible de charger les données'}`, 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCoOwners(); }, []);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return d; }
  };

  const toggleExpanded = (id: number) => {
    const s = new Set(expandedCoOwners);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedCoOwners(s);
  };

  const handleDelegate = (coOwner: CoOwner) => { setSelectedCoOwner(coOwner); setShowDelegateModal(true); };
  const handleCloseDelegateModal = () => { setShowDelegateModal(false); setSelectedCoOwner(null); fetchCoOwners(); };

  const getPermissionLabel = (p: string) => ({
    manage_lease: 'Gérer les baux', collect_rent: 'Collecter les loyers',
    manage_maintenance: 'Gérer la maintenance', send_invoices: 'Envoyer les factures',
    manage_tenants: 'Gérer les locataires', view_documents: 'Voir les documents',
    view: 'Voir', edit: 'Modifier',
  }[p] || p);

  const filteredCoOwners = coOwners.filter(c => {
    const s = searchTerm.toLowerCase();
    const ms = !s || [c.first_name, c.last_name, c.email, c.company_name, c.phone].some(v => (v || '').toLowerCase().includes(s));
    return ms && (statusFilter === 'all' || c.status === statusFilter) && (typeFilter === 'all' || c.invitation_type === typeFilter);
  });

  const filteredInvitations = invitations.filter(i => {
    const s = searchTerm.toLowerCase();
    const ms = !s || [i.email, i.name].some(v => (v || '').toLowerCase().includes(s));
    return ms && (typeFilter === 'all' || i.invitation_type === typeFilter);
  });

  const resendInvitation = (invitationId: number) => {
    openConfirmModal(
      "Renvoyer l'invitation",
      'Voulez-vous vraiment renvoyer cette invitation ?',
      'info',
      async () => {
        try {
          await api.post(`/co-owners/invitations/${invitationId}/resend`);
          notify('Invitation renvoyée avec succès', 'success');
          fetchCoOwners();
        } catch (error: any) {
          notify(error.response?.data?.message || "Erreur lors du renvoi de l'invitation", 'error');
        }
      }
    );
  };

  const cancelInvitation = (invitationId: number) => {
    openConfirmModal(
      "Annuler l'invitation",
      'Voulez-vous vraiment annuler cette invitation ? Cette action est irréversible.',
      'danger',
      async () => {
        try {
          await api.delete(`/co-owners/invitations/${invitationId}`);
          notify('Invitation annulée avec succès', 'success');
          fetchCoOwners();
        } catch (error: any) {
          notify(error.response?.data?.message || "Erreur lors de l'annulation de l'invitation", 'error');
        }
      }
    );
  };

  const svgUser = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  const svgKey = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>;
  const svgHome = <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10z"/></svg>;
  const svgPhone = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8 10a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0122 16.92z"/></svg>;
  const svgPin = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
  const svgMail = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  const svgCheck = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>;
  const svgClock = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
  const svgChevron = (up: boolean) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: up ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}><polyline points="6 9 12 15 18 9"/></svg>;
  const svgBuilding = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>;
  const svgUsers = <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;

  return (
    <>
      <style>{css}</style>
      <div className="co-container">
        <div className="co-header-section">
          <div className="co-header-title">
            <h2>Co-propriétaires & Agences</h2>
            <p>Gérez vos gestionnaires et leurs délégations</p>
          </div>
          <div className="co-header-actions">
            <button className="co-btn co-btn-primary co-btn-sm" onClick={() => window.location.href = '/proprietaire/inviter-coproprietaire'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              Inviter un gestionnaire
            </button>
            <button className="co-btn co-btn-outline co-btn-sm" onClick={fetchCoOwners} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'co-spin' : ''}><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Actualiser
            </button>
          </div>
        </div>

        <div className="co-filters-card">
          <div className="co-filters-form">
            <div className="co-search-wrapper">
              <span className="co-search-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input type="text" className="co-search-input" placeholder="Rechercher par nom, email, téléphone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="co-filters-group">
              <select className="co-filter-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="all">Tous les types</option>
                <option value="co_owner">Co-propriétaires</option>
                <option value="agency">Agences</option>
              </select>
              <select className="co-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
                <option value="suspended">Suspendus</option>
              </select>
            </div>
          </div>
        </div>

        <div className="co-stats-grid">
          {[
            { label: 'Total', val: coOwners.length, cls: 'blue', icon: svgUsers },
            { label: 'Co-propriétaires', val: coOwners.filter(c => c.invitation_type === 'co_owner').length, cls: 'blue', color: 'var(--primary)', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
            { label: 'Agences', val: coOwners.filter(c => c.invitation_type === 'agency').length, cls: 'purple', color: 'var(--purple)', icon: svgBuilding },
            { label: 'Délégations', val: coOwners.reduce((s, c) => s + (c.delegations_count || 0), 0), cls: 'green', color: 'var(--green)', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg> },
          ].map(s => (
            <div key={s.label} className="co-stat-card">
              <div className="co-stat-content">
                <div className="co-stat-info">
                  <p>{s.label}</p>
                  <h3 style={s.color ? { color: s.color } : {}}>{s.val}</h3>
                </div>
                <div className={`co-stat-icon ${s.cls}`}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {filteredCoOwners.length === 0 && filteredInvitations.length === 0 ? (
          <div className="co-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5" style={{ margin: '0 auto 1.5rem', display: 'block' }}><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 'Aucun gestionnaire trouvé' : 'Aucun gestionnaire'}
            </h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? "Essayez d'ajuster vos filtres" : 'Commencez par inviter votre premier gestionnaire'}
            </p>
            <button className="co-btn co-btn-primary" onClick={() => window.location.href = '/proprietaire/inviter-coproprietaire'}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              Inviter un gestionnaire
            </button>
          </div>
        ) : (
          <div>
            {filteredCoOwners.map(coOwner => {
              const isAgency = coOwner.invitation_type === 'agency';
              const isExpanded = expandedCoOwners.has(coOwner.id);
              const initials = `${coOwner.first_name?.charAt(0) || ''}${coOwner.last_name?.charAt(0) || ''}`;

              return (
                <div key={coOwner.id} className="co-card">
                  <div className={`co-card-header ${isAgency ? 'agency' : 'coowner'}`}>
                    <div className="co-card-header-content">
                      <div className="co-user-info">
                        <div className={`co-avatar ${isAgency ? 'agency' : 'coowner'}`}>
                          {isAgency ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> : initials}
                        </div>
                        <div className="co-user-details">
                          <h3>{isAgency ? (coOwner.company_name || `${coOwner.first_name} ${coOwner.last_name}`) : `${coOwner.first_name} ${coOwner.last_name}`}</h3>
                          <div className="co-user-meta">
                            <span className={`co-badge ${isAgency ? 'co-badge-agency' : 'co-badge-coowner'}`}>
                              {isAgency ? svgBuilding : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
                              {isAgency ? 'Agence' : 'Co-propriétaire'}
                            </span>
                            <span style={{ color: 'var(--gray-600)' }}>{coOwner.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="co-status-section">
                        <span className={`co-badge ${coOwner.status === 'active' ? 'co-badge-active' : coOwner.status === 'inactive' ? 'co-badge-inactive' : 'co-badge-suspended'}`}>
                          {coOwner.status === 'active' ? svgCheck : svgClock}
                          {coOwner.status === 'active' ? 'Actif' : coOwner.status === 'inactive' ? 'Inactif' : 'Suspendu'}
                        </span>
                        {coOwner.joined_at && <span className="co-date-text">Rejoint le {formatDate(coOwner.joined_at)}</span>}
                        {coOwner.created_at && <span className="co-date-text" style={{ color: 'var(--gray-400)' }}>Créé le {formatDate(coOwner.created_at)}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="co-quick-info">
                    <div className="co-quick-info-wrapper">
                      <div className="co-info-tags">
                        {coOwner.phone && <span className="co-info-tag">{svgPhone}{coOwner.phone}</span>}
                        <span className="co-info-tag">{svgKey}{coOwner.delegations_count || 0} délégation(s)</span>
                        {coOwner.address_billing && <span className="co-info-tag">{svgPin}<span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coOwner.address_billing}</span></span>}
                      </div>
                      <div className="co-action-buttons">
                        <button className="co-toggle-btn" onClick={() => toggleExpanded(coOwner.id)}>
                          Détails {svgChevron(isExpanded)}
                        </button>
                        <button className="co-view-btn" onClick={() => window.location.href = `/proprietaire/coproprietaires/${coOwner.id}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M22 12c-2.667 4.667-6 7-10 7s-7.333-2.333-10-7c2.667-4.667 6-7 10-7s7.333 2.333 10 7z"/></svg>
                          Voir
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="co-details-section">
                      <div className="co-details-grid">
                        <div className="co-detail-card">
                          <div className="co-detail-title">{svgUser}Informations {isAgency ? "de l'agence" : 'personnelles'}</div>
                          {[
                            { label: 'Nom complet', val: `${coOwner.first_name} ${coOwner.last_name}`, icon: null },
                            { label: 'Email', val: coOwner.email, icon: svgMail },
                            coOwner.phone ? { label: 'Téléphone', val: coOwner.phone, icon: svgPhone } : null,
                            coOwner.company_name ? { label: 'Entreprise', val: coOwner.company_name, icon: null } : null,
                            coOwner.address_billing ? { label: 'Adresse', val: coOwner.address_billing, icon: null } : null,
                            coOwner.joined_at ? { label: 'Rejoint le', val: formatDate(coOwner.joined_at), icon: null } : null,
                          ].filter(Boolean).map((item: any) => (
                            <div key={item.label} className="co-info-row">
                              <div className="co-info-label">{item.label}</div>
                              <div className="co-info-value">{item.icon}{item.val}</div>
                            </div>
                          ))}
                        </div>

                        {isAgency && (coOwner.ifu || coOwner.rccm || coOwner.vat_number) && (
                          <div className="co-detail-card" style={{ borderColor: '#d8b4fe' }}>
                            <div className="co-detail-title" style={{ color: 'var(--purple)' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" strokeWidth="2"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                              Documents professionnels
                            </div>
                            {coOwner.ifu && <div className="co-info-row"><div className="co-info-label">IFU</div><div className="co-info-value">{coOwner.ifu}</div></div>}
                            {coOwner.rccm && <div className="co-info-row"><div className="co-info-label">RCCM</div><div className="co-info-value">{coOwner.rccm}</div></div>}
                            {coOwner.vat_number && <div className="co-info-row"><div className="co-info-label">Numéro TVA</div><div className="co-info-value">{coOwner.vat_number}</div></div>}
                          </div>
                        )}

                        <div className="co-detail-card">
                          <div className="co-detail-title">{svgKey}Délégations ({coOwner.delegations_count || 0})</div>
                          {[
                            { label: 'Actives', count: coOwner.delegations?.filter(d => d.status === 'active').length || 0, bg: '#f0fdf4', iconColor: 'var(--green)' },
                            { label: 'Expirées', count: coOwner.delegations?.filter(d => d.status === 'expired').length || 0, bg: 'var(--gray-50)', iconColor: 'var(--gray-500)' },
                            { label: 'Révoquées', count: coOwner.delegations?.filter(d => d.status === 'revoked').length || 0, bg: '#fef2f2', iconColor: 'var(--red)' },
                          ].filter(s => s.count > 0 || s.label === 'Actives').map(s => (
                            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: s.bg, borderRadius: '0.75rem', marginBottom: '0.75rem' }}>
                              <div style={{ padding: '0.5rem', background: 'white', borderRadius: '0.5rem' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.iconColor} strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                              </div>
                              <div><p style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{s.count}</p><p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{s.label}</p></div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="co-delegations-header">
                          <div className="co-delegations-title">
                            <div className="co-title-icon">{svgKey}</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gray-900)' }}>Biens délégués ({coOwner.delegations_count || 0})</h3>
                          </div>
                          <button className="co-btn co-btn-primary co-btn-sm" onClick={() => handleDelegate(coOwner)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                            Ajouter une délégation
                          </button>
                        </div>

                        {coOwner.delegations && coOwner.delegations.length > 0 ? (
                          <div className="co-delegations-grid">
                            {coOwner.delegations.map(del => (
                              <div key={del.id} className="co-delegation-card">
                                <div className="co-delegation-header">
                                  <div className="co-property-info">
                                    <div className="co-property-icon">{svgHome}</div>
                                    <div>
                                      <div className="co-property-name">{del.property?.name || 'Bien sans nom'}</div>
                                      <div className="co-property-badges">
                                        <span className={`co-badge ${del.status === 'active' ? 'co-badge-active' : del.status === 'revoked' ? 'co-badge-suspended' : 'co-badge-inactive'}`}>
                                          {del.status === 'active' ? <>{svgCheck} Active</> : del.status === 'revoked' ? 'Révoquée' : 'Expirée'}
                                        </span>
                                        {del.property?.surface && <span className="co-badge co-badge-coowner">{del.property.surface} m²</span>}
                                      </div>
                                    </div>
                                  </div>
                                  {del.expires_at && (
                                    <div className="co-expiry-badge">
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                      <div>
                                        <div style={{ fontSize: '0.7rem', color: '#92400e' }}>Expire le</div>
                                        <div style={{ fontWeight: 700, color: '#92400e' }}>{formatDate(del.expires_at)}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="co-property-details">
                                  <div className="co-property-grid">
                                    <div className="co-property-item">
                                      <div className="co-item-icon">{svgPin}</div>
                                      <div className="co-item-content"><p>Adresse</p><span>{del.property?.address}, {del.property?.city}</span></div>
                                    </div>
                                    {del.property?.surface && (
                                      <div className="co-property-item">
                                        <div className="co-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg></div>
                                        <div className="co-item-content"><p>Surface</p><span>{del.property.surface} m²</span></div>
                                      </div>
                                    )}
                                    <div className="co-property-item">
                                      <div className="co-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
                                      <div className="co-item-content"><p>Déléguée le</p><span>{formatDate(del.delegated_at)}</span></div>
                                    </div>
                                    {del.property?.rent_amount && (
                                      <div className="co-property-item">
                                        <div className="co-item-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg></div>
                                        <div className="co-item-content"><p>Loyer mensuel</p><span>{del.property.rent_amount} FCFA</span></div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {del.notes && (
                                  <div className="co-notes-box">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                      <span style={{ fontWeight: 600 }}>Notes</span>
                                    </div>
                                    {del.notes}
                                  </div>
                                )}

                                {del.permissions?.length > 0 && (
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                      <span style={{ fontWeight: 600 }}>Permissions</span>
                                    </div>
                                    <div className="co-permissions-grid">
                                      {del.permissions.map(p => (
                                        <div key={p} className="co-permission-item">
                                          <div className="co-permission-icon">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                          </div>
                                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{getPermissionLabel(p)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="co-del-empty">
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                            <p style={{ fontWeight: 600, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>Aucune délégation active</p>
                            <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Aucun bien n'a été délégué à ce gestionnaire</p>
                            <button className="co-btn co-btn-primary" onClick={() => handleDelegate(coOwner)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                              Déléguer un bien
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredInvitations.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-900)', marginBottom: '1rem' }}>Invitations en attente</h3>
                <div className="co-invitations-grid">
                  {filteredInvitations.map(inv => {
                    const meta = inv.meta || {};
                    return (
                      <div key={inv.id} className="co-invitation-card">
                        <div className="co-invitation-header">
                          <div className="co-invitation-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <div>
                                <p style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{meta.first_name || ''} {meta.last_name || ''}</p>
                                <p style={{ color: 'var(--gray-600)' }}>{inv.email}</p>
                              </div>
                              <span className="co-badge co-badge-pending">En attente</span>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                {inv.invitation_type === 'agency' ? svgBuilding : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}
                                {inv.invitation_type === 'agency' ? 'Agence' : 'Co-propriétaire'}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                Expire le {formatDate(inv.expires_at)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="co-btn co-btn-outline co-btn-sm"
                                style={{ flex: 1 }}
                                onClick={() => resendInvitation(inv.id)}
                              >
                                Renvoyer
                              </button>
                              <button
                                className="co-btn co-btn-outline co-btn-sm"
                                style={{ borderColor: '#fecaca', color: 'var(--red)' }}
                                onClick={() => cancelInvitation(inv.id)}
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedCoOwner && (
          <DelegatePropertyModal
            isOpen={showDelegateModal}
            onClose={handleCloseDelegateModal}
            coOwner={{ id: selectedCoOwner.id, first_name: selectedCoOwner.first_name, last_name: selectedCoOwner.last_name, email: selectedCoOwner.email, invitation_type: selectedCoOwner.invitation_type }}
            notify={notify}
          />
        )}

        {/* Modal de confirmation */}
        <div
          className={`co-modal-overlay${confirmModal.open ? ' active' : ''}`}
          onClick={e => { if (e.target === e.currentTarget) closeConfirmModal(); }}
        >
          <div className="co-modal-container">
            <div className={`co-modal-icon ${confirmModal.type}`}>
              {confirmModal.type === 'danger' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : confirmModal.type === 'info' ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
            </div>
            <h3 className="co-modal-title">{confirmModal.title}</h3>
            <p className="co-modal-message">{confirmModal.message}</p>
            <div className="co-modal-actions">
              <button className="co-modal-btn co-modal-btn-secondary" onClick={closeConfirmModal} disabled={confirmModal.loading}>
                Annuler
              </button>
              <button
                className={`co-modal-btn ${confirmModal.type === 'danger' ? 'co-modal-btn-danger' : 'co-modal-btn-primary'}`}
                onClick={handleModalConfirm}
                disabled={confirmModal.loading}
              >
                {confirmModal.loading ? 'En cours...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};