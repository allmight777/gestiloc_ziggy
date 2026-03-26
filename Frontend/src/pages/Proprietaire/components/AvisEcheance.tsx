import React, { useState, useEffect } from 'react';
import { Plus, Search, Settings, Eye, Edit2, Trash2, AlertCircle, CheckCircle, Clock, XCircle, User, Calendar, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from "../../../services/api";

interface Notice {
    id: number;
    reference: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    status_label: string;
    status_color: string;
    status_bg_color: string;
    type: 'landlord' | 'tenant';
    type_label: string;
    type_color: string;
    type_bg_color: string;
    tenant_name: string;
    property_address: string;
    property_city: string;
    notice_date: string;
    notice_date_formatted: string;
    end_date: string;
    end_date_formatted: string;
    reason: string;
    notes?: string;
    created_at: string;
    created_at_formatted: string;
    remaining_days: number;
    landlord_name?: string;
}

interface Property {
    id: number;
    address: string;
    city: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ApiResponse {
    notices: Notice[];
    totalNotices: number;
    pendingNotices: number;
    confirmedNotices: number;
    cancelledNotices: number;
    activeLeases: number;
    properties: Property[];
    pagination: Pagination;
}

interface PreavisListProps {
    notify?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const AvisEcheance: React.FC<PreavisListProps> = ({ notify = () => {} }) => {
    const navigate = useNavigate();
    
    // États pour les données
    const [notices, setNotices] = useState<Notice[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [stats, setStats] = useState({
        totalNotices: 0,
        pendingNotices: 0,
        confirmedNotices: 0,
        cancelledNotices: 0,
        activeLeases: 0
    });
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 9,
        total: 0
    });
    
    // États pour les filtres
    const [statusFilter, setStatusFilter] = useState('all');
    const [propertyFilter, setPropertyFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    // États de chargement
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Charger les préavis
    const fetchNotices = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (propertyFilter) params.append('property_id', propertyFilter);
            if (typeFilter) params.append('type', typeFilter);
            if (searchTerm) params.append('search', searchTerm);
            params.append('page', currentPage.toString());
            params.append('limit', '9');
            
            const response = await api.get<ApiResponse>(`/notices?${params.toString()}`);
            
            setNotices(response.data.notices);
            setProperties(response.data.properties || []);
            setStats({
                totalNotices: response.data.totalNotices,
                pendingNotices: response.data.pendingNotices,
                confirmedNotices: response.data.confirmedNotices,
                cancelledNotices: response.data.cancelledNotices,
                activeLeases: response.data.activeLeases
            });
            setPagination(response.data.pagination);
            
        } catch (error: any) {
            console.error('Erreur lors du chargement des préavis:', error);
            setError(error.response?.data?.message || 'Erreur lors du chargement des préavis');
            notify('Erreur lors du chargement des préavis', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Charger au montage et quand les filtres changent
    useEffect(() => {
        fetchNotices();
    }, [statusFilter, propertyFilter, typeFilter, searchTerm, currentPage]);

    // Gérer la soumission du formulaire de filtres
    const handleFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchNotices();
    };

    // Gérer le changement de statut
    const handleStatusChange = (status: string) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    // Gérer le changement de propriété
    const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPropertyFilter(e.target.value);
        setCurrentPage(1);
    };

    // Gérer le changement de type
    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTypeFilter(e.target.value);
        setCurrentPage(1);
    };

    // Gérer la recherche
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // Gérer la recherche (soumission)
    const handleSearchSubmit = () => {
        setCurrentPage(1);
        fetchNotices();
    };

    // Gérer la création
    const handleCreateClick = () => {
        navigate('/proprietaire/preavis/nouveau');
    };

    // Gérer la visualisation - Redirige vers la page de détail
    const handleViewClick = (id: number) => {
        navigate(`/proprietaire/preavis/${id}`);
    };

    // Gérer la modification
    const handleEditClick = (id: number) => {
        navigate(`/proprietaire/preavis/${id}/edit`);
    };

    // Gérer la suppression
    const handleDeleteClick = async (id: number, reference: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce préavis ?')) {
            return;
        }
        
        try {
            await api.delete(`/notices/${id}`);
            setSuccessMessage(`Préavis ${reference} supprimé avec succès`);
            notify(`Préavis ${reference} supprimé`, 'success');
            fetchNotices(); // Recharger la liste
            
            // Effacer le message après 3 secondes
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (error: any) {
            console.error('Erreur lors de la suppression:', error);
            const message = error.response?.data?.message || 'Erreur lors de la suppression';
            setError(message);
            notify(message, 'error');
            
            setTimeout(() => setError(null), 3000);
        }
    };

    // Gérer la pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Formater la référence
    const formatReference = (id: number): string => {
        return `Préavis N°${id.toString().padStart(6, '0')}`;
    };

    // Réinitialiser les filtres
    const resetFilters = () => {
        setStatusFilter('all');
        setPropertyFilter('');
        setTypeFilter('');
        setSearchTerm('');
        setCurrentPage(1);
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '2rem' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                
                * {
                    font-family: 'Inter', sans-serif;
                }
                
                .btn-create {
                    transition: all 0.2s ease;
                }
                
                .btn-create:hover {
                    background: #5a8f3a !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(112, 174, 72, 0.4) !important;
                }
                
                .filter-btn {
                    transition: all 0.2s ease;
                }
                
                .filter-btn:not(.active):hover {
                    background: #D1D5DB !important;
                }
                
                .notice-card {
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .notice-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    border-color: #70AE48 !important;
                }
                
                .action-btn {
                    transition: all 0.2s ease;
                }
                
                .action-btn:hover {
                    transform: translateY(-1px);
                }
                
                .pagination-btn {
                    transition: all 0.2s ease;
                }
                
                .pagination-btn:hover:not(:disabled) {
                    background: #70AE48 !important;
                    color: white !important;
                    border-color: #70AE48 !important;
                }
            `}</style>

            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '2rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{ 
                            fontSize: '1.8rem', 
                            fontWeight: 700, 
                            color: '#1F2937', 
                            margin: '0 0 0.5rem 0' 
                        }}>
                            Avis d’échéance
                        </h1>
                        <p style={{ 
                            color: '#6B7280', 
                            fontSize: '0.9rem', 
                            margin: 0, 
                            maxWidth: '600px' 
                        }}>
                            Gérez les avis d’échéance pour les locataires de vos biens.<br />
                            <strong>Système automatique :</strong> 10 jours avant la date du loyer, l’avis d’échéance est envoyé par email avec lien de paiement.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={() => {
                                // Simulation de génération manuelle
                                notify("Génération manuelle demandée. Choisissez un locataire.", "info");
                            }}
                            className="btn-create"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: '#3B82F6', // Bleu pour distinguer
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            <Calendar size={18} />
                            <span>Générer manuellement</span>
                        </button>

                        <button
                            onClick={handleCreateClick}
                            className="btn-create"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '12px 24px',
                                background: '#70AE48',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                boxShadow: '0 2px 4px rgba(112, 174, 72, 0.3)',
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={18} />
                            <span>Programmer un avis</span>
                        </button>
                    </div>
                </div>

                {/* Statistiques */}
                {!isLoading && (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(4, 1fr)', 
                        gap: '1.5rem', 
                        marginBottom: '2rem' 
                    }}>
                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                            <div style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                TOTAL PRÉAVIS
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1F2937' }}>
                                {stats.totalNotices}
                            </div>
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                            <div style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                EN ATTENTE
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>
                                {stats.pendingNotices}
                            </div>
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                            <div style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                CONFIRMÉS
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10B981' }}>
                                {stats.confirmedNotices}
                            </div>
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                            <div style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                BAUX ACTIFS
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#70AE48' }}>
                                {stats.activeLeases}
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulaire de filtres */}
                <form onSubmit={handleFilterSubmit} id="filter-form">
                    {/* Filtres statut */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => handleStatusChange('all')}
                            className="filter-btn"
                            style={{
                                padding: '10px 24px',
                                border: 'none',
                                borderRadius: '20px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: statusFilter === 'all' ? '#70AE48' : '#E5E7EB',
                                color: statusFilter === 'all' ? 'white' : '#6B7280'
                            }}
                        >
                            Tous
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStatusChange('pending')}
                            className="filter-btn"
                            style={{
                                padding: '10px 24px',
                                border: 'none',
                                borderRadius: '20px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: statusFilter === 'pending' ? '#70AE48' : '#E5E7EB',
                                color: statusFilter === 'pending' ? 'white' : '#6B7280'
                            }}
                        >
                            En attente
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStatusChange('confirmed')}
                            className="filter-btn"
                            style={{
                                padding: '10px 24px',
                                border: 'none',
                                borderRadius: '20px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: statusFilter === 'confirmed' ? '#70AE48' : '#E5E7EB',
                                color: statusFilter === 'confirmed' ? 'white' : '#6B7280'
                            }}
                        >
                            Confirmés
                        </button>
                        <button
                            type="button"
                            onClick={() => handleStatusChange('cancelled')}
                            className="filter-btn"
                            style={{
                                padding: '10px 24px',
                                border: 'none',
                                borderRadius: '20px',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: statusFilter === 'cancelled' ? '#70AE48' : '#E5E7EB',
                                color: statusFilter === 'cancelled' ? 'white' : '#6B7280'
                            }}
                        >
                            Annulés
                        </button>
                    </div>

                    {/* Zone de recherche et filtre */}
                    <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                    FILTRER PAR BIEN
                                </label>
                                <select
                                    name="property_id"
                                    value={propertyFilter}
                                    onChange={handlePropertyChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        color: '#1F2937',
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Tous les biens</option>
                                    {properties.map((property) => (
                                        <option key={property.id} value={property.id}>
                                            {property.address || 'Bien sans nom'} - {property.city || ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                    FILTRER PAR TYPE
                                </label>
                                <select
                                    name="type"
                                    value={typeFilter}
                                    onChange={handleTypeChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px 16px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        fontSize: '0.9rem',
                                        color: '#1F2937',
                                        background: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="">Tous les types</option>
                                    <option value="landlord">Bailleur</option>
                                    <option value="tenant">Locataire</option>
                                </select>
                            </div>

                            <div style={{ flex: 2, minWidth: '300px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'transparent', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                    _
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <Search 
                                        size={18} 
                                        style={{ 
                                            position: 'absolute', 
                                            left: '12px', 
                                            top: '50%', 
                                            transform: 'translateY(-50%)', 
                                            color: '#9CA3AF' 
                                        }} 
                                    />
                                    <input
                                        type="text"
                                        name="search"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        placeholder="Rechercher locataire, adresse..."
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px 10px 42px',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            color: '#1F2937',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ flex: '0 0 auto' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'transparent', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                    _
                                </label>
                                <button
                                    type="submit"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 20px',
                                        background: '#70AE48',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Search size={18} />
                                    Rechercher
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Messages de succès */}
                {successMessage && (
                    <div style={{ 
                        background: '#F0F9F0', 
                        border: '1px solid #70AE48', 
                        borderRadius: '12px', 
                        padding: '1rem 1.25rem', 
                        marginBottom: '2rem', 
                        display: 'flex', 
                        alignItems: 'start', 
                        gap: '12px' 
                    }}>
                        <CheckCircle size={20} color="#70AE48" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong style={{ color: '#2D6A4F', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Succès !</strong>
                            <p style={{ color: '#70AE48', margin: 0, fontSize: '0.9rem' }}>{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Messages d'erreur */}
                {error && (
                    <div style={{ 
                        background: '#FEE2E2', 
                        border: '1px solid #EF4444', 
                        borderRadius: '12px', 
                        padding: '1rem 1.25rem', 
                        marginBottom: '2rem', 
                        display: 'flex', 
                        alignItems: 'start', 
                        gap: '12px' 
                    }}>
                        <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong style={{ color: '#991B1B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Erreur !</strong>
                            <p style={{ color: '#DC2626', margin: 0, fontSize: '0.9rem' }}>{error}</p>
                        </div>
                    </div>
                )}

                {/* État de chargement */}
                {isLoading && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '4rem 2rem', 
                        background: 'white', 
                        borderRadius: '12px', 
                        border: '1px solid #E5E7EB' 
                    }}>
                        <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            border: '3px solid #E5E7EB', 
                            borderTopColor: '#70AE48', 
                            borderRadius: '50%', 
                            margin: '0 auto 1rem',
                            animation: 'spin 1s linear infinite'
                        }} />
                        <style>{`
                            @keyframes spin {
                                to { transform: rotate(360deg); }
                            }
                        `}</style>
                        <p style={{ color: '#6B7280' }}>Chargement des préavis...</p>
                    </div>
                )}

                {/* Grille des préavis - 2 COLONNES */}
                {!isLoading && notices.length === 0 ? (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '4rem 2rem', 
                        background: 'white', 
                        borderRadius: '12px', 
                        border: '2px dashed #E5E7EB' 
                    }}>
                        <AlertCircle size={64} color="#D1D5DB" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: 700, 
                            color: '#6B7280', 
                            margin: '0 0 0.5rem 0' 
                        }}>
                            Aucun préavis trouvé
                        </h3>
                        <p style={{ color: '#9CA3AF', margin: '0 0 1.5rem 0' }}>
                            {searchTerm || propertyFilter || statusFilter !== 'all' || typeFilter
                                ? 'Aucun préavis ne correspond à vos critères de recherche.'
                                : 'Commencez par créer votre premier préavis.'}
                        </p>
                        {!searchTerm && !propertyFilter && statusFilter === 'all' && !typeFilter ? (
                            <button
                                onClick={handleCreateClick}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: '#70AE48',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={18} />
                                Créer un préavis
                            </button>
                        ) : (
                            <button
                                onClick={resetFilters}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: '#6B7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                ) : !isLoading && (
                    <>
                        {/* GRILLE À 2 COLONNES */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(2, 1fr)', // ← MODIFIÉ DE 3 À 2
                            gap: '1.5rem' 
                        }}>
                            {notices.map((notice) => (
                                <div
                                    key={notice.id}
                                    className="notice-card"
                                    style={{
                                        background: 'white',
                                        borderRadius: '12px',
                                        padding: '1.5rem',
                                        border: '1px solid #E5E7EB',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => handleViewClick(notice.id)}
                                >
                                    {/* Header avec badges */}
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        marginBottom: '1rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        {/* Badge statut */}
                                        <div style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '6px', 
                                            padding: '4px 12px', 
                                            background: notice.status_bg_color, 
                                            borderRadius: '20px' 
                                        }}>
                                            {notice.status === 'pending' && <Clock size={12} color={notice.status_color} />}
                                            {notice.status === 'confirmed' && <CheckCircle size={12} color={notice.status_color} />}
                                            {notice.status === 'cancelled' && <XCircle size={12} color={notice.status_color} />}
                                            <span style={{ 
                                                color: notice.status_color, 
                                                fontSize: '0.75rem', 
                                                fontWeight: 700, 
                                                textTransform: 'uppercase' 
                                            }}>
                                                {notice.status_label}
                                            </span>
                                        </div>

                                        {/* Badge type */}
                                        <div style={{ 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '6px', 
                                            padding: '4px 12px', 
                                            background: notice.type_bg_color, 
                                            borderRadius: '20px' 
                                        }}>
                                            <User size={12} color={notice.type_color} />
                                            <span style={{ 
                                                color: notice.type_color, 
                                                fontSize: '0.75rem', 
                                                fontWeight: 700, 
                                                textTransform: 'uppercase' 
                                            }}>
                                                {notice.type_label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Titre et locataire */}
                                    <h3 style={{ 
                                        fontSize: '1.1rem', 
                                        fontWeight: 700, 
                                        color: '#1F2937', 
                                        margin: '0 0 0.5rem 0' 
                                    }}>
                                        {formatReference(notice.id)}
                                    </h3>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '6px', 
                                        color: '#6B7280', 
                                        fontSize: '0.85rem', 
                                        marginBottom: '1.5rem' 
                                    }}>
                                        <User size={14} />
                                        <span>{notice.tenant_name || 'Non spécifié'}</span>
                                    </div>

                                    {/* Détails du préavis */}
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(2, 1fr)', 
                                        gap: '1rem', 
                                        marginBottom: '1.5rem', 
                                        paddingBottom: '1.5rem', 
                                        borderBottom: '1px solid #F3F4F6' 
                                    }}>
                                        <div>
                                            <div style={{ 
                                                color: '#9CA3AF', 
                                                fontSize: '0.7rem', 
                                                fontWeight: 700, 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.5px', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                BIEN
                                            </div>
                                            <div style={{ 
                                                fontWeight: 700, 
                                                color: '#1F2937', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                {notice.property_address || 'Non spécifié'}
                                            </div>
                                            <div style={{ 
                                                color: '#9CA3AF', 
                                                fontSize: '0.8rem' 
                                            }}>
                                                {notice.property_city || ''}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ 
                                                color: '#9CA3AF', 
                                                fontSize: '0.7rem', 
                                                fontWeight: 700, 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.5px', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                DATE PRÉAVIS
                                            </div>
                                            <div style={{ 
                                                fontWeight: 700, 
                                                color: '#1F2937', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                {notice.notice_date_formatted}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ 
                                                color: '#9CA3AF', 
                                                fontSize: '0.7rem', 
                                                fontWeight: 700, 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.5px', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                DATE FIN
                                            </div>
                                            <div style={{ 
                                                fontWeight: 700, 
                                                color: '#1F2937', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                {notice.end_date_formatted}
                                            </div>
                                        </div>

                                        <div>
                                            <div style={{ 
                                                color: '#9CA3AF', 
                                                fontSize: '0.7rem', 
                                                fontWeight: 700, 
                                                textTransform: 'uppercase', 
                                                letterSpacing: '0.5px', 
                                                marginBottom: '0.25rem' 
                                            }}>
                                                DURÉE RESTANTE
                                            </div>
                                            <div style={{ 
                                                fontWeight: 700, 
                                                color: '#1F2937' 
                                            }}>
                                                {notice.remaining_days} jours
                                            </div>
                                        </div>
                                    </div>

                                    {/* Motif */}
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <div style={{ 
                                            color: '#9CA3AF', 
                                            fontSize: '0.7rem', 
                                            fontWeight: 700, 
                                            textTransform: 'uppercase', 
                                            letterSpacing: '0.5px', 
                                            marginBottom: '0.5rem' 
                                        }}>
                                            MOTIF
                                        </div>
                                        <div style={{ 
                                            fontWeight: 500, 
                                            color: '#1F2937', 
                                            fontSize: '0.9rem', 
                                            lineHeight: '1.5', 
                                            background: '#F9FAFB', 
                                            padding: '0.75rem', 
                                            borderRadius: '8px', 
                                            border: '1px solid #E5E7EB' 
                                        }}>
                                            {notice.reason.length > 120 
                                                ? `${notice.reason.substring(0, 120)}...` 
                                                : notice.reason}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ 
                                        display: 'flex', 
                                        gap: '0.5rem' 
                                    }} onClick={(e) => e.stopPropagation()}>
                                        <button
                                            onClick={() => handleViewClick(notice.id)}
                                            className="action-btn"
                                            style={{
                                                flex: 1,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '10px',
                                                background: 'white',
                                                color: '#6B7280',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#F9FAFB';
                                                e.currentTarget.style.borderColor = '#70AE48';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#E5E7EB';
                                            }}
                                        >
                                            <Eye size={16} />
                                            Voir
                                        </button>

                                        <button
                                            onClick={() => handleEditClick(notice.id)}
                                            className="action-btn"
                                            style={{
                                                flex: 1,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '10px',
                                                background: 'white',
                                                color: '#70AE48',
                                                border: '1px solid #70AE48',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#F0F9F0';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'white';
                                            }}
                                        >
                                            <Edit2 size={16} />
                                            Modifier
                                        </button>

                                        <button
                                            onClick={() => handleDeleteClick(notice.id, formatReference(notice.id))}
                                            className="action-btn"
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '10px',
                                                background: 'white',
                                                color: '#EF4444',
                                                border: '1px solid #FCA5A5',
                                                borderRadius: '8px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#FEF2F2';
                                                e.currentTarget.style.borderColor = '#EF4444';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#FCA5A5';
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Date de création */}
                                    <div style={{ 
                                        marginTop: '1rem', 
                                        paddingTop: '1rem', 
                                        borderTop: '1px solid #F3F4F6', 
                                        color: '#9CA3AF', 
                                        fontSize: '0.8rem', 
                                        textAlign: 'center' 
                                    }}>
                                        Créé le {notice.created_at_formatted}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div style={{ 
                                marginTop: '2rem', 
                                display: 'flex', 
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="pagination-btn"
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        background: 'white',
                                        color: currentPage === 1 ? '#9CA3AF' : '#6B7280',
                                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                        opacity: currentPage === 1 ? 0.5 : 1
                                    }}
                                >
                                    Précédent
                                </button>

                                {[...Array(pagination.last_page)].map((_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className="pagination-btn"
                                            style={{
                                                padding: '8px 12px',
                                                border: '1px solid',
                                                borderRadius: '8px',
                                                background: currentPage === page ? '#70AE48' : 'white',
                                                borderColor: currentPage === page ? '#70AE48' : '#E5E7EB',
                                                color: currentPage === page ? 'white' : '#6B7280',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === pagination.last_page}
                                    className="pagination-btn"
                                    style={{
                                        padding: '8px 12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        background: 'white',
                                        color: currentPage === pagination.last_page ? '#9CA3AF' : '#6B7280',
                                        cursor: currentPage === pagination.last_page ? 'not-allowed' : 'pointer',
                                        opacity: currentPage === pagination.last_page ? 0.5 : 1
                                    }}
                                >
                                    Suivant
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AvisEcheance;