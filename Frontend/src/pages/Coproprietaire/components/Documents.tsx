import React, { useEffect, useState, useMemo } from 'react';
import { FileText, Search, Calendar, Building, Home, FileSignature, FileCheck, MapPin } from 'lucide-react';
import { Card } from '../../Proprietaire/components/ui/Card';
import { Skeleton } from '../../Proprietaire/components/ui/Skeleton';
import { coOwnerApi } from '@/services/coOwnerApi';

interface DocumentsProps {
  onNavigate: (tab: string) => void;
  notify: (msg: string, type: "success" | "info" | "error") => void;
}

interface Document {
  id: number;
  uniqueKey: string;
  name: string;
  type: 'lease' | 'receipt' | 'notice' | 'contract' | 'other' | 'inventory';
  subType?: 'entry' | 'exit';
  file_path: string;
  file_size: string | number;
  created_at?: string;
  archived_at?: string;
  property?: {
    id: number;
    name: string;
  };
  tenant?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  metadata?: {
    startDate?: string;
    endDate?: string;
    duration?: string;
    monthlyRent?: number;
    visitDate?: string;
    generalState?: string;
    deposit?: number;
    period?: string | number;
    count?: number;
    total?: number;
    company?: string;
    files?: number;
    premium?: number;
  };
}

