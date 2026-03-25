// src/pages/Locataire/components/Documents.tsx

import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, ChevronDown, Search, FileText, Calendar, Home, User,
  Upload, X, Loader2, Phone, Image, File, Download, Share2, Users,
  Mail, CheckCircle, AlertCircle, AlertOctagon, Info, Eye, Archive,
  RefreshCw, MapPin, Briefcase, DollarSign, Globe, Copy, Link2,
  Facebook, Twitter, Check, FileSignature, ClipboardList, Building2,
  Key, DoorOpen, Camera, FileCheck, FileX, UserCheck, UserX,
  Signature
} from 'lucide-react';
import { Card } from './ui/Card';
import api from '@/services/api';

interface DocumentsProps {
  notify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface Document {
  id: number;
  uuid: string;
  name: string;
  type: string;
  bien: string | null;
  description: string | null;
  file_url: string;
  file_size_formatted: string;
  file_type: string;
  is_shared: boolean;
  shared_with_users: Array<{ id: number, name: string, email: string }>;
  shared_with_emails?: string[];
  status: 'actif' | 'archive';
  document_date: string | null;
  created_at: string;
  icon: string;
  property?: { id: number; name: string; };
  property_id?: number;
  lease?: { id: number; uuid: string; };
  lease_id?: number;
  shared_with?: number[];
  category?: string;
  created_by?: number;
  created_by_name?: string;
}

interface Lease {
  id: number;
  uuid: string;
  property_id: number;
  property?: { id: number; name: string; address: string; };
  start_date: string;
  end_date: string | null;
  rent_amount: number;
  deposit: number;
  type: string;
  status: string;
  tenant_id: number;
  created_at: string;
  landlord_signature?: string | null;
  tenant_signature?: string | null;
  signed_document?: string | null;
  signed_at?: string | null;
}

interface ConditionReport {
  id: number;
  uuid: string;
  property_id: number;
  lease_id: number;
  type: 'entry' | 'exit';
  report_date: string;
  status: 'draft' | 'pending_landlord' | 'pending_tenant' | 'signed';
  created_by: number;
  created_by_name: string;
  signature_tenant: boolean;
  signature_landlord: boolean;
  tenant_signed_at: string | null;
  landlord_signed_at: string | null;
  is_signed: boolean;
  property?: { id: number; name: string; address: string; };
  lease?: { id: number; uuid: string; };
  photos: Array<{ id: number; url: string; caption: string; room: string; }>;
  notes: string;
  file_url?: string;
}

interface Template {
  id: number;
  name: string;
  description: string;
  type: string;
  file_url: string;
  icon: string;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  role: string;
  type: string;
  property?: string;
}

interface Dossier {
  id: number;
  uuid: string;
  nom: string;
  prenoms: string;
  date_naissance: string | null;
  a_propos: string | null;
  email: string;
  telephone: string | null;
  adresse: string | null;
  complement: string | null;
  ville: string | null;
  pays: string | null;
  region: string | null;
  type_activite: string | null;
  profession: string | null;
  revenus_mensuels: number | null;
  has_garant: boolean;
  garant_type: string | null;
  garant_description: string | null;
  documents: number[];
  is_shared: boolean;
  shared_with: number[];
  shared_with_emails: string[];
  shared_with_users: Array<{ id: number, name: string, email: string }>;
  status: 'brouillon' | 'publie' | 'archive';
  share_url: string | null;
  shareable_url?: string;
  created_at: string;
  updated_at: string;
}

interface FilterOptions {
  properties: Array<{ id: number, name: string }>;
  types: string[];
  periodes: string[];
  lease_types: string[];
  report_types: string[];
  lease_statuses?: Record<string, string>;
}

// ==================== MODAL CONFIRMATION SIGNATURE EDL ====================
interface ConditionReportSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  report: ConditionReport | null;
  isSubmitting: boolean;
}

