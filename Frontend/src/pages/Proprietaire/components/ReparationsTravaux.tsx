import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Loader, Check, Calendar, MapPin, Eye, Play, Pencil, Wrench, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { maintenanceService, MaintenanceRequest } from '@/services/api';

interface RTProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Stats {
    urgent: number;
    in_progress: number;
    planned: number;
    total_cost: number;
}

const ReparationsTravaux: React.FC<RTProps> = ({ notify }) => {
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [currentYear] = useState(new Date().getFullYear());
    const navigate = useNavigate();
    
    const [incidents, setIncidents] = useState<MaintenanceRequest[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats>({
        urgent: 0,
        in_progress: 0,
        planned: 0,
        total_cost: 0
    });

    // Filtres
    const [propertyFilter, setPropertyFilter] = useState<string>('all');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Propriétés disponibles pour les filtres
    const [properties, setProperties] = useState<Array<{ id: number; name: string; address: string; city?: string }>>([]);
    const [years, setYears] = useState<number[]>([2024, 2025, 2026]);

    // Charger les interventions
    const fetchIncidents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await maintenanceService.list();
            setIncidents(data || []);
            
            const urgent = data.filter((i: MaintenanceRequest) => i.priority === 'emergency' && i.status === 'open').length;
            const inProgress = data.filter((i: MaintenanceRequest) => i.status === 'in_progress').length;
            const planned = data.filter((i: MaintenanceRequest) => i.status === 'open' && i.priority !== 'emergency').length;
            const totalCost = data.reduce((sum: number, i: MaintenanceRequest) => sum + (i.actual_cost || i.estimated_cost || 0), 0);
            
            setStats({
                urgent,
                in_progress: inProgress,
                planned,
                total_cost: totalCost
            });

            // Extraire les propriétés uniques pour les filtres
            const uniqueProps = new Map();
            data.forEach((inc: MaintenanceRequest) => {
                if (inc.property && !uniqueProps.has(inc.property.id)) {
                    uniqueProps.set(inc.property.id, {
                        id: inc.property.id,
                        name: inc.property.name || inc.property.address,
                        address: inc.property.address,
                        city: inc.property.city
                    });
                }
            });
            setProperties(Array.from(uniqueProps.values()));

            // Extraire les années uniques
            const yearsSet = new Set<number>();
            data.forEach((inc: MaintenanceRequest) => {
                if (inc.created_at) {
                    const year = new Date(inc.created_at).getFullYear();
                    yearsSet.add(year);
                }
            });
            setYears(Array.from(yearsSet).sort((a, b) => b - a));

        } catch (err) {
            console.error("Erreur lors de la récupération des interventions:", err);
            setError("Erreur lors du chargement des interventions");
            notify?.("Erreur lors du chargement des interventions", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, []);

    // Filtrer les interventions
    const filteredIncidents = incidents.filter(incident => {
        // Filtre par statut
        if (activeFilter === 'urgent') return incident.priority === 'emergency' && incident.status === 'open';
        if (activeFilter === 'in_progress') return incident.status === 'in_progress';
        if (activeFilter === 'planned') return incident.status === 'open' && incident.priority !== 'emergency';
        if (activeFilter === 'completed') return incident.status === 'resolved';
        
        // Filtre par propriété
        if (propertyFilter !== 'all' && incident.property?.id !== parseInt(propertyFilter)) return false;
        
        // Filtre par année
        if (yearFilter !== 'all') {
            const incidentYear = new Date(incident.created_at).getFullYear();
            if (incidentYear !== parseInt(yearFilter)) return false;
        }
        
        // Recherche textuelle
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return incident.title?.toLowerCase().includes(query) ||
                   incident.description?.toLowerCase().includes(query) ||
                   incident.property?.address?.toLowerCase().includes(query) ||
                   incident.property?.name?.toLowerCase().includes(query);
        }
        
        return true;
    });

    const getStatusInfo = (status: string, priority: string) => {
        if (status === 'open' && priority === 'emergency') {
            return { 
                label: 'URGENT', 
                class: 'urgent',
                icon: <AlertTriangle size={12} />
            };
        }
        switch (status) {
            case 'open':
                return { 
                    label: 'PLANIFIÉE', 
                    class: 'planned',
                    icon: <Calendar size={12} />
                };
            case 'in_progress':
                return { 
                    label: 'EN COURS', 
                    class: 'in-progress',
                    icon: <Loader size={12} />
                };
            case 'resolved':
                return { 
                    label: 'TERMINÉE', 
                    class: 'completed',
                    icon: <Check size={12} />
                };
            default:
                return { 
                    label: 'PLANIFIÉE', 
                    class: 'planned',
                    icon: <Calendar size={12} />
                };
        }
    };

    const getCategoryLabel = (category: string): string => {
        const labels: Record<string, string> = {
            'plumbing': 'Plomberie',
            'electricity': 'Électricité',
            'heating': 'Chauffage',
            'other': 'Autre'
        };
        return labels[category] || category;
    };

    const getPriorityLabel = (priority: string): string => {
        const labels: Record<string, string> = {
            'low': 'Faible',
            'medium': 'Moyenne',
            'high': 'Élevée',
            'emergency': 'Urgente'
        };
        return labels[priority] || priority;
    };

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatCurrency = (amount: number): string => {
        if (!amount) return '—';
        return new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'XOF',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount).replace('XOF', 'FCFA');
    };

    const handleStartIncident = async (incidentId: number) => {
        try {
            await maintenanceService.update(incidentId, { status: 'in_progress' });
            fetchIncidents();
            notify?.("Intervention démarrée avec succès", "success");
        } catch (error) {
            notify?.("Erreur lors du démarrage de l'intervention", "error");
        }
    };

    return (
        <div className="maintenance-container">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Manrope:wght@400;500;600;700;800&display=swap');
                
                .maintenance-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: #f8fafc;
                    min-height: 100vh;
                    font-family: 'Manrope', sans-serif;
                }

                /* Header */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                    gap: 2rem;
                }

                .header-content h1 {
                    font-size: 2.2rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0 0 0.75rem 0;
                    font-family: 'Merriweather', serif;
                }

                .subtitle {
                    color: #64748b;
                    font-size: 1rem;
                    line-height: 1.6;
                    margin: 0;
                }

                .btn-create {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #70AE48;
                    color: white;
                    padding: 0.875rem 1.5rem;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.95rem;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                }

                .btn-create:hover {
                    background: #5a8f3a;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(112, 174, 72, 0.3);
                }

                /* Stats Row */
                .stats-row {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .stat-box {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 1.25rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }

                .stat-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #94a3b8;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.5rem;
                }

                .stat-value {
                    font-size: 1.8rem;
                    font-weight: 700;
                }

                .stat-value.urgent {
                    color: #dc2626;
                }

                .stat-value.in-progress {
                    color: #70AE48;
                }

                .stat-value.planned {
                    color: #1e293b;
                }

                .stat-value.cost {
                    color: #ea580c;
                }

                /* Status Filters (Pills) */
                .status-filters {
                    display: flex;
                    gap: 0.75rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    padding: 0.75rem 1.5rem;
                    background: #e2e8f0;
                    color: #475569;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    border: none;
                    cursor: pointer;
                }

                .status-pill:hover {
                    background: #cbd5e1;
                }

                .status-pill.active {
                    background: #70AE48;
                    color: white;
                }

                /* Filters Card */
                .filters-card {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                }

                .filters-title {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #1e293b;
                    letter-spacing: 0.05em;
                    margin: 0 0 1rem 0;
                }

                .filters-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .filters-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                }

                .filter-select-wrapper {
                    position: relative;
                }

                .filter-select {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    padding-right: 2.5rem;
                    border: 1px solid #70AE48;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    color: #64748b;
                    background: white;
                    appearance: none;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-select:focus {
                    outline: none;
                    border-color: #5a8f3a;
                    box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
                }

                .select-icon {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 18px;
                    height: 18px;
                    color: #64748b;
                    pointer-events: none;
                }

                .search-row {
                    width: 100%;
                }

                .search-input-wrapper {
                    position: relative;
                    width: 100%;
                }

                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 20px;
                    height: 20px;
                    color: #70AE48;
                }

                .search-input {
                    width: 100%;
                    padding: 0.875rem 1rem 0.875rem 2.75rem;
                    border: 1px solid #70AE48;
                    border-radius: 10px;
                    font-size: 0.95rem;
                    color: #374151;
                    transition: all 0.2s;
                }

                .search-input:focus {
                    outline: none;
                    border-color: #5a8f3a;
                    box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
                }

                .search-input::placeholder {
                    color: #94a3b8;
                }

                /* Interventions Grid */
                .interventions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
                    gap: 1.5rem;
                }

                .intervention-card {
                    background: white;
                    border-radius: 16px;
                    border: 1px solid #e2e8f0;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    transition: all 0.2s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .intervention-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    transform: translateY(-2px);
                    border-color: #70AE48;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.375rem;
                    padding: 0.375rem 0.875rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    width: fit-content;
                }

                .status-badge.urgent {
                    background: #fee2e2;
                    color: #dc2626;
                }

                .status-badge.in-progress {
                    background: #dbeafe;
                    color: #2563eb;
                }

                .status-badge.planned {
                    background: #fef3c7;
                    color: #d97706;
                }

                .status-badge.completed {
                    background: #d1fae5;
                    color: #059669;
                }

                .intervention-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }

                .intervention-location {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: #64748b;
                }

                .intervention-location svg {
                    color: #e74c3c;
                    width: 16px;
                    height: 16px;
                }

                .intervention-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem 1.5rem;
                    padding: 1rem 0;
                    border-top: 1px solid #f1f5f9;
                    border-bottom: 1px solid #f1f5f9;
                }

                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .detail-label {
                    font-size: 0.65rem;
                    font-weight: 700;
                    color: #94a3b8;
                    letter-spacing: 0.05em;
                }

                .detail-value {
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #1e293b;
                }

                .detail-value.cost-value {
                    color: #ea580c;
                }

                .intervention-cost {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0.75rem 0;
                }

                .cost-label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    color: #94a3b8;
                    letter-spacing: 0.05em;
                }

                .cost-amount {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #ea580c;
                }

                .intervention-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: auto;
                    padding-top: 0.75rem;
                }

                .creation-date {
                    font-size: 0.8rem;
                    color: #94a3b8;
                }

                .intervention-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    background: white;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-decoration: none;
                }

                .action-btn:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #374151;
                }

                .action-btn.btn-primary {
                    background: #70AE48;
                    border-color: #70AE48;
                    color: white;
                }

                .action-btn.btn-primary:hover {
                    background: #5a8f3a;
                }

                /* Loading & Error states */
                .loading-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    color: #6b7280;
                    gap: 8px;
                    font-size: 0.9rem;
                }

                .error-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 3rem;
                    color: #ef4444;
                    gap: 8px;
                    font-size: 0.9rem;
                }

                /* Empty State */
                .empty-state {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 4rem 2rem;
                    background: white;
                    border-radius: 16px;
                    border: 2px dashed #e2e8f0;
                }

                .empty-state svg {
                    color: #cbd5e1;
                    margin-bottom: 1rem;
                    width: 64px;
                    height: 64px;
                }

                .empty-state h3 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #374151;
                    margin: 1rem 0 0.5rem 0;
                }

                .empty-state p {
                    color: #64748b;
                    margin-bottom: 1.5rem;
                    font-size: 0.95rem;
                }

                /* Responsive */
                @media (max-width: 1024px) {
                    .stats-row {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .maintenance-container {
                        padding: 1rem;
                    }
                    
                    .page-header {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .stats-row {
                        grid-template-columns: 1fr;
                    }

                    .filters-row {
                        grid-template-columns: 1fr;
                    }

                    .interventions-grid {
                        grid-template-columns: 1fr;
                    }

                    .status-filters {
                        overflow-x: auto;
                        flex-wrap: nowrap;
                        padding-bottom: 0.5rem;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>Répartitions et travaux</h1>
                    <p className="subtitle">
                        Gérez vos interventions, suivez les demandes de vos locataires et planifiez les travaux.<br />
                        Centralisez tous les devis, factures et suivis de chantier au même endroit.
                    </p>
                </div>
                <button className="btn-create" onClick={() => navigate('/proprietaire/incidents/nouveau')}>
                    <Plus size={20} />
                    Créer une intervention
                </button>
            </div>

            {/* Statistiques */}
            <div className="stats-row">
                <div className="stat-box">
                    <div className="stat-label">INTERVENTIONS URGENTES</div>
                    <div className="stat-value urgent">{stats.urgent}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">EN COURS</div>
                    <div className="stat-value in-progress">{stats.in_progress}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">PLANIFIÉES</div>
                    <div className="stat-value planned">{stats.planned}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">COÛT TOTAL {currentYear}</div>
                    <div className="stat-value cost">{formatCurrency(stats.total_cost)}</div>
                </div>
            </div>

            {/* Filtres par statut (pills) */}
            <div className="status-filters">
                <button 
                    className={`status-pill ${activeFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('all')}
                >
                    Tous
                </button>
                <button 
                    className={`status-pill ${activeFilter === 'urgent' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('urgent')}
                >
                    Urgentes
                </button>
                <button 
                    className={`status-pill ${activeFilter === 'in_progress' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('in_progress')}
                >
                    En cours
                </button>
                <button 
                    className={`status-pill ${activeFilter === 'planned' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('planned')}
                >
                    Planifiées
                </button>
                <button 
                    className={`status-pill ${activeFilter === 'completed' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('completed')}
                >
                    Terminées
                </button>
            </div>

            {/* Filtres avancés */}
            <div className="filters-card">
                <h3 className="filters-title">FILTRE</h3>
                <div className="filters-form">
                    <div className="filters-row">
                        <div className="filter-select-wrapper">
                            <select 
                                className="filter-select"
                                value={propertyFilter}
                                onChange={(e) => setPropertyFilter(e.target.value)}
                            >
                                <option value="all">Tous les biens</option>
                                {properties.map(prop => (
                                    <option key={prop.id} value={prop.id}>
                                        {prop.name || prop.address} {prop.city ? ` - ${prop.city}` : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="select-icon" />
                        </div>

                        <div className="filter-select-wrapper">
                            <select 
                                className="filter-select"
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                            >
                                <option value="all">Toutes les années</option>
                                {years.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            <ChevronDown size={18} className="select-icon" />
                        </div>
                    </div>

                    <div className="search-row">
                        <div className="search-input-wrapper">
                            <Search size={20} className="search-icon" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Rechercher"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="loading-state">
                    Chargement...
                </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
                <div className="error-state">
                    {error}
                </div>
            )}

            {/* Interventions Grid */}
            {!isLoading && !error && (
                <div className="interventions-grid">
                    {filteredIncidents.length === 0 ? (
                        <div className="empty-state">
                            <Wrench size={64} />
                            <h3>Aucune intervention</h3>
                            <p>Vous n'avez pas encore d'interventions pour les biens délégués.</p>
                            <button 
                                className="btn-create"
                                onClick={() => navigate('/proprietaire/incidents/nouveau')}
                            >
                                <Plus size={18} />
                                Créer une intervention
                            </button>
                        </div>
                    ) : (
                        filteredIncidents.map((incident) => {
                            const statusInfo = getStatusInfo(incident.status, incident.priority);
                            return (
                                <div className="intervention-card" key={incident.id}>
                                    {/* Badge statut */}
                                    <div className={`status-badge ${statusInfo.class}`}>
                                        {statusInfo.icon}
                                        {statusInfo.label}
                                    </div>

                                    {/* Titre */}
                                    <h3 className="intervention-title">{incident.title}</h3>

                                    {/* Localisation */}
                                    <div className="intervention-location">
                                        <MapPin size={16} />
                                        <span>
                                            {incident.property?.name || 'Bien'} • {incident.property?.city || 'Ville non spécifiée'}
                                        </span>
                                    </div>

                                    {/* Détails en grille */}
                                    <div className="intervention-details">
                                        <div className="detail-item">
                                            <span className="detail-label">TYPE</span>
                                            <span className="detail-value">{getCategoryLabel(incident.category)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">PRIORITÉ</span>
                                            <span className="detail-value">{getPriorityLabel(incident.priority)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">DEMANDÉ LE</span>
                                            <span className="detail-value">{formatDate(incident.created_at)}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">PRESTATAIRE</span>
                                            <span className="detail-value">{incident.assigned_provider || 'À affecter'}</span>
                                        </div>

                                        {incident.status === 'in_progress' && incident.started_at && (
                                            <>
                                                <div className="detail-item">
                                                    <span className="detail-label">DÉBUT TRAVAUX</span>
                                                    <span className="detail-value">{formatDate(incident.started_at)}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">AVANCEMENT</span>
                                                    <span className="detail-value">{incident.progress || '0'}%</span>
                                                </div>
                                            </>
                                        )}

                                        {incident.status === 'resolved' && (
                                            <>
                                                <div className="detail-item">
                                                    <span className="detail-label">DATE RÉALISATION</span>
                                                    <span className="detail-value">{incident.resolved_at ? formatDate(incident.resolved_at) : 'N/A'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">FACTURE</span>
                                                    <span className="detail-value">{incident.actual_cost ? 'Payée' : 'En attente'}</span>
                                                </div>
                                            </>
                                        )}

                                        {incident.status !== 'in_progress' && incident.status !== 'resolved' && (
                                            <div className="detail-item">
                                                <span className="detail-label">DEVIS ESTIMÉ</span>
                                                <span className="detail-value cost-value">
                                                    {incident.estimated_cost ? formatCurrency(incident.estimated_cost) : '—'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Coût en grand si disponible */}
                                    {(incident.estimated_cost || incident.actual_cost) && (
                                        <div className="intervention-cost">
                                            <span className="cost-label">
                                                DEVIS {incident.status === 'resolved' ? 'FINAL' : 'ACCEPTÉ'}
                                            </span>
                                            <span className="cost-amount">
                                                {formatCurrency(incident.actual_cost || incident.estimated_cost || 0)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="intervention-footer">
                                        <span className="creation-date">
                                            {incident.status === 'resolved'
                                                ? `Terminé le ${incident.resolved_at ? formatDate(incident.resolved_at) : 'N/A'}`
                                                : incident.status === 'in_progress' && incident.estimated_end_date
                                                    ? `Fin prévue : ${formatDate(incident.estimated_end_date)}`
                                                    : `Créé le ${formatDate(incident.created_at)}`
                                            }
                                        </span>

                                        <div className="intervention-actions">
                                            <button 
                                                className="action-btn" 
                                                title="Voir"
                                                onClick={() => navigate(`/proprietaire/incidents/${incident.id}`)}
                                            >
                                                <Eye size={16} />
                                            </button>
                                            {incident.status === 'open' && (
                                                <button 
                                                    className="action-btn btn-primary" 
                                                    title="Prendre en charge"
                                                    onClick={() => handleStartIncident(incident.id)}
                                                >
                                                    <Play size={16} />
                                                </button>
                                            )}
                                            <button 
                                                className="action-btn" 
                                                title="Modifier"
                                                onClick={() => navigate(`/proprietaire/incidents/${incident.id}/edit`)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
            
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ReparationsTravaux;