export const CoOwnerDocuments: React.FC<DocumentsProps> = ({ onNavigate, notify }) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'lease' | 'inventory' | 'receipt' | 'other'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');

  const filters = [
    { id: 'all', label: 'Tous' },
    { id: 'lease', label: 'Baux' },
    { id: 'inventory', label: 'EDL' },
    { id: 'receipt', label: 'Quittances' },
    { id: 'other', label: 'Autres' }
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const [leases, receipts, notices, inventories] = await Promise.all([
        coOwnerApi.getLeases(),
        coOwnerApi.getRentReceipts(),
        coOwnerApi.getNotices(),
        coOwnerApi.getInventories?.() || Promise.resolve([])
      ]);

      const documentsList: Document[] = [
        ...leases.map(lease => ({
          id: lease.id,
          uniqueKey: `lease-${lease.id}`,
          name: `Bail - ${lease.tenant?.first_name || ''} ${lease.tenant?.last_name || ''}`,
          type: 'lease' as const,
          file_path: `/api/leases/${lease.id}/pdf`,
          file_size: lease.file_size || 0,
          created_at: lease.created_at,
          archived_at: lease.end_date || lease.updated_at,
          property: lease.property,
          tenant: lease.tenant,
          metadata: {
            startDate: lease.start_date,
            endDate: lease.end_date,
            duration: lease.duration,
            monthlyRent: lease.monthly_rent
          }
        })),
        ...receipts.map(receipt => ({
          id: receipt.id,
          uniqueKey: `receipt-${receipt.id}`,
          name: `Quittance - ${receipt.year || receipt.paid_month?.split('-')[0] || 'Mois inconnu'}`,
          type: 'receipt' as const,
          file_path: `/api/receipts/${receipt.id}/pdf`,
          file_size: receipt.file_size || 0,
          created_at: receipt.created_at,
          archived_at: receipt.created_at,
          property: receipt.property,
          tenant: receipt.lease?.tenant,
          metadata: {
            period: receipt.year || receipt.paid_month,
            count: receipt.count || 1,
            total: receipt.total_amount
          }
        })),
        ...inventories.map((inventory: any) => ({
          id: inventory.id,
          uniqueKey: `inventory-${inventory.id}`,
          name: `État des lieux ${inventory.type === 'entry' ? "d'entrée" : 'de sortie'}`,
          type: 'inventory' as const,
          subType: inventory.type,
          file_path: `/api/inventories/${inventory.id}/pdf`,
          file_size: inventory.file_size || 0,
          created_at: inventory.created_at,
          archived_at: inventory.date || inventory.updated_at,
          property: inventory.property,
          tenant: inventory.tenant,
          metadata: {
            visitDate: inventory.date,
            general_state: inventory.general_state,
            deposit: inventory.deposit_amount || 0
          }
        })),
        ...notices.map(notice => ({
          id: notice.id,
          uniqueKey: `notice-${notice.id}`,
          name: notice.title,
          type: 'other' as const,
          file_path: `/api/notices/${notice.id}/pdf`,
          file_size: notice.file_size || 0,
          created_at: notice.created_at,
          archived_at: notice.created_at,
          property: notice.property,
          tenant: notice.tenant
        }))
      ];

      setDocuments(documentsList);
    } catch (error: any) {
      console.warn('Error fetching documents (silenced):', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = documents.length;
    const leases = documents.filter(d => d.type === 'lease').length;
    const inventories = documents.filter(d => d.type === 'inventory').length;
    const receipts = documents.filter(d => d.type === 'receipt').length;
    const totalSize = documents.reduce((acc, doc) => acc + Number(doc.file_size || 0), 0);

    const sizeInMB = totalSize > 0
      ? (totalSize / (1024 * 1024)).toFixed(1)
      : '0';

    return {
      total,
      leases,
      inventories,
      receipts,
      usedSpace: `${sizeInMB} MB`
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.property?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = activeFilter === 'all' || doc.type === activeFilter;

      const matchesYear = yearFilter === 'all' ||
        (doc.archived_at && new Date(doc.archived_at).getFullYear().toString() === yearFilter);

      const matchesProperty = propertyFilter === 'all' ||
        doc.property?.id.toString() === propertyFilter;

      return matchesSearch && matchesType && matchesYear && matchesProperty;
    });
  }, [documents, searchTerm, activeFilter, yearFilter, propertyFilter]);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    documents.forEach(doc => {
      if (doc.archived_at) {
        years.add(new Date(doc.archived_at).getFullYear().toString());
      }
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
  }, [documents]);

  const availableProperties = useMemo(() => {
    const props = new Map();
    documents.forEach(doc => {
      if (doc.property && !props.has(doc.property.id)) {
        props.set(doc.property.id, doc.property);
      }
    });
    return Array.from(props.values());
  }, [documents]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (e) {
      return '-';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(n) + " FCFA";
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'lease': return <FileSignature className="w-4 h-4" />;
      case 'inventory': return <Home className="w-4 h-4" />;
      case 'receipt': return <FileCheck className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (doc: Document) => {
    if (doc.type === 'lease') {
      return { label: 'Bail', color: '#77B84D' };
    } else if (doc.type === 'inventory') {
      return { label: 'EDL', color: '#f59e0b' };
    } else if (doc.type === 'receipt') {
      return { label: 'Quittance', color: '#77B84D' };
    } else {
      return { label: 'Document', color: '#6b7280' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 py-4 max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-52 bg-gray-50 rounded animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
              <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mb-2" />
              <div className="h-8 w-12 bg-gray-50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="h-32 w-full bg-gray-100/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Gestion des documents
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Retrouvez tous vos baux, états des lieux, quittances et autres documents
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-500 mb-2 font-medium">Total</p>
          <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-500 mb-2 font-medium">Baux</p>
          <p className="text-3xl font-bold text-[#77B84D]">{stats.leases}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-500 mb-2 font-medium">EDL</p>
          <p className="text-3xl font-bold text-[#f59e0b]">{stats.inventories}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-500 mb-2 font-medium">Quittances</p>
          <p className="text-3xl font-bold text-[#77B84D]">{stats.receipts}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <p className="text-xs text-gray-500 mb-2 font-medium">Espace utilisé</p>
          <p className="text-3xl font-bold text-[#3b82f6]">{stats.usedSpace}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id as any)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeFilter === filter.id
                  ? 'bg-[#77B84D] text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#77B84D]/20"
            />
          </div>

          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none cursor-pointer appearance-none"
            >
              <option value="all">Toutes les propriétés</option>
              {availableProperties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none cursor-pointer appearance-none"
            >
              <option value="all">Toutes les années</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents Grid - 2 par ligne */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Aucun document trouvé
          </h3>
          <p className="text-gray-400 text-sm">
            {searchTerm
              ? `Aucun résultat pour "${searchTerm}"`
              : 'Commencez par créer des baux, états des lieux ou quittances'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocuments.map((doc) => {
            const badge = getTypeBadge(doc);
            
            return (
              <div 
                key={doc.uniqueKey}
                className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Header with badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2.5 py-1 rounded text-xs font-semibold"
                      style={{ 
                        backgroundColor: badge.color + '15', 
                        color: badge.color
                      }}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      #{doc.id}
                    </span>
                  </div>
                  {doc.metadata?.monthlyRent && (
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(doc.metadata.monthlyRent)}
                    </span>
                  )}
                  {doc.metadata?.total && (
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(doc.metadata.total)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2">
                  {doc.name}
                </h3>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Bien */}
                  {doc.property && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{doc.property.name}</span>
                    </div>
                  )}
                  
                  {/* Date */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{formatDate(doc.created_at)}</span>
                  </div>

                  {/* Période pour les baux */}
                  {doc.type === 'lease' && doc.metadata?.startDate && doc.metadata?.endDate && (
                    <div className="col-span-2 flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>Du {formatDate(doc.metadata.startDate)}</span>
                      <span>→</span>
                      <span>Au {formatDate(doc.metadata.endDate)}</span>
                    </div>
                  )}

                  {/* Date pour les EDL */}
                  {doc.type === 'inventory' && doc.metadata?.visitDate && (
                    <div className="col-span-2 flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>Visité le {formatDate(doc.metadata.visitDate)}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    {getTypeIcon(doc.type)}
                    <span className="capitalize">
                      {doc.type === 'lease' ? 'Bail' : 
                       doc.type === 'inventory' ? 'État des lieux' :
                       doc.type === 'receipt' ? 'Quittance' : 
                       'Document'}
                    </span>
                    <span className="ml-2 text-gray-400">
                      • {(Number(doc.file_size) / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  {doc.tenant && (
                    <span className="text-xs text-gray-500">
                      {doc.tenant.first_name} {doc.tenant.last_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};