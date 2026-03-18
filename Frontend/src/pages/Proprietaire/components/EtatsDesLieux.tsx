import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Settings, Loader2, Camera, Download, Eye, MoreVertical } from 'lucide-react';
import { conditionReportService } from '@/services/api';

interface EdlData {
    id: string;
    type: string;
    typeBadge: string;
    typeBadgeColor: string;
    title: string;
    property_name: string;
    tenant_name: string;
    report_date_formatted: string;
    general_condition: string;
    is_signed: boolean;
    photos_count: number;
    created_at_formatted: string;
}

interface Property {
    id: number;
    name: string;
    address: string;
}

const TYPE_CONFIG: Record<string, { label: string, color: string }> = {
    'entry': { label: 'ÉTAT DES LIEUX D\'ENTRÉE', color: '#70AE48' },
    'exit': { label: 'ÉTAT DES LIEUX DE SORTIE', color: '#ef4444' },
    'intermediate': { label: 'ÉTAT DES LIEUX INTERMÉDIAIRE', color: '#3b82f6' },
};

interface EtatsDesLieuxProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const EtatsDesLieux: React.FC<EtatsDesLieuxProps> = ({ notify }) => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [propertyFilter, setPropertyFilter] = useState('');
    const [edlList, setEdlList] = useState<EdlData[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: pagination.current_page,
                per_page: pagination.per_page
            };
            
            if (activeFilter !== 'all') params.type = activeFilter;
            if (propertyFilter) params.property_id = propertyFilter;
            if (searchTerm) params.search = searchTerm;

            const response = await conditionReportService.listAll(params);
            
            // La réponse peut être directement un tableau ou un objet avec data
            const reports = response.data || response || [];
            
            const mapped = reports.map((e: any) => ({
                id: String(e.id),
                type: e.type,
                typeBadge: e.type_label || TYPE_CONFIG[e.type]?.label || e.type.toUpperCase(),
                typeBadgeColor: e.type_color || TYPE_CONFIG[e.type]?.color || '#6b7280',
                title: e.title || `EDL - ${e.tenant_name || 'Sans locataire'}`,
                property_name: e.property_name || 'Bien inconnu',
                tenant_name: e.tenant_name || 'Sans locataire',
                report_date_formatted: e.report_date_formatted || new Date(e.report_date).toLocaleDateString('fr-FR'),
                general_condition: e.general_condition || 'Non évalué',
                is_signed: e.is_signed || false,
                photos_count: e.photos_count || 0,
                created_at_formatted: e.created_at_formatted || new Date(e.created_at).toLocaleDateString('fr-FR'),
            }));

            setEdlList(mapped);
            
            if (response.pagination) {
                setPagination(response.pagination);
            }

            // Charger les propriétés pour le filtre
            await fetchProperties();

        } catch (error) {
            console.error('Erreur EDL:', error);
            notify('Erreur lors du chargement des états des lieux', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchProperties = async () => {
        try {
            const props = await conditionReportService.getProperties();
            setProperties(props || []);
        } catch (error) {
            console.error('Erreur chargement propriétés:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeFilter, propertyFilter, searchTerm, pagination.current_page]);

    const handleFilterChange = (type: string) => {
        setActiveFilter(type);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPropertyFilter(e.target.value);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleView = (id: string) => {
        navigate(`/proprietaire/etats-lieux/${id}`); 
    };

    const handleDownload = async (id: string) => {
        try {
            const blob = await conditionReportService.downloadPdf(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `etat-des-lieux-${id}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            notify('PDF téléchargé avec succès', 'success');
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            notify('Erreur lors du téléchargement', 'error');
        }
    };

    return (
        <div className="condition-reports-container">
            <style>{`
                .condition-reports-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }

                .header-content h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #1f2937;
                    margin: 0 0 0.5rem 0;
                }

                .header-description {
                    color: #6b7280;
                    font-size: 1rem;
                    line-height: 1.5;
                    margin: 0;
                }

                .create-btn {
                    background: #70AE48;
                    color: white;
                    padding: 0.875rem 2rem;
                    border-radius: 2rem;
                    font-weight: 600;
                    font-size: 0.95rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                }

                .create-btn:hover {
                    background: #5a8f3a;
                    transform: translateY(-1px);
                }

                .tabs-container {
                    background: #f3f4f6;
                    border-radius: 0.75rem;
                    padding: 0.375rem;
                    display: inline-flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                }

                .tab-btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    border: none;
                    background: transparent;
                    color: #6b7280;
                    font-weight: 600;
                    font-size: 1rem;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .tab-btn.active {
                    background: #70AE48;
                    color: white;
                }

                .tab-btn:not(.active):hover {
                    color: #70AE48;
                }

                .filter-section {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 1rem;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                }

                .filter-title {
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .property-select {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    border: 1px solid #70AE48;
                    border-radius: 0.75rem;
                    font-size: 0.95rem;
                    color: #6b7280;
                    margin-bottom: 1rem;
                    background: white;
                    cursor: pointer;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 1rem center;
                }

                .filter-row {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .search-input-wrapper {
                    position: relative;
                    flex: 1;
                }

                .search-input {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 2.5rem;
                    border: 1px solid #70AE48;
                    border-radius: 0.75rem;
                    font-size: 0.95rem;
                    color: #374151;
                    background: white;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #5a8f3a;
                }

                .search-icon {
                    position: absolute;
                    left: 0.875rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #70AE48;
                    width: 18px;
                    height: 18px;
                }

                .display-btn {
                    padding: 0.875rem 1.25rem;
                    border: 1px solid #70AE48;
                    background: white;
                    color: #374151;
                    border-radius: 0.75rem;
                    font-weight: 500;
                    font-size: 0.95rem;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    white-space: nowrap;
                }

                .reports-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }

                .report-card {
                    background: white;
                    border-radius: 1rem;
                    overflow: hidden;
                    transition: all 0.2s ease;
                    border: 1px solid #e5e7eb;
                    border-left: 4px solid transparent;
                }

                .report-card.entry {
                    border-left-color: #70AE48;
                }

                .report-card.exit {
                    border-left-color: #ef4444;
                }

                .report-card.intermediate {
                    border-left-color: #3b82f6;
                }

                .report-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                .report-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #f3f4f6;
                }

                .report-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.375rem 0.75rem;
                    border-radius: 0.375rem;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                    margin-bottom: 0.75rem;
                }

                .report-badge.entry {
                    background: #ecfdf5;
                    color: #059669;
                }

                .report-badge.exit {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .report-badge.intermediate {
                    background: #eff6ff;
                    color: #2563eb;
                }

                .report-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #111827;
                    margin-bottom: 0.5rem;
                }

                .report-location {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #70AE48;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .report-body {
                    padding: 1.5rem;
                }

                .report-info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem 2rem;
                    margin-bottom: 1rem;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .info-label {
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: #9ca3af;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .info-value {
                    font-size: 1rem;
                    font-weight: 600;
                    color: #111827;
                }

                .photo-count {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.875rem;
                    background: #f9fafb;
                    border-radius: 0.5rem;
                    font-size: 0.9rem;
                    color: #374151;
                }

                .report-footer {
                    padding: 0.875rem 1.5rem;
                    background: #f9fafb;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-top: 1px solid #f3f4f6;
                }

                .creation-date {
                    font-size: 0.85rem;
                    color: #6b7280;
                }

                .action-buttons {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 0.5rem;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    background: transparent;
                    color: #6b7280;
                }

                .action-btn:hover {
                    background: #e5e7eb;
                }

                .action-btn.download:hover {
                    color: #70AE48;
                }

                .action-btn.view:hover {
                    color: #3b82f6;
                }

                .empty-state {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 1rem;
                    border: 2px dashed #e5e7eb;
                    grid-column: 1 / -1;
                }

                .empty-icon {
                    width: 64px;
                    height: 64px;
                    background: #f0f9eb;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                }

                .pagination-container {
                    margin-top: 2rem;
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .pagination-btn {
                    padding: 0.5rem 1rem;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    background: white;
                    color: #6b7280;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .pagination-btn.active {
                    background: #70AE48;
                    color: white;
                    border-color: #70AE48;
                }

                @media (max-width: 1024px) {
                    .reports-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="header-section">
                <div className="header-content">
                    <h1>États des lieux</h1>
                    <p className="header-description">
                        Documentez l'état de vos biens avec photos et descriptions détaillées.
                    </p>
                </div>
                <button className="create-btn" onClick={() => navigate('/proprietaire/etats-lieux/nouveau')}>
                    <Plus size={18} />
                    Créer un état de lieu
                </button>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => handleFilterChange('all')}>
                    Tous
                </button>
                <button className={`tab-btn ${activeFilter === 'entry' ? 'active' : ''}`} onClick={() => handleFilterChange('entry')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12l7-7 7 7"/>
                    </svg>
                    Entrée
                </button>
                <button className={`tab-btn ${activeFilter === 'exit' ? 'active' : ''}`} onClick={() => handleFilterChange('exit')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                    </svg>
                    Sortie
                </button>
            </div>

            {/* Filters */}
            <div className="filter-section">
                <h3 className="filter-title">Filtrer par bien</h3>

                <select className="property-select" value={propertyFilter} onChange={handlePropertyChange}>
                    <option value="">Tous les biens</option>
                    {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                </select>

                <div className="filter-row">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input 
                            className="search-input" 
                            placeholder="Rechercher locataire, bien..." 
                            value={searchTerm} 
                            onChange={handleSearch}
                        />
                    </div>
                    <button className="display-btn">
                        <Settings size={16} />
                        Affichage
                    </button>
                </div>
            </div>

            {/* Reports Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <Loader2 className="animate-spin" size={40} color="#70AE48" style={{ margin: '0 auto' }} />
                    <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement des états des lieux...</p>
                </div>
            ) : edlList.length > 0 ? (
                <>
                    <div className="reports-grid">
                        {edlList.map((report) => (
                            <div className={`report-card ${report.type}`} key={report.id}>
                                <div className="report-header">
                                    <div className={`report-badge ${report.type}`}>
                                        {report.type === 'entry' ? '→' : report.type === 'exit' ? '←' : '↔'}
                                        {report.typeBadge}
                                    </div>
                                    <h3 className="report-title">{report.title}</h3>
                                    <div className="report-location">
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                            <circle cx="12" cy="10" r="3"/>
                                        </svg>
                                        {report.property_name}
                                    </div>
                                </div>

                                <div className="report-body">
                                    <div className="report-info-grid">
                                        <div className="info-item">
                                            <span className="info-label">Locataire</span>
                                            <span className="info-value">{report.tenant_name}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Date</span>
                                            <span className="info-value">{report.report_date_formatted}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">État</span>
                                            <span className="info-value">{report.general_condition}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Signé</span>
                                            <span className="info-value">{report.is_signed ? '✓ Oui' : '✗ Non'}</span>
                                        </div>
                                    </div>

                                    <div className="photo-count">
                                        <Camera size={16} />
                                        <span>{report.photos_count} photos</span>
                                    </div>
                                </div>

                                <div className="report-footer">
                                    <span className="creation-date">Créé le {report.created_at_formatted}</span>
                                    <div className="action-buttons">
                                        <button 
                                            className="action-btn download" 
                                            title="Télécharger PDF"
                                            onClick={() => handleDownload(report.id)}
                                        >
                                            <Download size={16} />
                                        </button>
                                        <button 
                                            className="action-btn view" 
                                            title="Voir"
                                            onClick={() => handleView(report.id)}
                                        >
                                            <Eye size={16} />
                                        </button>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="pagination-container">
                            <button 
                                className="pagination-btn"
                                disabled={pagination.current_page === 1}
                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                            >
                                Précédent
                            </button>
                            {[...Array(pagination.last_page)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    className={`pagination-btn ${pagination.current_page === i + 1 ? 'active' : ''}`}
                                    onClick={() => setPagination(prev => ({ ...prev, current_page: i + 1 }))}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button 
                                className="pagination-btn"
                                disabled={pagination.current_page === pagination.last_page}
                                onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">
                        <Camera size={32} color="#70AE48" />
                    </div>
                    <h3 className="empty-title">Aucun état des lieux</h3>
                    <p className="empty-description">
                        Vous n'avez pas encore d'états des lieux enregistrés.
                    </p>
                    <button className="create-btn" onClick={() => navigate('/proprietaire/etats-des-lieux/nouveau')}>
                        <Plus size={18} />
                        Créer un état des lieux
                    </button>
                </div>
            )}
        </div>
    );
};

export default EtatsDesLieux;