const ConditionReportSignatureModal: React.FC<ConditionReportSignatureModalProps> = ({
  isOpen, onClose, onConfirm, report, isSubmitting
}) => {
  if (!isOpen || !report) return null;

  const typeLabel = report.type === 'entry' ? "d'entrée" : 'de sortie';

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardList size={20} className="text-[#70AE48]" />
            Signer l'état des lieux
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded-r-lg">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700">
                En signant, vous confirmez avoir pris connaissance de l'état des lieux {typeLabel} et en acceptez le contenu.
              </p>
            </div>
          </div>

          <div className="mb-4 space-y-1">
            <p className="text-sm text-gray-600">
              Type : <span className="font-semibold">État des lieux {typeLabel}</span>
            </p>
            {report.property && (
              <p className="text-sm text-gray-600">
                Bien : <span className="font-semibold">{report.property.name}</span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              Date : <span className="font-semibold">
                {new Date(report.report_date).toLocaleDateString('fr-FR')}
              </span>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-5 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut des signatures</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Votre signature</span>
              <span className="text-yellow-600 flex items-center gap-1">
                <AlertCircle size={14} /> En attente
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Signature propriétaire</span>
              {report.signature_landlord ? (
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle size={14} /> Signé
                </span>
              ) : (
                <span className="text-yellow-600 flex items-center gap-1">
                  <AlertCircle size={14} /> En attente
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-[#70AE48] text-white rounded-xl font-medium hover:bg-[#5a8f3a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Signature...</>
              ) : (
                <><Signature size={18} /> Signer</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL LEASE VIEWER ====================
interface LeaseViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease: Lease | null;
  notify?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onDownloadContract?: (lease: Lease) => void;
  onSignContract?: (lease: Lease) => void;
  onViewSignedContract?: (lease: Lease) => void;
}

const LeaseViewerModal: React.FC<LeaseViewerModalProps> = ({
  isOpen, onClose, lease, notify, onDownloadContract, onSignContract, onViewSignedContract
}) => {
  if (!isOpen || !lease) return null;

  const hasSignedDocument = !!lease.signed_document;
  const hasTenantSigned = !!lease.tenant_signature;
  const hasLandlordSigned = !!lease.landlord_signature;
  
  // Si un document signé existe, les deux signatures sont considérées comme signées
  const showTenantSigned = hasSignedDocument || hasTenantSigned;
  const showLandlordSigned = hasSignedDocument || hasLandlordSigned;
  const isFullySigned = hasSignedDocument || (hasTenantSigned && hasLandlordSigned);
  const canSign = lease.status === 'pending_signature' && !hasTenantSigned && !hasSignedDocument;

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatMoney = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(n);

  const getStatusBadge = (status: string, isSigned: boolean) => {
    if (isSigned) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Contrat signé</span>;
    }
    switch(status) {
      case 'active': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Actif</span>;
      case 'pending_signature': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">En attente de signature</span>;
      case 'terminated': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Résilié</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileSignature size={20} className="text-[#70AE48]" />
            Contrat de bail
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <div className="bg-gradient-to-r from-[#70AE48]/10 to-[#FFB74D]/10 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{lease.property?.name || 'Bien'}</h3>
                <p className="text-sm text-gray-600 mt-1">{lease.property?.address || ''}</p>
              </div>
              {getStatusBadge(lease.status, isFullySigned)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-xs text-gray-500">Début</p><p className="text-sm font-semibold">{formatDate(lease.start_date)}</p></div>
              <div><p className="text-xs text-gray-500">Fin</p><p className="text-sm font-semibold">{lease.end_date ? formatDate(lease.end_date) : 'Indéterminée'}</p></div>
              <div><p className="text-xs text-gray-500">Loyer mensuel</p><p className="text-sm font-semibold">{formatMoney(lease.rent_amount)}</p></div>
              <div><p className="text-xs text-gray-500">Dépôt de garantie</p><p className="text-sm font-semibold">{formatMoney(lease.deposit)}</p></div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Signature size={16} className="text-[#70AE48]" />
              Statut des signatures
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Votre signature</span>
                {showTenantSigned ? (
                  <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Signé</span>
                ) : (
                  <span className="text-sm text-yellow-600 flex items-center gap-1"><AlertCircle size={16} /> En attente</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Signature du propriétaire</span>
                {showLandlordSigned ? (
                  <span className="text-sm text-green-600 flex items-center gap-1"><CheckCircle size={16} /> Signé</span>
                ) : (
                  <span className="text-sm text-yellow-600 flex items-center gap-1"><AlertCircle size={16} /> En attente</span>
                )}
              </div>
              {hasSignedDocument && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <FileCheck size={12} /> Document signé uploadé
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Fermer</button>
            {canSign && (
              <button onClick={() => onSignContract?.(lease)} className="px-4 py-2 bg-[#70AE48] text-white rounded-lg hover:bg-[#5a8f3a] transition-colors flex items-center gap-2">
                <Signature size={18} /> Signer le contrat
              </button>
            )}
            {lease.signed_document ? (
              <button onClick={() => onViewSignedContract?.(lease)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Eye size={18} /> Voir le contrat signé
              </button>
            ) : (
              <button onClick={() => onDownloadContract?.(lease)} className="px-4 py-2 bg-[#70AE48] text-white rounded-lg hover:bg-[#5a8f3a] transition-colors flex items-center gap-2">
                <Download size={18} /> Télécharger le contrat
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL SIGNATURE BAIL ====================
interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  lease: Lease | null;
  isSubmitting: boolean;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm, lease, isSubmitting }) => {
  if (!isOpen || !lease) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Signature size={20} className="text-[#70AE48]" /> Signer le contrat
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
              <p className="text-sm text-yellow-700">En signant ce contrat, vous reconnaissez avoir lu et accepté toutes les conditions du bail.</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Bien : <span className="font-semibold">{lease.property?.name}</span>
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} disabled={isSubmitting} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60">Annuler</button>
            <button onClick={onConfirm} disabled={isSubmitting} className="flex-1 px-4 py-3 bg-[#70AE48] text-white rounded-xl font-medium hover:bg-[#5a8f3a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Signature...</> : <><Signature size={18} /> Signer</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MODAL SHARE ====================
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  notify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, shareUrl, title, notify }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    notify?.('Lien copié', 'success');
    setTimeout(() => setCopied(false), 2000);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-slideUp">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2"><Share2 size={20} className="text-[#70AE48]" /> Partager</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">{title}</p>
          <div className="flex gap-2">
            <input type="text" value={shareUrl} readOnly className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm" />
            <button onClick={handleCopy} className="px-4 py-2.5 bg-[#70AE48] text-white rounded-lg hover:bg-[#5a8f3a] transition-colors flex items-center gap-2">
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPOSANT PRINCIPAL ====================
export const Documents: React.FC<DocumentsProps> = ({ notify }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'dossier'>('documents');
  const [activeFilter, setActiveFilter] = useState<'actifs' | 'archives' | 'templates' | 'contrats' | 'etats_lieux' | 'proprio'>('actifs');

  const [documents, setDocuments] = useState<Document[]>([]);
  const [ownerDocuments, setOwnerDocuments] = useState<Document[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [conditionReports, setConditionReports] = useState<ConditionReport[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    properties: [], types: [], periodes: ['Toutes'], lease_types: [], report_types: []
  });

  const [actifsCount, setActifsCount] = useState(0);
  const [archivesCount, setArchivesCount] = useState(0);
  const [templatesCount, setTemplatesCount] = useState(0);
  const [contratsCount, setContratsCount] = useState(0);
  const [etatsLieuxCount, setEtatsLieuxCount] = useState(0);
  const [ownerDocumentsCount, setOwnerDocumentsCount] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLeaseViewer, setShowLeaseViewer] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [showConditionReportSignatureModal, setShowConditionReportSignatureModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [selectedConditionReport, setSelectedConditionReport] = useState<ConditionReport | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareTitle, setShareTitle] = useState('');

  // Filtres
  const [itemsPerPage, setItemsPerPage] = useState('10');
  const [showItemsDropdown, setShowItemsDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [periode, setPeriode] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('');

  // Suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [docToDelete, setDocToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Formulaire nouveau document
  const [newDocument, setNewDocument] = useState<Partial<Document>>({ name: '', type: '', bien: '', description: '', is_shared: false, shared_with: [] });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Dossier form
  const [dossierForm, setDossierForm] = useState({
    nom: '', 
    prenoms: '', 
    date_naissance: '', 
    a_propos: '', 
    email: '',
    telephone: '', 
    adresse: '', 
    complement: '',
    ville: '', 
    pays: '', 
    region: '',
    type_activite: '', 
    profession: '', 
    revenus_mensuels: '',
    has_garant: false, 
    garant_type: '', 
    garant_description: '',
    is_shared: false, 
    shared_with: [] as number[], 
    shared_with_emails: [] as string[],
  });

  const PRIMARY_COLOR = '#70AE48';

  const typeOptions = [
    { value: 'acte_vente', label: 'Acte de vente' },
    { value: 'bail', label: 'Bail' },
    { value: 'quittance', label: 'Quittance' },
    { value: 'dpe', label: 'DPE' },
    { value: 'diagnostic', label: 'Diagnostic' },
    { value: 'etat_des_lieux', label: 'État des lieux' },
    { value: 'contrat_bail', label: 'Contrat de bail' },
    { value: 'autre', label: 'Autre' }
  ];

  const activityOptions = [
    'Salarié CDI', 'Salarié CDD', 'Gérant salarié', 'Non salarié',
    'Fonctionnaire', 'Etudiant', 'Intermittent du spectacle',
    'Intérimaire', 'Assistante maternelle', 'Retraité', 'Autre'
  ];

  const paysOptions = ['Bénin', 'France', 'Belgique', 'Suisse', 'Luxembourg', 'Canada', 'Autre'];

  const garantTypeOptions = [
    { value: 'personne_physique', label: 'Personne physique' },
    { value: 'organismo', label: 'Organisme ou société' },
    { value: 'bancaire', label: 'Garantie bancaire' },
    { value: 'autre', label: 'Autre' }
  ];

  useEffect(() => {
    fetchDocuments();
    fetchLeases();
    fetchConditionReports();
    fetchTemplates();
    fetchDossier();
    fetchFilterOptions();
    fetchOwnerDocuments();
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') {
      if (activeFilter === 'actifs' || activeFilter === 'archives') fetchDocuments();
      else if (activeFilter === 'proprio') fetchOwnerDocuments();
      else if (activeFilter === 'contrats') fetchLeases();
      else if (activeFilter === 'etats_lieux') fetchConditionReports();
    }
  }, [activeFilter, searchQuery, periode, typeFilter, propertyFilter, itemsPerPage]);

  useEffect(() => {
    if (newDocument.property_id) fetchContacts(newDocument.property_id);
    else setContacts([]);
  }, [newDocument.property_id]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        per_page: itemsPerPage,
        ...(searchQuery && { search: searchQuery }),
        ...(periode && periode !== 'Toutes' && { periode }),
        ...(typeFilter && { type: typeFilter }),
        ...(propertyFilter && { property_id: propertyFilter }),
        status: activeFilter === 'actifs' ? 'actifs' : 'archives',
      });
      const response = await api.get(`/tenant/documents?${params}`);
      if (response.data.success) {
        setDocuments(response.data.data.data || []);
        setActifsCount(response.data.actifs_count || 0);
        setArchivesCount(response.data.archives_count || 0);
      }
    } catch (error) {
      console.warn('Silent fail documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchOwnerDocuments = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tenant/documents/from-owners');
      if (response.data.success) {
        setOwnerDocuments(response.data.data || []);
        setOwnerDocumentsCount(response.data.total || 0);
      }
    } catch (error) {
      console.warn('Silent fail owner docs');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeases = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(propertyFilter && { property_id: propertyFilter }),
      });
      const response = await api.get(`/tenant/leases?${params}`);
      if (response.data.success) {
        setLeases(response.data.data || []);
        setContratsCount(response.data.total || 0);
      }
    } catch (error) {
      console.warn('Silent fail leases');
    } finally {
      setLoading(false);
    }
  };

  const fetchConditionReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(searchQuery && { search: searchQuery }),
        ...(propertyFilter && { property_id: propertyFilter }),
        ...(typeFilter && typeFilter !== 'all' && { type: typeFilter }),
      });
      const response = await api.get(`/tenant/condition-reports?${params}`);
      if (response.data.success) {
        setConditionReports(response.data.data || []);
        setEtatsLieuxCount(response.data.total || 0);
      }
    } catch (error) {
      console.warn('Silent fail condition reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/tenant/documents/templates');
      if (response.data.success) {
        setTemplates(response.data.data || []);
        setTemplatesCount(response.data.data?.length || 0);
      }
    } catch (error) { console.error('Erreur templates:', error); }
  };

  const fetchDossier = async () => {
    try {
      const response = await api.get('/tenant/dossier');
      if (response.data.success) {
        setDossier(response.data.data);
        const d = response.data.data;
        setDossierForm({
          nom: d.nom || '', 
          prenoms: d.prenoms || '', 
          date_naissance: d.date_naissance || '',
          a_propos: d.a_propos || '', 
          email: d.email || '', 
          telephone: d.telephone || '',
          adresse: d.adresse || '', 
          complement: d.complement || '',
          ville: d.ville || '',
          pays: d.pays || '', 
          region: d.region || '', 
          type_activite: d.type_activite || '',
          profession: d.profession || '', 
          revenus_mensuels: d.revenus_mensuels?.toString() || '',
          has_garant: d.has_garant || false, 
          garant_type: d.garant_type || '',
          garant_description: d.garant_description || '', 
          is_shared: d.is_shared || false,
          shared_with: d.shared_with || [], 
          shared_with_emails: d.shared_with_emails || [],
        });
      }
    } catch (error) { console.error('Erreur dossier:', error); }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await api.get('/tenant/documents/filters/options');
      if (response.data.success) setFilterOptions(response.data.data);
    } catch (error) { console.error('Erreur filtres:', error); }
  };

  const fetchContacts = async (propertyId?: number) => {
    try {
      const params = propertyId ? `?property_id=${propertyId}` : '';
      const response = await api.get(`/tenant/documents/shareable-contacts${params}`);
      setContacts(response.data);
    } catch (error) { console.error('Erreur contacts:', error); }
  };

  // Handlers documents
  const handleDeleteClick = (id: number) => { setDocToDelete(id); setShowDeleteConfirm(true); };

  const handleConfirmDelete = async () => {
    if (!docToDelete) return;
    setDeleting(true);
    try {
      const response = await api.delete(`/tenant/documents/${docToDelete}`);
      if (response.data.success) {
        setDocuments(documents.filter(d => d.id !== docToDelete));
        notify?.('Document supprimé avec succès', 'success');
        fetchDocuments();
      }
    } catch (error) {
      notify?.('Erreur lors de la suppression', 'error');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDocToDelete(null);
    }
  };

  const handleArchive = async (doc: Document) => {
    try {
      await api.post(`/tenant/documents/${doc.id}/archive`);
      notify?.('Document archivé', 'success');
      fetchDocuments();
    } catch { notify?.('Erreur archivage', 'error'); }
  };

  const handleRestore = async (doc: Document) => {
    try {
      await api.post(`/tenant/documents/${doc.id}/restore`);
      notify?.('Document restauré', 'success');
      fetchDocuments();
    } catch { notify?.('Erreur restauration', 'error'); }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(`/tenant/documents/${doc.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.name);
      window.document.body.appendChild(link);
      link.click();
      setTimeout(() => { window.document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
      notify?.('Téléchargement réussi', 'success');
    } catch { notify?.('Erreur téléchargement', 'error'); }
  };

  const handleViewDocument = async (doc: Document) => {
    try {
      const response = await api.get(`/tenant/documents/${doc.id}/view`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch {
      if (doc.file_url) window.open(doc.file_url, '_blank');
      else notify?.('Erreur visualisation', 'error');
    }
  };

  // Handlers baux
  const handleDownloadLeaseContract = async (lease: Lease) => {
    try {
      const response = await api.get(`/tenant/leases/${lease.uuid}/contract`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrat_bail_${lease.property?.name || lease.uuid}.pdf`);
      window.document.body.appendChild(link);
      link.click();
      setTimeout(() => { window.document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
      notify?.('Contrat téléchargé', 'success');
    } catch { notify?.('Erreur téléchargement contrat', 'error'); }
  };

  const handleViewSignedLeaseContract = async (lease: Lease) => {
    try {
      const response = await api.get(`/tenant/leases/${lease.uuid}/signed`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch { notify?.('Erreur visualisation contrat signé', 'error'); }
  };

  const handleSignLeaseContract = async () => {
    if (!selectedLease) return;
    setSubmitting(true);
    try {
      const response = await api.post(`/tenant/leases/${selectedLease.uuid}/sign`);
      if (response.data.success) {
        notify?.(response.data.message, 'success');
        setShowSignatureModal(false);
        setSelectedLease(null);
        fetchLeases();
      }
    } catch (error: any) {
      notify?.(error.response?.data?.message || 'Erreur lors de la signature', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignLease = (lease: Lease) => {
    setSelectedLease(lease);
    setShowSignatureModal(true);
  };

  // Handlers états des lieux
  const handleSignConditionReport = (report: ConditionReport) => {
    setSelectedConditionReport(report);
    setShowConditionReportSignatureModal(true);
  };

  const handleConfirmSignConditionReport = async () => {
    if (!selectedConditionReport) return;
    setSubmitting(true);
    try {
      const response = await api.post(`/tenant/condition-reports/${selectedConditionReport.id}/sign`);
      if (response.data.success) {
        notify?.(response.data.message, 'success');
        setShowConditionReportSignatureModal(false);
        setSelectedConditionReport(null);
        fetchConditionReports();
      }
    } catch (error: any) {
      notify?.(error.response?.data?.message || 'Erreur lors de la signature', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadConditionReport = async (report: ConditionReport) => {
    try {
      const response = await api.get(`/tenant/condition-reports/${report.id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `etat_des_lieux_${report.type}_${report.report_date}.pdf`);
      window.document.body.appendChild(link);
      link.click();
      setTimeout(() => { window.document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
      notify?.('État des lieux téléchargé', 'success');
    } catch { notify?.('Erreur téléchargement EDL', 'error'); }
  };

  const handleViewConditionReport = async (report: ConditionReport) => {
    try {
      const response = await api.get(`/tenant/condition-reports/${report.id}/view`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch {
      if (report.file_url) window.open(report.file_url, '_blank');
      else notify?.('Erreur visualisation', 'error');
    }
  };

  // Handlers dossier
  const handleDownloadDossier = async () => {
    try {
      const response = await api.get('/tenant/dossier/download', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dossier_${dossierForm.nom}_${dossierForm.prenoms}.pdf`);
      window.document.body.appendChild(link);
      link.click();
      setTimeout(() => { window.document.body.removeChild(link); window.URL.revokeObjectURL(url); }, 100);
      notify?.('Dossier téléchargé', 'success');
    } catch { notify?.('Erreur téléchargement dossier', 'error'); }
  };

  const handleShareDossier = () => {
    if (dossier?.shareable_url) {
      setShareUrl(dossier.shareable_url);
      setShareTitle(`Dossier de ${dossierForm.nom} ${dossierForm.prenoms}`);
      setShowShareModal(true);
    }
  };

  const handleSaveDossier = async () => {
    setSubmitting(true);
    try {
      const response = await api.put('/tenant/dossier', dossierForm);
      if (response.data.success) { notify?.('Dossier enregistré', 'success'); fetchDossier(); }
    } catch { notify?.('Erreur enregistrement dossier', 'error'); }
    finally { setSubmitting(false); }
  };

  const handlePublishDossier = async () => {
    try {
      const response = await api.post('/tenant/dossier/publish');
      if (response.data.success) { notify?.('Dossier publié', 'success'); fetchDossier(); }
    } catch { notify?.('Erreur publication dossier', 'error'); }
  };

  const handleCreateDocument = async () => {
    if (!selectedFile) { notify?.('Veuillez sélectionner un fichier', 'error'); return; }
    if (!newDocument.type) { notify?.('Veuillez sélectionner un type', 'error'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', newDocument.name || selectedFile.name);
      formData.append('type', newDocument.type);
      formData.append('file', selectedFile);
      if (newDocument.bien) formData.append('bien', newDocument.bien);
      if (newDocument.description) formData.append('description', newDocument.description);
      if (newDocument.property_id) formData.append('property_id', newDocument.property_id.toString());
      formData.append('is_shared', newDocument.is_shared ? '1' : '0');
      if (newDocument.is_shared && newDocument.shared_with?.length) {
        newDocument.shared_with.forEach(id => formData.append('shared_with[]', id.toString()));
      }
      const response = await api.post('/tenant/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setDocuments([response.data.data, ...documents]);
        setNewDocument({ name: '', type: '', bien: '', description: '', property_id: undefined, is_shared: false, shared_with: [] });
        setSelectedFile(null);
        setShowAddModal(false);
        notify?.('Document ajouté', 'success');
        fetchDocuments();
      }
    } catch { notify?.('Erreur ajout document', 'error'); }
    finally { setSubmitting(false); }
  };

  // Helpers UI
  const getFileIcon = (fileType: string) => {
    if (fileType?.startsWith('image/')) return <Image size={20} className="text-blue-600" />;
    if (fileType?.includes('pdf')) return <FileText size={20} className="text-red-600" />;
    return <File size={20} className="text-gray-600" />;
  };

  const getLeaseIcon = (status: string, hasSignedDocument: boolean, isFullySigned: boolean) => {
    if (isFullySigned || hasSignedDocument) return <FileCheck size={20} className="text-green-600" />;
    if (status === 'active') return <FileCheck size={20} className="text-green-600" />;
    if (status === 'pending_signature') return <FileSignature size={20} className="text-yellow-600" />;
    if (status === 'terminated') return <FileX size={20} className="text-red-600" />;
    return <FileSignature size={20} className="text-gray-600" />;
  };

  const getReportIcon = (type: string, isSigned: boolean) => {
    if (type === 'entry') return <DoorOpen size={20} className={isSigned ? 'text-green-600' : 'text-blue-600'} />;
    return <Key size={20} className={isSigned ? 'text-green-600' : 'text-orange-600'} />;
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const filteredDocuments = documents
    .filter(doc => !typeFilter || doc.type === typeFilter)
    .filter(doc => !searchQuery || doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || doc.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  const paginatedDocuments = filteredDocuments.slice(0, parseInt(itemsPerPage));

  return (
    <>
      {/* Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={() => { setShowDeleteConfirm(false); setDocToDelete(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <AlertOctagon size={28} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Confirmer la suppression</h3>
                <p className="text-sm text-gray-500 mt-1">Cette action est irréversible</p>
              </div>
            </div>
            <p className="text-gray-600 mb-8">Êtes-vous sûr de vouloir supprimer définitivement ce document ?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteConfirm(false); setDocToDelete(null); }} disabled={deleting} className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60">Annuler</button>
              <button onClick={handleConfirmDelete} disabled={deleting} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {deleting ? <><Loader2 size={18} className="animate-spin" /> Suppression...</> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl">
              <h2 className="text-xl font-semibold text-gray-900">Ajouter un document</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-[#FFF8E7] border-l-4 border-[#FFB74D] p-4 rounded-r-lg">
                <p className="text-sm text-gray-600">Formats acceptés : PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG. Taille max : 15 Mo.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fichier <span className="text-red-500">*</span></label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                  <input type="file" onChange={e => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} className="hidden" id="file-upload" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif" />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <div className="flex flex-col items-center justify-center">
                      <Upload size={28} className="text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 text-center">{selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}</p>
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type <span className="text-red-500">*</span></label>
                <select value={newDocument.type || ''} onChange={e => setNewDocument({ ...newDocument, type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20" style={{ borderColor: `${PRIMARY_COLOR}80` }}>
                  <option value="">Sélectionnez un type</option>
                  {typeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du document</label>
                <input type="text" value={newDocument.name || ''} onChange={e => setNewDocument({ ...newDocument, name: e.target.value })} placeholder="Laissez vide pour utiliser le nom du fichier" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20" style={{ borderColor: `${PRIMARY_COLOR}80` }} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={newDocument.description || ''} onChange={e => setNewDocument({ ...newDocument, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 resize-none" style={{ borderColor: `${PRIMARY_COLOR}80` }} />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Annuler</button>
                <button onClick={handleCreateDocument} disabled={submitting || !selectedFile || !newDocument.type} className="px-4 py-2 text-white rounded-lg transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2" style={{ backgroundColor: PRIMARY_COLOR }}>
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Ajout...</> : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <SignatureModal isOpen={showSignatureModal} onClose={() => { setShowSignatureModal(false); setSelectedLease(null); }} onConfirm={handleSignLeaseContract} lease={selectedLease} isSubmitting={submitting} />
      <ConditionReportSignatureModal isOpen={showConditionReportSignatureModal} onClose={() => { setShowConditionReportSignatureModal(false); setSelectedConditionReport(null); }} onConfirm={handleConfirmSignConditionReport} report={selectedConditionReport} isSubmitting={submitting} />
      <LeaseViewerModal isOpen={showLeaseViewer} onClose={() => setShowLeaseViewer(false)} lease={selectedLease} notify={notify} onDownloadContract={handleDownloadLeaseContract} onSignContract={handleSignLease} onViewSignedContract={handleViewSignedLeaseContract} />
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} shareUrl={shareUrl} title={shareTitle} notify={notify} />

      <div className="min-h-screen bg-white p-4 sm:p-6">
        <div className="flex mb-6 max-w-4xl mx-auto">
          <button onClick={() => setActiveTab('documents')} className={`flex-1 py-3 px-6 text-sm font-medium rounded-l-lg transition-colors ${activeTab === 'documents' ? 'bg-[#FFB74D] text-white' : 'bg-[#FFF3E0] text-gray-700 hover:bg-[#FFE0B2]'}`}>MES DOCUMENTS</button>
          <button onClick={() => setActiveTab('dossier')} className={`flex-1 py-3 px-6 text-sm font-medium rounded-r-lg transition-colors ${activeTab === 'dossier' ? 'bg-[#FFB74D] text-white' : 'bg-[#FFF3E0] text-gray-700 hover:bg-[#FFE0B2]'}`}>MON DOSSIER</button>
        </div>

        {activeTab === 'dossier' ? (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-[#FFF8E7] border-l-4 border-[#FFB74D] p-4 rounded-r-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Informations</h4>
              <p className="text-sm text-gray-600">Créez votre dossier de candidature en ligne. Vous le partagez ensuite en un clic avec les propriétaires et agences immobilières de votre choix.</p>
            </div>
            <div className="flex justify-end gap-3">
              {dossier?.shareable_url && (
                <button onClick={handleShareDossier} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                  <Share2 size={18} /> Partager
                </button>
              )}
              <button onClick={handleDownloadDossier} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                <Download size={18} /> Télécharger PDF
              </button>
            </div>

            {/* Informations personnelles */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><User size={20} className="text-[#70AE48]" /> Informations personnelles</h3>
                <p className="text-sm text-gray-500">Vos informations de contact et identité</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label><input type="text" value={dossierForm.prenoms} onChange={e => setDossierForm({ ...dossierForm, prenoms: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Jean" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom</label><input type="text" value={dossierForm.nom} onChange={e => setDossierForm({ ...dossierForm, nom: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="DUPONT" /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={dossierForm.email} disabled className="w-full px-4 py-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg text-sm cursor-not-allowed" /><p className="text-xs text-gray-400 mt-1">Utilisé pour la connexion et les notifications</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" value={dossierForm.telephone} onChange={e => setDossierForm({ ...dossierForm, telephone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Votre numéro" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Situation familiale</label><select value={dossierForm.garant_type} onChange={e => setDossierForm({ ...dossierForm, garant_type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }}><option value="">Sélectionnez</option><option value="single">Célibataire</option><option value="married">Marié(e)</option><option value="divorced">Divorcé(e)</option><option value="widowed">Veuf/Veuve</option><option value="pacsed">Pacsé(e)</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label><div className="relative"><Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="date" value={dossierForm.date_naissance} onChange={e => setDossierForm({ ...dossierForm, date_naissance: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} /></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Lieu de naissance</label><input type="text" value={dossierForm.region} onChange={e => setDossierForm({ ...dossierForm, region: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Votre lieu de naissance" /></div>
              </div>
              <div className="md:col-span-2 mt-4"><label className="block text-sm font-medium text-gray-700 mb-1">A propos de vous</label><textarea value={dossierForm.a_propos} onChange={e => setDossierForm({ ...dossierForm, a_propos: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 resize-none bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Parlez de vous..." /></div>
            </Card>

            {/* Adresse actuelle */}
            <Card className="p-6">
              <div className="mb-4"><h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><MapPin size={20} className="text-[#70AE48]" /> Adresse actuelle</h3><p className="text-sm text-gray-500">Votre adresse de résidence</p></div>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label><input type="text" value={dossierForm.adresse} onChange={e => setDossierForm({ ...dossierForm, adresse: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Votre adresse" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Complément</label><input type="text" value={dossierForm.complement} onChange={e => setDossierForm({ ...dossierForm, complement: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Appartement, étage, etc." /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Ville</label><input type="text" value={dossierForm.ville} onChange={e => setDossierForm({ ...dossierForm, ville: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Votre ville" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Pays</label><select value={dossierForm.pays} onChange={e => setDossierForm({ ...dossierForm, pays: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }}><option value="">Sélectionnez...</option>{paysOptions.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
              </div>
            </Card>

            {/* Informations professionnelles */}
            <Card className="p-6">
              <div className="mb-4"><h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Briefcase size={20} className="text-[#70AE48]" /> Informations professionnelles</h3><p className="text-sm text-gray-500">Votre situation professionnelle</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Profession</label><input type="text" value={dossierForm.profession} onChange={e => setDossierForm({ ...dossierForm, profession: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Votre profession" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Employeur</label><input type="text" value={dossierForm.type_activite} onChange={e => setDossierForm({ ...dossierForm, type_activite: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Nom de l'employeur" /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Adresse de l'employeur</label><input type="text" value={dossierForm.adresse} onChange={e => setDossierForm({ ...dossierForm, adresse: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Adresse de l'employeur" /></div>
              <div className="mb-4"><label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label><select value={dossierForm.garant_type} onChange={e => setDossierForm({ ...dossierForm, garant_type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }}><option value="">Sélectionnez</option><option value="cdi">CDI</option><option value="cdd">CDD</option><option value="interim">Intérim</option><option value="freelance">Freelance</option><option value="retired">Retraité</option><option value="unemployed">Sans emploi</option><option value="student">Étudiant</option></select></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Revenu annuel (FCFA)</label><div className="relative"><DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" inputMode="numeric" value={dossierForm.revenus_mensuels} onChange={e => setDossierForm({ ...dossierForm, revenus_mensuels: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Revenu annuel" /></div></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Revenu mensuel (FCFA)</label><div className="relative"><DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" inputMode="numeric" value={dossierForm.revenus_mensuels} onChange={e => setDossierForm({ ...dossierForm, revenus_mensuels: e.target.value })} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Revenu mensuel" /></div></div>
              </div>
            </Card>

            {/* Contact d'urgence */}
            <Card className="p-6">
              <div className="mb-4"><h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Phone size={20} className="text-[#70AE48]" /> Contact d'urgence</h3><p className="text-sm text-gray-500">Personne à contacter en cas d'urgence</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label><input type="text" value={dossierForm.nom} onChange={e => setDossierForm({ ...dossierForm, nom: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Nom de la personne à contacter" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Lien de parenté</label><input type="text" value={dossierForm.garant_description} onChange={e => setDossierForm({ ...dossierForm, garant_description: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Ex: Époux, Parent, Ami..." /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label><input type="tel" value={dossierForm.telephone} onChange={e => setDossierForm({ ...dossierForm, telephone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Numéro de téléphone" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={dossierForm.email} onChange={e => setDossierForm({ ...dossierForm, email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} placeholder="Adresse email" /></div>
              </div>
            </Card>

            {/* Garant */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Users size={20} className="text-[#70AE48]" /> Garants</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-sm text-gray-600">J'ai un garant</span>
                <button onClick={() => setDossierForm({ ...dossierForm, has_garant: !dossierForm.has_garant })} className="relative w-20 h-8 rounded-full transition-colors" style={{ backgroundColor: dossierForm.has_garant ? '#70AE48' : '#EF4444' }}>
                  <div className="absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform" style={{ transform: dossierForm.has_garant ? 'translateX(46px)' : 'translateX(4px)' }} />
                </button>
                <span className="text-sm text-gray-600">Je n'ai pas de garant</span>
              </div>
              {dossierForm.has_garant && (
                <div className="space-y-4 mt-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Type de garant</label><select value={dossierForm.garant_type} onChange={e => setDossierForm({ ...dossierForm, garant_type: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }}><option value="">Choisir</option>{garantTypeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea value={dossierForm.garant_description} onChange={e => setDossierForm({ ...dossierForm, garant_description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-20 resize-none bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} /></div>
                </div>
              )}
            </Card>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mt-6">
              <button onClick={() => setActiveTab('documents')} className="px-6 py-2.5 text-red-500 border border-red-300 rounded-lg hover:bg-red-50 transition-colors" disabled={submitting}>Annuler</button>
              {dossier?.status === 'brouillon' && (<button onClick={handlePublishDossier} className="px-6 py-2.5 bg-[#FFB74D] text-white font-medium rounded-lg hover:bg-[#FFA726] transition-colors">Publier</button>)}
              <button onClick={handleSaveDossier} disabled={submitting} className="px-6 py-2.5 bg-[#70AE48] text-white font-medium rounded-lg hover:bg-[#5a8f3a] transition-colors disabled:opacity-60 min-w-[120px] flex items-center justify-center">{submitting ? <><Loader2 size={16} className="animate-spin mr-2" /> Enregistrement...</> : 'Enregistrer'}</button>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div><h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mes documents</h1><p className="text-sm text-gray-400 mt-1 font-medium">Gérez vos documents, contrats de bail et états des lieux</p></div>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#70AE48] text-white font-medium rounded-xl transition-all hover:opacity-90 shadow-md"><Plus size={18} /> Nouveau document</button>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {[
                { key: 'actifs', label: 'Tous les documents', count: actifsCount, icon: <CheckCircle size={16} /> },
                { key: 'proprio', label: 'Documents du propriétaire', count: ownerDocumentsCount, icon: <Building2 size={16} /> },
                { key: 'contrats', label: 'Contrats de bail', count: contratsCount, icon: <FileSignature size={16} /> },
                { key: 'etats_lieux', label: 'États des lieux', count: etatsLieuxCount, icon: <ClipboardList size={16} /> },
                { key: 'archives', label: 'Archives', count: archivesCount, icon: <Archive size={16} /> },
                { key: 'templates', label: 'Templates', count: templatesCount, icon: <FileText size={16} /> },
              ].map(({ key, label, count, icon }) => (
                <button key={key} onClick={() => setActiveFilter(key as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === key ? 'bg-[#70AE48] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}>
                  {icon} {label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeFilter === key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>{count}</span>
                </button>
              ))}
            </div>

            <Card className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Filtrer</h3>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative md:w-36">
                  <button onClick={() => setShowItemsDropdown(!showItemsDropdown)} className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:border-gray-400 transition-colors text-sm">
                    <span className="text-gray-400">{itemsPerPage} lignes</span>
                    <ChevronDown size={14} className="text-gray-500" />
                  </button>
                  {showItemsDropdown && (<div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">{['10', '25', '50', '100'].map(n => (<button key={n} onClick={() => { setItemsPerPage(n); setShowItemsDropdown(false); }} className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg text-sm">{n} lignes</button>))}</div>)}
                </div>
                {activeFilter === 'etats_lieux' && (<select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 md:w-48 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }}><option value="all">Tous les états des lieux</option><option value="entry">État des lieux d'entrée</option><option value="exit">État des lieux de sortie</option></select>)}
                <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 md:w-48 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }}><option value="">Tous les biens</option>{filterOptions.properties.map(p => <option key={p.id} value={p.id.toString()}>{p.name}</option>)}</select>
                <div className="relative flex-1"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={14} className="text-gray-400" /></div><input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-20 bg-white text-gray-900" style={{ borderColor: `${PRIMARY_COLOR}80` }} /></div>
              </div>
            </Card>

            <div className="space-y-3">
              {loading ? (
                <Card className="p-12 text-center"><Loader2 size={32} className="animate-spin text-[#70AE48] mx-auto mb-3" /><p className="text-gray-500">Chargement...</p></Card>
              ) : activeFilter === 'templates' ? (
                templates.length === 0 ? (<Card className="p-12 text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><FileText size={24} className="text-gray-400" /></div><h3 className="text-lg font-medium text-gray-900 mb-1">Aucun template</h3></Card>) : templates.map(template => (<Card key={template.id} className="p-4 hover:shadow-md transition-all duration-300"><div className="flex items-center justify-between"><div className="flex items-center gap-3">{getFileIcon(template.type)}<div><h3 className="text-sm font-medium text-gray-900">{template.name}</h3><p className="text-xs text-gray-500">{template.description}</p></div></div><a href={template.file_url} download className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Download size={18} className="text-[#70AE48]" /></a></div></Card>))
              ) : activeFilter === 'proprio' ? (
                ownerDocuments.length === 0 ? (<Card className="p-12 text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><Building2 size={24} className="text-gray-400" /></div><h3 className="text-lg font-medium text-gray-900 mb-1">Aucun document du propriétaire</h3><p className="text-sm text-gray-500">Votre propriétaire n'a pas encore partagé de documents avec vous</p></Card>) : ownerDocuments.map(doc => (<Card key={doc.id} className="p-4 hover:shadow-md transition-all duration-300"><div className="flex items-start justify-between gap-3"><div className="flex-1"><div className="flex items-center gap-2 mb-1">{getFileIcon(doc.file_type)}<h3 className="text-base font-semibold text-gray-900">{doc.name}</h3>{doc.created_by_name && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">{doc.created_by_name}</span>}</div><div className="flex flex-wrap items-center gap-3 mt-2">{doc.property && <div className="flex items-center gap-1 text-xs text-gray-500"><Home size={12} /><span>{doc.property.name}</span></div>}<div className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={12} /><span>{formatDate(doc.created_at)}</span></div><div className="flex items-center gap-1 text-xs text-gray-500"><FileText size={12} /><span>{doc.file_size_formatted}</span></div></div></div><div className="flex items-center gap-1"><button onClick={() => handleViewDocument(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Voir"><Eye size={16} className="text-gray-500 group-hover:text-blue-600" /></button><button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Télécharger"><Download size={16} className="text-gray-500 group-hover:text-[#70AE48]" /></button></div></div></Card>))
              ) : activeFilter === 'contrats' ? (
                leases.length === 0 ? (<Card className="p-12 text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><FileSignature size={24} className="text-gray-400" /></div><h3 className="text-lg font-medium text-gray-900 mb-1">Aucun contrat de bail</h3></Card>) : leases.map(lease => {
                  const hasSignedDocument = !!lease.signed_document;
                  const isFullySigned = hasSignedDocument || (!!lease.tenant_signature && !!lease.landlord_signature);
                  const canSign = lease.status === 'pending_signature' && !lease.tenant_signature && !hasSignedDocument;
                  
                  // Déterminer la couleur de la bordure
                  let borderColor = '#ef4444';
                  if (isFullySigned) borderColor = '#10b981';
                  else if (lease.status === 'active') borderColor = '#10b981';
                  else if (lease.status === 'pending_signature') borderColor = '#f59e0b';

                  return (
                    <Card key={lease.id} className="p-4 hover:shadow-md transition-all duration-300 border-l-4" style={{ borderLeftColor: borderColor }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {getLeaseIcon(lease.status, hasSignedDocument, isFullySigned)}
                            <h3 className="text-base font-semibold text-gray-900">Contrat de bail - {lease.property?.name || 'Bien'}</h3>
                            {isFullySigned ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={10} /> Contrat signé</span>
                            ) : lease.status === 'active' ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Actif</span>
                            ) : lease.status === 'pending_signature' ? (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">En attente de signature</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{lease.status}</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {lease.property && <div className="flex items-center gap-1 text-xs text-gray-500"><Home size={12} /><span>{lease.property.address || lease.property.name}</span></div>}
                            <div className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={12} /><span>Début: {formatDate(lease.start_date)}</span></div>
                            <div className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={12} /><span>Fin: {lease.end_date ? formatDate(lease.end_date) : 'Indéterminée'}</span></div>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {hasSignedDocument || lease.tenant_signature ? (
                              <span className="text-xs text-green-600 flex items-center gap-1"><UserCheck size={12} /> Vous avez signé</span>
                            ) : (
                              <span className="text-xs text-yellow-600 flex items-center gap-1"><UserX size={12} /> En attente de votre signature</span>
                            )}
                            {hasSignedDocument || lease.landlord_signature ? (
                              <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Propriétaire a signé</span>
                            ) : (
                              <span className="text-xs text-gray-400 flex items-center gap-1"><AlertCircle size={12} /> Propriétaire n'a pas encore signé</span>
                            )}
                          </div>
                          {hasSignedDocument && (
                            <div className="mt-2">
                              <span className="text-xs text-blue-600 flex items-center gap-1"><FileCheck size={10} /> Document signé uploadé</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedLease(lease); setShowLeaseViewer(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Voir"><Eye size={16} className="text-gray-500 group-hover:text-blue-600" /></button>
                          {canSign && (
                            <button onClick={() => handleSignLease(lease)} className="p-1.5 bg-[#70AE48] text-white rounded-lg hover:bg-[#5a8f3a] transition-colors flex items-center gap-1" title="Signer"><Signature size={14} /><span className="text-xs">Signer</span></button>
                          )}
                          {lease.signed_document ? (
                            <button onClick={() => handleViewSignedLeaseContract(lease)} className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors" title="Voir contrat signé"><FileCheck size={16} className="text-blue-600" /></button>
                          ) : (
                            <button onClick={() => handleDownloadLeaseContract(lease)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Télécharger"><Download size={16} className="text-gray-500 group-hover:text-[#70AE48]" /></button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : activeFilter === 'etats_lieux' ? (
                conditionReports.length === 0 ? (<Card className="p-12 text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><ClipboardList size={24} className="text-gray-400" /></div><h3 className="text-lg font-medium text-gray-900 mb-1">Aucun état des lieux</h3></Card>) : conditionReports.map(report => {
                  const canSign = !report.signature_tenant;
                  const typeLabel = report.type === 'entry' ? "d'entrée" : 'de sortie';

                  return (
                    <Card key={report.id} className="p-4 hover:shadow-md transition-all duration-300 border-l-4" style={{ borderLeftColor: report.is_signed ? '#10b981' : report.signature_tenant ? '#3b82f6' : '#f59e0b' }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {getReportIcon(report.type, report.is_signed)}
                            <h3 className="text-base font-semibold text-gray-900">État des lieux {typeLabel}{report.property && ` - ${report.property.name}`}</h3>
                            {report.is_signed ? (<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={10} /> Validé (2/2 signatures)</span>) : report.signature_tenant ? (<span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">En attente propriétaire</span>) : (<span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">En attente de votre signature</span>)}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {report.property && <div className="flex items-center gap-1 text-xs text-gray-500"><Home size={12} /><span>{report.property.address || report.property.name}</span></div>}
                            <div className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={12} /><span>{formatDate(report.report_date)}</span></div>
                            <div className="flex items-center gap-1 text-xs text-gray-500"><User size={12} /><span>{report.created_by_name}</span></div>
                            {report.photos && <div className="flex items-center gap-1 text-xs text-gray-500"><Camera size={12} /><span>{report.photos.length} photo{report.photos.length > 1 ? 's' : ''}</span></div>}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            {report.signature_tenant ? (<span className="text-xs text-green-600 flex items-center gap-1"><UserCheck size={12} /> Vous avez signé{report.tenant_signed_at && <span className="text-gray-400">({report.tenant_signed_at})</span>}</span>) : (<span className="text-xs text-yellow-600 flex items-center gap-1"><UserX size={12} /> En attente de votre signature</span>)}
                            {report.signature_landlord ? (<span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Propriétaire a signé</span>) : (<span className="text-xs text-gray-400 flex items-center gap-1"><AlertCircle size={12} /> Propriétaire n'a pas encore signé</span>)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {canSign && (<button onClick={() => handleSignConditionReport(report)} className="p-1.5 bg-[#70AE48] text-white rounded-lg hover:bg-[#5a8f3a] transition-colors flex items-center gap-1" title="Signer l'état des lieux"><Signature size={14} /><span className="text-xs">Signer</span></button>)}
                          {report.file_url ? (<button onClick={() => handleViewConditionReport(report)} className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors" title="Voir le rapport"><FileCheck size={16} className="text-blue-600" /></button>) : (<button onClick={() => handleDownloadConditionReport(report)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Télécharger"><Download size={16} className="text-gray-500 group-hover:text-[#70AE48]" /></button>)}
                        </div>
                      </div>
                    </Card>
                  );
                })
              ) : (
                paginatedDocuments.length === 0 ? (<Card className="p-12 text-center"><div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><FileText size={24} className="text-gray-400" /></div><h3 className="text-lg font-medium text-gray-900 mb-1">Aucun document trouvé</h3><p className="text-sm text-gray-500 mb-4">Ajoutez votre premier document</p><button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded-xl transition-all hover:opacity-90" style={{ backgroundColor: PRIMARY_COLOR }}><Plus size={16} /> Nouveau document</button></Card>) : paginatedDocuments.map(doc => (<Card key={doc.id} className="p-4 hover:shadow-md transition-all duration-300"><div className="flex items-start justify-between gap-3"><div className="flex-1"><div className="flex items-center gap-2 mb-1">{getFileIcon(doc.file_type)}<h3 className="text-base font-semibold text-gray-900">{doc.name}</h3>{doc.is_shared && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><Share2 size={10} /> Partagé</span>}{doc.status === 'archive' && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1"><Archive size={10} /> Archivé</span>}</div><div className="flex flex-wrap items-center gap-3 mt-2">{doc.property && <div className="flex items-center gap-1 text-xs text-gray-500"><Home size={12} /><span>{doc.property.name}</span></div>}<div className="flex items-center gap-1 text-xs text-gray-500"><Calendar size={12} /><span>{formatDate(doc.created_at)}</span></div><div className="flex items-center gap-1 text-xs text-gray-500"><FileText size={12} /><span>{doc.file_size_formatted}</span></div></div></div><div className="flex items-center gap-1"><button onClick={() => handleViewDocument(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Ouvrir"><Eye size={16} className="text-gray-500 group-hover:text-blue-600" /></button><button onClick={() => handleDownload(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Télécharger"><Download size={16} className="text-gray-500 group-hover:text-[#70AE48]" /></button>{activeFilter === 'actifs' ? (<button onClick={() => handleArchive(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Archiver"><Archive size={16} className="text-gray-500 group-hover:text-orange-600" /></button>) : (<button onClick={() => handleRestore(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group" title="Restaurer"><RefreshCw size={16} className="text-gray-500 group-hover:text-green-600" /></button>)}<button onClick={() => handleDeleteClick(doc.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group" title="Supprimer"><Trash2 size={16} className="text-gray-500 group-hover:text-red-600" /></button></div></div></Card>))
              )}
            </div>

            {activeFilter === 'actifs' && filteredDocuments.length > 0 && (<div className="flex items-center justify-between text-sm text-gray-500"><span>{filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}</span><span>Affichage {Math.min(parseInt(itemsPerPage), filteredDocuments.length)} sur {filteredDocuments.length}</span></div>)}
            {activeFilter === 'contrats' && leases.length > 0 && (<div className="text-sm text-gray-500">{leases.length} contrat{leases.length > 1 ? 's' : ''} de bail</div>)}
            {activeFilter === 'etats_lieux' && conditionReports.length > 0 && (<div className="flex items-center justify-between text-sm text-gray-500"><span>{conditionReports.length} état{conditionReports.length > 1 ? 's' : ''} des lieux</span><span>{conditionReports.filter(r => r.is_signed).length} validé{conditionReports.filter(r => r.is_signed).length > 1 ? 's' : ''} · {conditionReports.filter(r => !r.signature_tenant).length} en attente de votre signature</span></div>)}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-fadeIn  { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default Documents;