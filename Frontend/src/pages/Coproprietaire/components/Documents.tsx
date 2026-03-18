import React, { useEffect, useState, useMemo } from 'react';
import { FileText, Download, Search, Filter, Plus, Eye, Edit, Trash2, Calendar, Building, User, FileSignature, FileCheck, Home, MapPin } from 'lucide-react';
import { Card } from '../../Proprietaire/components/ui/Card';
import { Button } from '../../Proprietaire/components/ui/Button';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'lease' | 'inventory' | 'receipt' | 'other'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [propertyFilter, setPropertyFilter] = useState<string>('all');

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
          name: `Contrat de bail - ${lease.tenant?.first_name || ''} ${lease.tenant?.last_name || ''}`,
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
          name: `Quittances annuelles ${receipt.year || receipt.paid_month?.split('-')[0]}`,
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
          name: `État des lieux ${inventory.type === 'entry' ? 'entrée' : 'sortie'} - ${inventory.tenant?.first_name || ''} ${inventory.tenant?.last_name || ''}`,
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
    const totalSize = documents.reduce((acc, doc) => acc + Number(doc.file_size || 0), 0);

    const sizeInGB = totalSize > 0
      ? (totalSize / (1024 * 1024 * 1024)).toFixed(1)
      : '0';

    return {
      total,
      leases,
      inventories,
      usedSpace: `${sizeInGB} GB`
    };
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch =
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.property?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || doc.type === typeFilter;

      const matchesYear = yearFilter === 'all' ||
        (doc.archived_at && new Date(doc.archived_at).getFullYear().toString() === yearFilter);

      const matchesProperty = propertyFilter === 'all' ||
        doc.property?.id.toString() === propertyFilter;

      return matchesSearch && matchesType && matchesYear && matchesProperty;
    });
  }, [documents, searchTerm, typeFilter, yearFilter, propertyFilter]);

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

  const handleDownload = (document: Document) => {
    window.open(document.file_path, '_blank');
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
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

  if (loading) {
    return (
      <div className="space-y-6 py-4" style={{ fontFamily: "'Merriweather', serif" }}>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="h-3 w-52 bg-gray-50 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 rounded-3xl border-gray-100 shadow-lg bg-white relative overflow-hidden">
              <div className="h-3 w-20 bg-gray-100 rounded-lg animate-pulse mb-2" />
              <div className="h-6 w-12 bg-gray-50 rounded-lg animate-pulse" />
            </Card>
          ))}
        </div>

        <div className="h-32 w-full bg-gray-100/50 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4" style={{ fontFamily: "'Merriweather', serif" }}>
      {/* Header Section - Réduit */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-merriweather tracking-tight">
            Documents Archivés
          </h1>
          <p className="text-gray-400 font-manrope font-medium text-sm max-w-xl">
            Retrouvez l'historique complet de vos baux, états des lieux et quittances passées.
          </p>
        </div>
      </div>

      {/* Stats Section - Fond noir comme demandé avec #77B84D */}
      <Card className="p-2 rounded-3xl bg-gray-900 shadow-xl border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#77B84D]/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#77B84D]/5 rounded-full -ml-24 -mb-24 blur-3xl opacity-30" />

        <div className="relative grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-800/50">
          <div className="p-4 md:p-6 space-y-1 text-center md:text-left">
            <p className="text-[9px] font-black text-[#77B84D] uppercase tracking-[0.15em] font-manrope">Total archivé</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <FileSignature className="w-4 h-4 text-gray-500" />
              <p className="text-2xl font-black text-white font-merriweather">{stats.total}</p>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-1 text-center md:text-left">
            <p className="text-[9px] font-black text-[#77B84D] uppercase tracking-[0.15em] font-manrope">Baux terminés</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <FileCheck className="w-4 h-4 text-gray-500" />
              <p className="text-2xl font-black text-white font-merriweather">{stats.leases}</p>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-1 text-center md:text-left">
            <p className="text-[9px] font-black text-[#77B84D] uppercase tracking-[0.15em] font-manrope">EDL archivés</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Building className="w-4 h-4 text-gray-500" />
              <p className="text-2xl font-black text-white font-merriweather">{stats.inventories}</p>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-1 text-center md:text-left">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] font-manrope">Espace utilisé</p>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Home className="w-4 h-4 text-gray-500" />
              <p className="text-2xl font-black text-white font-merriweather text-nowrap">{stats.usedSpace}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Extended Filters Section - Réduit */}
      <Card className="p-6 rounded-3xl border-gray-100 shadow-lg bg-white space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#77B84D]/10 rounded-full -mr-12 -mt-12 blur-2xl" />

        {/* Type Tabs - Textes raccourcis */}
        <div className="flex flex-wrap gap-3 relative z-10">
          {[
            { id: 'all', label: 'Tout' },
            { id: 'lease', label: 'Baux' },
            { id: 'inventory', label: 'EDL' },
            { id: 'receipt', label: 'Quittances' },
            { id: 'other', label: 'Autres' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id as any)}
              className={`px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all ${typeFilter === type.id
                ? 'bg-[#77B84D] text-white shadow-lg scale-105'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                } font-manrope`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Search & Property/Year Selects - Compacts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77B84D] w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#77B84D]/20 transition-all font-manrope placeholder:text-gray-300"
            />
          </div>

          <div className="relative group">
            <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77B84D] w-4 h-4 pointer-events-none" />
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 outline-none cursor-pointer font-manrope appearance-none"
            >
              <option value="all">Toutes les Propriétés</option>
              {availableProperties.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </div>

          <div className="relative group">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77B84D] w-4 h-4 pointer-events-none" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 outline-none cursor-pointer font-manrope appearance-none"
            >
              <option value="all">Toutes les Années</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Documents Grid - 2 par ligne, plus compact */}
      {filteredDocuments.length === 0 ? (
        <Card className="p-16 text-center rounded-3xl border-gray-100 shadow-inner bg-gray-50/20 border-dashed">
          <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <FileText className="w-10 h-10 text-[#77B84D]/30" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-3 font-merriweather">
            Coffre-fort vide
          </h3>
          <p className="text-gray-400 font-manrope max-w-sm mx-auto text-sm">
            {searchTerm
              ? `Aucun résultat pour "${searchTerm}"`
              : 'Aucun document archivé disponible.'
            }
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocuments.map((document) => {
            const isLease = document.type === 'lease';
            const isReceipt = document.type === 'receipt';
            const isInventory = document.type === 'inventory';

            return (
              <Card key={document.uniqueKey} className="overflow-hidden rounded-2xl border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white group flex flex-col h-full relative border-t-4 border-t-[#77B84D]/20">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#77B84D]/10 opacity-20 group-hover:opacity-100 rounded-full -mr-10 -mt-10 blur-xl transition-all" />

                <div className="p-6 flex-grow relative">
                  {/* Badge & Action */}
                  <div className="mb-4 flex justify-between items-start">
                    <div className="space-y-2">
                      {isLease && (
                        <span className="px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider bg-[#77B84D]/10 text-[#77B84D] border border-[#77B84D]/20 font-manrope">Bail</span>
                      )}
                      {isInventory && (
                        <span className="px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider bg-yellow-50 text-yellow-600 border border-yellow-100 font-manrope">EDL</span>
                      )}
                      {isReceipt && (
                        <span className="px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider bg-[#77B84D]/10 text-[#77B84D] border border-[#77B84D]/20 font-manrope">Quittance</span>
                      )}
                      {(!isLease && !isInventory && !isReceipt) && (
                        <span className="px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider bg-gray-50 text-gray-400 border border-gray-100 font-manrope">Archive</span>
                      )}
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-wider">Ref. #{document.id}</p>
                    </div>

                    <button
                      onClick={() => handleDownload(document)}
                      className="p-3 rounded-xl bg-gray-900 text-white hover:bg-[#77B84D] transition-all shadow-lg group-hover:scale-105"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-gray-900 mb-4 font-merriweather leading-snug group-hover:text-[#77B84D] transition-colors line-clamp-2">
                    {document.name}
                  </h3>

                  {/* Context */}
                  {document.property && (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-4 font-manrope bg-[#77B84D]/5 p-3 rounded-xl border border-[#77B84D]/10">
                      <MapPin className="w-4 h-4 text-[#77B84D]" />
                      <span className="truncate">{document.property.name}</span>
                    </div>
                  )}

                  {/* Detailed Info */}
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    {isLease && document.metadata && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Période</p>
                          <p className="text-[10px] font-bold text-gray-600">{formatDate(document.metadata.startDate)} — {formatDate(document.metadata.endDate)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Loyer</p>
                          <p className="text-[10px] font-black text-[#77B84D]">{formatCurrency(document.metadata.monthlyRent)}</p>
                        </div>
                      </div>
                    )}

                    {isInventory && document.metadata && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Date</p>
                          <p className="text-[10px] font-bold text-gray-600">{formatDate(document.metadata.visitDate)}</p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[8px] font-black text-gray-400 uppercase">Caution</p>
                          <p className="text-[10px] font-black text-gray-900">{formatCurrency(document.metadata.deposit)}</p>
                        </div>
                      </div>
                    )}

                    {!isLease && !isInventory && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-[9px] font-bold text-gray-400 font-manrope uppercase">{formatDate(document.created_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100 group-hover:bg-[#77B84D] transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <FileSignature className="w-4 h-4 text-gray-400 group-hover:text-white/70 transition-colors" />
                    <span className="text-[10px] font-bold text-gray-600 group-hover:text-white transition-colors">{(Number(document.file_size) / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <button className="text-[10px] font-black text-[#77B84D] group-hover:text-white uppercase tracking-wider flex items-center gap-1">
                    <span>Voir</span>
                    <Eye className="w-3 h-3" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};