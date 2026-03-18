import React, { useState, useEffect } from 'react';
import { Search, Loader2, FileText, Calendar, Building, Home, FileSignature, FileCheck } from 'lucide-react';
import { documentsService } from '@/services/api';

interface DocumentItem {
    id: string;
    type: string;
    typeBadge: string;
    typeBadgeColor: string;
    titre: string;
    bien: string;
    date: string;
    reference: string;
    file_size?: number;
    file_url?: string;
    amount?: number;
    status?: string;
    property_id?: number;
    tenant_id?: number;
    tenant_name?: string;
    [key: string]: any;
}

interface ArchiveDocsProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const ArchivageDocs: React.FC<ArchiveDocsProps> = ({ notify }) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ 
        total: 0, 
        baux: 0, 
        edl: 0, 
        quittances: 0,
        paiements: 0
    });

    const filters = [
        { id: 'all', label: 'Tous' },
        { id: 'lease', label: 'Baux' },
        { id: 'inventory', label: 'EDL' },
        { id: 'receipt', label: 'Quittances' },
        { id: 'payment', label: 'Paiements' }
    ];

    const fetchAllDocuments = async () => {
        try {
            setLoading(true);
            
            console.log('📁 Récupération de tous les documents...');
            
            const allDocs = await documentsService.getAllDocuments();
            console.log('Documents récupérés:', allDocs);
            
            const docsStats = await documentsService.getDocumentsStats();
            console.log('Statistiques:', docsStats);

            setDocuments(allDocs);
            
            setStats({
                total: docsStats.total_documents || allDocs.length,
                baux: allDocs.filter(d => d.type === 'lease').length,
                edl: allDocs.filter(d => d.type === 'inventory').length,
                quittances: allDocs.filter(d => d.type === 'receipt').length,
                paiements: allDocs.filter(d => d.type === 'payment').length
            });

        } catch (error) {
            console.error('❌ Erreur chargement documents:', error);
            notify('Erreur lors du chargement des documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllDocuments();
    }, []);

    const filtered = documents.filter(doc => {
        const matchesSearch = (doc.titre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (doc.bien?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (doc.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesFilter = activeFilter === 'all' || doc.type === activeFilter;
        
        return matchesSearch && matchesFilter;
    });

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return 'Date inconnue';
        }
    };

    const getTypeIcon = (type: string) => {
        switch(type) {
            case 'lease': return <FileSignature className="w-4 h-4" />;
            case 'inventory': return <Home className="w-4 h-4" />;
            case 'receipt': return <FileCheck className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 animate-spin text-[#77B84D]" />
                <p className="mt-4 text-gray-500 text-base font-medium">Chargement des documents...</p>
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
                        Retrouvez tous vos baux, états des lieux, quittances et paiements
                    </p>
                </div>
            </div>

            {/* Stats Cards - Plus visibles */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Total</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Baux</p>
                    <p className="text-3xl font-bold text-[#77B84D]">{stats.baux}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <p className="text-xs text-gray-500 mb-2 font-medium">EDL</p>
                    <p className="text-3xl font-bold text-[#f59e0b]">{stats.edl}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Quittances</p>
                    <p className="text-3xl font-bold text-[#77B84D]">{stats.quittances}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Paiements</p>
                    <p className="text-3xl font-bold text-[#3b82f6]">{stats.paiements}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-5 shadow-md border border-gray-100">
                <div className="flex flex-wrap gap-2 mb-4">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
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

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Rechercher par titre, bien ou référence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#77B84D]/20"
                    />
                </div>
            </div>

            {/* Documents Grid - 2 par ligne avec textes plus grands */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((doc) => (
                        <div 
                            key={doc.id}
                            className="bg-white rounded-xl p-5 shadow-md border border-gray-100 hover:shadow-xl transition-all hover:-translate-y-1"
                        >
                            {/* Header with badge */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span 
                                        className="px-2.5 py-1 rounded text-xs font-semibold"
                                        style={{ 
                                            backgroundColor: doc.typeBadgeColor + '15', 
                                            color: doc.typeBadgeColor
                                        }}
                                    >
                                        {doc.typeBadge}
                                    </span>
                                    <span className="text-xs text-gray-400 font-mono">
                                        #{doc.reference.slice(-8)}
                                    </span>
                                </div>
                                {doc.amount && (
                                    <span className="text-sm font-semibold text-gray-700">
                                        {doc.amount.toLocaleString()} FCFA
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2">
                                {doc.titre}
                            </h3>

                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {/* Bien */}
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{doc.bien}</span>
                                </div>
                                
                                {/* Date */}
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                    <span>{formatDate(doc.date)}</span>
                                </div>
                            </div>

                            {/* Footer with type icon */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    {getTypeIcon(doc.type)}
                                    <span className="capitalize">
                                        {doc.type === 'lease' ? 'Bail' : 
                                         doc.type === 'inventory' ? 'État des lieux' :
                                         doc.type === 'receipt' ? 'Quittance' : 
                                         doc.type === 'payment' ? 'Paiement' : 'Document'}
                                    </span>
                                </div>
                                {doc.status && (
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                        doc.status === 'active' ? 'bg-green-100 text-green-700' :
                                        doc.status === 'terminated' ? 'bg-gray-100 text-gray-600' :
                                        doc.status === 'paid' ? 'bg-blue-100 text-blue-600' :
                                        'bg-yellow-100 text-yellow-600'
                                    }`}>
                                        {doc.status === 'active' ? 'Actif' :
                                         doc.status === 'terminated' ? 'Terminé' :
                                         doc.status === 'paid' ? 'Payé' :
                                         doc.status === 'pending' ? 'En attente' :
                                         doc.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
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
            )}
        </div>
    );
};

export default ArchivageDocs;