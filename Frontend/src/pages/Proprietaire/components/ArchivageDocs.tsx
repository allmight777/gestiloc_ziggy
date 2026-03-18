import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2, FileText, Download, Eye, Calendar, Building, Home, FileSignature, FileCheck } from 'lucide-react';
import { documentArchiveService } from '@/services/api';

interface ArchiveDoc {
    id: string;
    typeBadge: string;
    typeBadgeColor: string;
    titre: string;
    bien: string;
    champ1Label: string; champ1Value: string;
    champ2Label: string; champ2Value: string;
    champ3Label: string; champ3Value: string;
    champ4Label: string; champ4Value: string;
    dateBas: string;
    file_size?: number;
    type?: string;
}

interface ArchiveDocsProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const ArchivageDocs: React.FC<ArchiveDocsProps> = ({ notify }) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [archiveList, setArchiveList] = useState<ArchiveDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ 
        totalDoc: 0, 
        bauxTermines: 0, 
        edlArchived: 0, 
        storageUsed: '0 MB' 
    });

    const filters = [
        { id: 'all', label: 'Tout' },
        { id: 'lease', label: 'Baux' },
        { id: 'inventory', label: 'EDL' },
        { id: 'receipt', label: 'Quittances' },
        { id: 'other', label: 'Autres' }
    ];

    const fetchData = async () => {
        try {
            setLoading(true);
            const [docs, statsData] = await Promise.all([
                documentArchiveService.list(),
                documentArchiveService.getStats()
            ]);

            const mapped = (docs || []).map((d: any) => {
                const type = d.type || 'other';
                let typeBadge = 'DOCUMENT';
                let typeBadgeColor = '#6b7280';
                
                if (type === 'lease' || d.typeBadge?.includes('BAIL')) {
                    typeBadge = 'Bail';
                    typeBadgeColor = '#77B84D';
                } else if (type === 'condition_report' || type === 'inventory' || d.typeBadge?.includes('EDL')) {
                    typeBadge = 'EDL';
                    typeBadgeColor = '#f59e0b';
                } else if (type === 'receipt' || d.typeBadge?.includes('QUITTANCE')) {
                    typeBadge = 'Quittance';
                    typeBadgeColor = '#77B84D';
                }

                return {
                    id: String(d.id),
                    typeBadge: d.typeBadge || typeBadge,
                    typeBadgeColor: d.typeBadgeColor || typeBadgeColor,
                    type: type,
                    titre: d.titre || d.title || 'Sans titre',
                    bien: d.bien || (d.property?.name || d.property?.address || 'Bien inconnu'),
                    champ1Label: d.champ1Label || 'Déposé le',
                    champ1Value: d.champ1Value || new Date(d.created_at || d.date_archive).toLocaleDateString('fr-FR'),
                    champ2Label: d.champ2Label || 'Type',
                    champ2Value: d.champ2Value || d.category || 'Archive',
                    champ3Label: d.champ3Label || 'Méta',
                    champ3Value: d.champ3Value || d.metadata || '—',
                    champ4Label: d.champ4Label || 'Taille',
                    champ4Value: d.champ4Value || (d.file_size ? `${(d.file_size / 1024).toFixed(1)} KB` : '—'),
                    dateBas: d.dateBas || `Archivé le ${new Date(d.created_at || d.date_archive).toLocaleDateString('fr-FR')}`,
                    file_size: d.file_size || 0
                };
            });

            setArchiveList(mapped);
            if (statsData || (docs && (docs as any).stats)) {
                const s = statsData || (docs as any).stats;
                setKpis({
                    totalDoc: s.total_documents || s.total_count || 0,
                    bauxTermines: s.baux_termines || s.expired_leases || 0,
                    edlArchived: s.edl_archives || s.condition_reports || 0,
                    storageUsed: s.total_size || s.storage_human || '0 MB'
                });
            }
        } catch (error) {
            console.error('Erreur archives:', error);
            notify('Erreur lors du chargement des archives', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filtered = archiveList.filter(d => {
        const matchesSearch = d.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.bien.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesFilter = activeFilter === 'all' || 
            (activeFilter === 'lease' && (d.type === 'lease' || d.typeBadge === 'Bail')) ||
            (activeFilter === 'inventory' && (d.type === 'condition_report' || d.type === 'inventory' || d.typeBadge === 'EDL')) ||
            (activeFilter === 'receipt' && (d.type === 'receipt' || d.typeBadge === 'Quittance')) ||
            (activeFilter === 'other' && d.type === 'other');
        
        return matchesSearch && matchesFilter;
    });

    const handleDownload = (doc: ArchiveDoc) => {
        notify('Téléchargement en cours...', 'info');
    };

    return (
        <div className="space-y-6 py-4" style={{ fontFamily: "'Merriweather', serif" }}>
            {/* Header - Compact */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 font-merriweather tracking-tight">
                        Archivage de documents
                    </h1>
                    <p className="text-gray-400 font-manrope font-medium text-sm max-w-xl">
                        Retrouvez tous vos documents archivés : anciens baux, états des lieux terminés, quittances passées.
                    </p>
                </div>
                <button 
                    onClick={() => notify('Ajout document à venir', 'info')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#77B84D] text-white rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-[#6a9e42] transition-all shadow-lg"
                >
                    <Plus size={16} />
                    Ajouter
                </button>
            </div>

            {/* Stats Section - Fond noir avec #77B84D */}
            <div className="p-2 rounded-3xl bg-gray-900 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#77B84D]/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#77B84D]/5 rounded-full -ml-24 -mb-24 blur-3xl opacity-30" />

                <div className="relative grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-800/50">
                    <div className="p-4 md:p-6 space-y-1 text-center md:text-left">
                        <p className="text-[9px] font-black text-[#77B84D] uppercase tracking-[0.15em] font-manrope">
                            Documents archivés
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <FileSignature className="w-4 h-4 text-gray-500" />
                            <p className="text-2xl font-black text-white font-merriweather">{kpis.totalDoc}</p>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 space-y-1 text-center md:text-left">
                        <p className="text-[9px] font-black text-[#77B84D] uppercase tracking-[0.15em] font-manrope">
                            Baux terminés
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <FileCheck className="w-4 h-4 text-gray-500" />
                            <p className="text-2xl font-black text-white font-merriweather">{kpis.bauxTermines}</p>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 space-y-1 text-center md:text-left">
                        <p className="text-[9px] font-black text-[#77B84D] uppercase tracking-[0.15em] font-manrope">
                            EDL archivés
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <Building className="w-4 h-4 text-gray-500" />
                            <p className="text-2xl font-black text-white font-merriweather">{kpis.edlArchived}</p>
                        </div>
                    </div>

                    <div className="p-4 md:p-6 space-y-1 text-center md:text-left">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] font-manrope">
                            Espace utilisé
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-2">
                            <Home className="w-4 h-4 text-gray-500" />
                            <p className="text-2xl font-black text-white font-merriweather text-nowrap">{kpis.storageUsed}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section - Compact */}
            <div className="p-6 rounded-3xl border border-gray-100 shadow-lg bg-white space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#77B84D]/10 rounded-full -mr-12 -mt-12 blur-2xl" />

                {/* Type Tabs */}
                <div className="flex flex-wrap gap-3 relative z-10">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => setActiveFilter(filter.id)}
                            className={`px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all ${
                                activeFilter === filter.id
                                    ? 'bg-[#77B84D] text-white shadow-lg scale-105'
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            } font-manrope`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative z-10">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#77B84D] w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#77B84D]/20 transition-all font-manrope placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* Documents Grid - 2 par ligne */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#77B84D]" />
                    <p className="mt-4 text-gray-400 text-sm font-medium">Chargement des archives...</p>
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered.map((doc) => (
                        <div 
                            key={doc.id} 
                            className="overflow-hidden rounded-2xl border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white group flex flex-col h-full relative border-t-4 border-t-[#77B84D]/20"
                        >
                            <div className="absolute top-0 right-0 w-20 h-20 bg-[#77B84D]/10 opacity-20 group-hover:opacity-100 rounded-full -mr-10 -mt-10 blur-xl transition-all" />

                            <div className="p-6 flex-grow relative">
                                {/* Badge & Action */}
                                <div className="mb-4 flex justify-between items-start">
                                    <div className="space-y-2">
                                        <span 
                                            className="px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider border font-manrope"
                                            style={{ 
                                                background: doc.typeBadgeColor + '20', 
                                                color: doc.typeBadgeColor,
                                                borderColor: doc.typeBadgeColor + '30'
                                            }}
                                        >
                                            {doc.typeBadge}
                                        </span>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-wider">
                                            Ref. #{doc.id}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="p-3 rounded-xl bg-gray-900 text-white hover:bg-[#77B84D] transition-all shadow-lg group-hover:scale-105"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-black text-gray-900 mb-4 font-merriweather leading-snug group-hover:text-[#77B84D] transition-colors line-clamp-2">
                                    {doc.titre}
                                </h3>

                                {/* Property */}
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 mb-4 font-manrope bg-[#77B84D]/5 p-3 rounded-xl border border-[#77B84D]/10">
                                    <Building className="w-4 h-4 text-[#77B84D]" />
                                    <span className="truncate">{doc.bien}</span>
                                </div>

                                {/* Details Grid */}
                                <div className="space-y-3 pt-4 border-t border-gray-100">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-gray-400 uppercase">{doc.champ1Label}</p>
                                            <p className="text-[10px] font-bold text-gray-600">{doc.champ1Value}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[8px] font-black text-gray-400 uppercase">{doc.champ2Label}</p>
                                            <p className="text-[10px] font-bold text-gray-600">{doc.champ2Value}</p>
                                        </div>
                                    </div>
                                    {(doc.champ3Value !== '—' || doc.champ4Value !== '—') && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-0.5">
                                                <p className="text-[8px] font-black text-gray-400 uppercase">{doc.champ3Label}</p>
                                                <p className="text-[10px] font-bold text-gray-600">{doc.champ3Value}</p>
                                            </div>
                                            {doc.champ4Value !== '—' && (
                                                <div className="space-y-0.5">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase">{doc.champ4Label}</p>
                                                    <p className="text-[10px] font-bold text-gray-600">{doc.champ4Value}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50/50 flex items-center justify-between border-t border-gray-100 group-hover:bg-[#77B84D] transition-all duration-300">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400 group-hover:text-white/70 transition-colors" />
                                    <span className="text-[10px] font-bold text-gray-600 group-hover:text-white transition-colors">
                                        {doc.dateBas}
                                    </span>
                                </div>
                                <button className="text-[10px] font-black text-[#77B84D] group-hover:text-white uppercase tracking-wider flex items-center gap-1">
                                    <span>Voir</span>
                                    <Eye className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-16 text-center rounded-3xl border border-gray-100 shadow-inner bg-gray-50/20 border-dashed">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <FileText className="w-10 h-10 text-[#77B84D]/30" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-3 font-merriweather">
                        Aucun document archivé
                    </h3>
                    <p className="text-gray-400 font-manrope max-w-sm mx-auto text-sm">
                        {searchTerm
                            ? `Aucun résultat pour "${searchTerm}"`
                            : 'Votre dossier d\'archives est actuellement vide.'
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default ArchivageDocs;