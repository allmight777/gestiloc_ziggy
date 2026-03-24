import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Loader2, FileText, Download, Mail, Trash2, Check, Clock, AlertCircle, Home, User, Calendar, DollarSign } from 'lucide-react';
import { rentReceiptService } from '@/services/api';

interface QuittanceData {
    id: string;
    status: string;
    statutBadge: string;
    statutBadgeColor: string;
    titre: string;
    lieu: string;
    tenantName: string;
    propertyCity: string;
    periode: string;
    periodeFormatted: string;
    paiementRecu: string;
    loyer: number;
    charges: number;
    totalPaye: number;
    totalPayeFormatted: string;
    creeLe: string;
    creeLeFormatted: string;
    paidMonth: string;
    propertyId: number;
    leaseId: number;
    tenantFirstName?: string;
    tenantLastName?: string;
    propertyName?: string;
}

interface Stats {
    totalReceipts: number;
    thisMonthReceipts: number;
    pendingReceipts: number;
    totalCollected: number;
}

interface Property {
    id: number;
    name: string;
    address?: string;
    city?: string;
}

interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links?: any[];
}

interface QuittancesLoyersPageProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const QuittancesLoyersPage: React.FC<QuittancesLoyersPageProps> = ({ notify }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quittanceList, setQuittanceList] = useState<QuittanceData[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalReceipts: 0,
        thisMonthReceipts: 0,
        pendingReceipts: 0,
        totalCollected: 0
    });
    const [properties, setProperties] = useState<Property[]>([]);
    
    // Filtres
    const [statusFilter, setStatusFilter] = useState('all');
    const [propertyFilter, setPropertyFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    // Pagination
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0
    });

    // Taux de conversion (à ajuster selon votre besoin)
    const EXCHANGE_RATE = 655; // 1 Euro = 655 FCFA

    const fetchProperties = async () => {
        try {
            const response = await rentReceiptService.getPropertiesForFilter?.() || [];
            setProperties(response || []);
        } catch (error) {
            console.error('Erreur chargement propriétés:', error);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            
            const params: any = {
                per_page: pagination.per_page,
                page: pagination.current_page
            };
            
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            
            if (propertyFilter) {
                params.property_id = propertyFilter;
            }
            
            if (searchTerm) {
                params.search = searchTerm;
            }
            
            const response = await rentReceiptService.listIndependent(params);
            
            let data = [];
            let totalCount = 0;
            let currentPage = 1;
            let lastPage = 1;
            
            if (response && response.data) {
                data = response.data;
                totalCount = response.total || 0;
                currentPage = response.current_page || 1;
                lastPage = response.last_page || 1;
            } else if (Array.isArray(response)) {
                data = response;
                totalCount = response.length;
            }
            
            let totalCollected = 0;
            let thisMonthCount = 0;
            let pendingCount = 0;
            const now = new Date();

            const mapped = data.map((q: any) => {
                // 🔥 CORRECTION : Récupérer correctement le loyer et les charges depuis le bail
                const totalPaye = parseFloat(q.amount_paid || 0);
                const rentAmount = parseFloat(q.lease?.rent_amount || 0);
                const chargesAmount = parseFloat(q.lease?.charges_amount || 0);
                
                // Le loyer payé correspond au total - les charges
                // Si le total payé est différent de rent + charges, on garde la différence
                const loyerPaye = rentAmount;
                const chargesPaye = chargesAmount;
                
                totalCollected += totalPaye;
                
                const createdAt = new Date(q.created_at);
                if (createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()) {
                    thisMonthCount++;
                }

                if (q.status === 'pending' || q.status === 'draft') pendingCount++;

                const tenantFirstName = q.tenant?.first_name || '';
                const tenantLastName = q.tenant?.last_name || '';
                const tenantFullName = q.tenant?.user?.name || `${tenantFirstName} ${tenantLastName}`.trim() || 'Locataire';
                const propertyCity = q.property?.city || '';
                
                let periodeFormatted = q.paid_month || '—';
                if (q.paid_month) {
                    const [year, month] = q.paid_month.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
                    periodeFormatted = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                }

                return {
                    id: String(q.id),
                    status: q.status || 'unknown',
                    statutBadge: q.status === 'issued' ? '✓ ÉMISE' : (q.status === 'pending' || q.status === 'draft' ? '📧 BROUILLON' : q.status?.toUpperCase() || 'INCONNU'),
                    statutBadgeColor: q.status === 'issued' ? '#83C757' : (q.status === 'pending' || q.status === 'draft' ? '#f59e0b' : '#6b7280'),
                    titre: `Quittance - ${q.paid_month || '—'}`,
                    lieu: `${tenantFullName} • ${q.property?.name || 'Bien inconnu'}`,
                    tenantName: tenantFullName,
                    propertyCity: propertyCity,
                    periode: q.paid_month || '—',
                    periodeFormatted: periodeFormatted,
                    paiementRecu: q.issued_date ? new Date(q.issued_date).toLocaleDateString('fr-FR') : '—',
                    // 🔥 CORRECTION : Utiliser les bonnes valeurs
                    loyer: loyerPaye,
                    charges: chargesPaye,
                    totalPaye: totalPaye,
                    totalPayeFormatted: `${totalPaye.toLocaleString('fr-FR')} FCFA`,
                    creeLe: q.created_at,
                    creeLeFormatted: new Date(q.created_at).toLocaleDateString('fr-FR'),
                    paidMonth: q.paid_month,
                    propertyId: q.property?.id,
                    leaseId: q.lease_id,
                    tenantFirstName: tenantFirstName,
                    tenantLastName: tenantLastName,
                    propertyName: q.property?.name,
                };
            });

            setQuittanceList(mapped);
            setStats({
                totalReceipts: totalCount,
                thisMonthReceipts: thisMonthCount,
                pendingReceipts: pendingCount,
                totalCollected: totalCollected
            });
            
            setPagination({
                current_page: currentPage,
                last_page: lastPage,
                per_page: pagination.per_page,
                total: totalCount
            });
            
        } catch (error) {
            console.error('Erreur quittances:', error);
            notify('Erreur lors du chargement des quittances', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
        fetchData();
    }, [statusFilter, propertyFilter, searchTerm, pagination.current_page]);

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePropertyFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPropertyFilter(e.target.value);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchData();
    };

    const handleDownload = async (id: string, fileName: string) => {
        try {
            const blob = await rentReceiptService.downloadPdf(parseInt(id));
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quittance_${fileName}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erreur téléchargement:', error);
            notify('Erreur lors du téléchargement', 'error');
        }
    };

    const handleSendEmail = async (id: string) => {
        try {
            await rentReceiptService.sendByEmail(parseInt(id));
            setSuccessMessage('Quittance envoyée par email avec succès');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        } catch (error) {
            console.error('Erreur envoi email:', error);
            setErrorMessage('Erreur lors de l\'envoi par email');
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette quittance ?')) return;
        
        try {
            await rentReceiptService.delete?.(parseInt(id));
            fetchData();
            setSuccessMessage('Quittance supprimée avec succès');
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        } catch (error) {
            console.error('Erreur suppression:', error);
            setErrorMessage('Erreur lors de la suppression');
            setShowError(true);
            setTimeout(() => setShowError(false), 5000);
        }
    };

    const formatCurrency = (amount: number): string => {
        return amount.toLocaleString('fr-FR') + ' FCFA';
    };

    return (
        <div style={{ minHeight: '100vh', background: '#F8F9FA', padding: '2rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1F2937', margin: '0 0 0.5rem 0' }}>
                            Quittances de loyers
                        </h1>
                        <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: '0', maxWidth: '600px' }}>
                            Créez et générez vos quittances de loyer après réception des paiements.<br />
                            Envoyez automatiquement les quittances à vos locataires.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/proprietaire/creer-quittance')}
                        className="btn-create"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: '#70AE48',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            boxShadow: '0 4px 12px rgba(112, 174, 72, 0.3)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#5d8f3a';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(112, 174, 72, 0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = '#70AE48';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(112, 174, 72, 0.3)';
                        }}
                    >
                        <Plus size={18} />
                        <span>Créer une quittance de loyer</span>
                    </button>
                </div>

                {/* Messages de succès/erreur */}
                {showSuccess && (
                    <div style={{ background: 'rgba(112, 174, 72, 0.1)', border: '1px solid #70AE48', borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <Check size={20} color="#70AE48" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong style={{ color: '#2e5e1e', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Succès !</strong>
                            <p style={{ color: '#3d7526', margin: 0, fontSize: '0.9rem' }}>{successMessage}</p>
                        </div>
                    </div>
                )}

                {showError && (
                    <div style={{ background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '16px', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'start', gap: '12px' }}>
                        <AlertCircle size={20} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <strong style={{ color: '#991B1B', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Erreur !</strong>
                            <p style={{ color: '#DC2626', margin: 0, fontSize: '0.9rem' }}>{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Statistiques */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            QUITTANCES ÉMISES
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1F2937' }}>
                            {stats.totalReceipts}
                        </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            CE MOIS-CI
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#70AE48' }}>
                            {stats.thisMonthReceipts}
                        </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            EN ATTENTE D'ENVOI
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>
                            {stats.pendingReceipts}
                        </div>
                    </div>

                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                            TOTAL ENCAISSÉ
                        </div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#70AE48' }}>
                            {formatCurrency(stats.totalCollected)}
                        </div>
                    </div>
                </div>

                {/* Formulaire de filtres */}
                <form onSubmit={handleSearch} id="filter-form">
                    {/* Filtres statut */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                        {['all', 'sent', 'pending', 'year'].map((status) => {
                            const labels: Record<string, string> = {
                                'all': 'Tous',
                                'sent': 'Envoyées',
                                'pending': 'En attente',
                                'year': 'Par année'
                            };
                            return (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusFilter(status)}
                                    className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                                    style={{
                                        padding: '10px 24px',
                                        border: 'none',
                                        borderRadius: '30px',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: statusFilter === status ? '#70AE48' : '#E5E7EB',
                                        color: statusFilter === status ? 'white' : '#6B7280'
                                    }}
                                    onMouseOver={(e) => {
                                        if (statusFilter !== status) {
                                            e.currentTarget.style.background = '#D1D5DB';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (statusFilter !== status) {
                                            e.currentTarget.style.background = '#E5E7EB';
                                        }
                                    }}
                                >
                                    {labels[status]}
                                </button>
                            );
                        })}
                    </div>

                    {/* Zone de recherche et filtre */}
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                    FILTRER PAR BIEN
                                </label>
                                <select
                                    name="property_id"
                                    onChange={handlePropertyFilter}
                                    value={propertyFilter}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '12px',
                                        fontSize: '0.9rem',
                                        color: '#1F2937',
                                        background: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => {
                                        e.currentTarget.style.borderColor = '#70AE48';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(112, 174, 72, 0.1)';
                                    }}
                                    onBlur={(e) => {
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    <option value="">Tous les biens</option>
                                    {properties.map((property) => (
                                        <option key={property.id} value={property.id}>
                                            {property.name || property.address || `Bien ${property.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                                    RECHERCHER
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
    onChange={(e) => setSearchTerm(e.target.value)}
    placeholder="Locataire, bien, mois..."
    style={{
        width: '100%',
        padding: '12px 16px 12px 42px',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        fontSize: '0.9rem',
        color: '#1F2937',          // Texte gris foncé (presque noir)
        background: '#FFFFFF',      // Fond blanc
        transition: 'all 0.2s'
    }}
    onFocus={(e) => {
        e.currentTarget.style.borderColor = '#70AE48';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(112, 174, 72, 0.1)';
        e.currentTarget.style.background = '#FFFFFF';
    }}
    onBlur={(e) => {
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.background = '#FFFFFF';
    }}
/>
                                </div>
                            </div>

                            <div style={{ flex: '0 0 auto' }}>
                                <button
                                    type="submit"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '12px 28px',
                                        background: '#70AE48',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 8px rgba(112, 174, 72, 0.2)'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = '#5d8f3a';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(112, 174, 72, 0.3)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = '#70AE48';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(112, 174, 72, 0.2)';
                                    }}
                                >
                                    <Search size={18} />
                                    Rechercher
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Grille des quittances */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <Loader2 size={48} color="#70AE48" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                        <p style={{ color: '#6B7280', fontSize: '1rem' }}>Chargement des quittances...</p>
                    </div>
                ) : quittanceList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '20px', border: '2px dashed #E5E7EB' }}>
                        <FileText size={64} color="#D1D5DB" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6B7280', margin: '0 0 0.5rem 0' }}>
                            Aucune quittance trouvée
                        </h3>
                        <p style={{ color: '#9CA3AF', margin: '0 0 1.5rem 0' }}>
                            {searchTerm || propertyFilter || statusFilter !== 'all'
                                ? 'Aucune quittance ne correspond à vos critères de recherche.'
                                : 'Commencez par créer votre première quittance.'}
                        </p>
                        {!searchTerm && !propertyFilter && statusFilter === 'all' ? (
                            <button
                                onClick={() => navigate('/proprietaire/creer-quittance')}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 28px',
                                    background: '#70AE48',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    boxShadow: '0 4px 12px rgba(112, 174, 72, 0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#5d8f3a';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#70AE48';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <Plus size={18} />
                                Créer une quittance
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setStatusFilter('all');
                                    setPropertyFilter('');
                                    setSearchTerm('');
                                }}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 28px',
                                    background: '#6B7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#4B5563';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#6B7280';
                                }}
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                            {quittanceList.map((q) => (
                                <div
                                    key={q.id}
                                    style={{
                                        background: 'white',
                                        borderRadius: '20px',
                                        padding: '1.5rem',
                                        border: '1px solid #E5E7EB',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(112, 174, 72, 0.15)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.borderColor = '#70AE48';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                    }}
                                >
                                    {/* Header de la carte */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {q.status === 'issued' ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(112, 174, 72, 0.1)', borderRadius: '30px' }}>
                                                    <Check size={12} color="#70AE48" />
                                                    <span style={{ color: '#70AE48', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>Envoyée</span>
                                                </div>
                                            ) : q.status === 'pending' || q.status === 'draft' ? (
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '30px' }}>
                                                    <Clock size={12} color="#F59E0B" />
                                                    <span style={{ color: '#F59E0B', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>En attente</span>
                                                </div>
                                            ) : null}
                                        </div>
                                        <span style={{ color: '#9CA3AF', fontSize: '0.7rem', fontWeight: 500 }}>
                                            {q.creeLeFormatted}
                                        </span>
                                    </div>

                                    {/* Titre et locataire */}
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1F2937', margin: '0 0 0.75rem 0' }}>
                                        Quittance {q.periodeFormatted}
                                    </h3>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '32px', height: '32px', background: 'rgba(112, 174, 72, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={16} color="#70AE48" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#1F2937' }}>{q.tenantName}</div>
                                            <div style={{ color: '#9CA3AF', fontSize: '0.8rem' }}>{q.propertyCity || '—'}</div>
                                        </div>
                                    </div>

                                    {/* Détails financiers */}
                                    <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>Loyer</span>
                                            <span style={{ fontWeight: 600, color: '#1F2937' }}>{formatCurrency(q.loyer)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                            <span style={{ color: '#6B7280', fontSize: '0.8rem' }}>Charges</span>
                                            <span style={{ fontWeight: 600, color: '#1F2937' }}>{formatCurrency(q.charges)}</span>
                                        </div>
                                        <div style={{ height: '1px', background: '#E5E7EB', margin: '0.75rem 0' }}></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#6B7280', fontSize: '0.8rem', fontWeight: 600 }}>Total payé</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#70AE48' }}>{q.totalPayeFormatted}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleDownload(q.id, q.paidMonth || q.id)}
                                            style={{
                                                flex: 1,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '12px',
                                                background: 'white',
                                                color: '#6B7280',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '12px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#F9FAFB';
                                                e.currentTarget.style.borderColor = '#70AE48';
                                                e.currentTarget.style.color = '#70AE48';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#E5E7EB';
                                                e.currentTarget.style.color = '#6B7280';
                                            }}
                                        >
                                            <Download size={16} />
                                            Télécharger
                                        </button>

                                        <button
                                            onClick={() => handleSendEmail(q.id)}
                                            style={{
                                                flex: 1,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '12px',
                                                background: 'white',
                                                color: '#6B7280',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '12px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#F9FAFB';
                                                e.currentTarget.style.borderColor = '#70AE48';
                                                e.currentTarget.style.color = '#70AE48';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#E5E7EB';
                                                e.currentTarget.style.color = '#6B7280';
                                            }}
                                        >
                                            <Mail size={16} />
                                            Envoyer
                                        </button>

                                        <button
                                            onClick={() => handleDelete(q.id)}
                                            style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px',
                                                padding: '12px',
                                                background: 'white',
                                                color: '#EF4444',
                                                border: '1px solid #FCA5A5',
                                                borderRadius: '12px',
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#FEF2F2';
                                                e.currentTarget.style.borderColor = '#EF4444';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'white';
                                                e.currentTarget.style.borderColor = '#FCA5A5';
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
                                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setPagination(prev => ({ ...prev, current_page: page }))}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                minWidth: '40px',
                                                height: '40px',
                                                padding: '0 0.5rem',
                                                background: page === pagination.current_page ? '#70AE48' : 'white',
                                                border: '1px solid #E5E7EB',
                                                borderRadius: '12px',
                                                color: page === pagination.current_page ? 'white' : '#6B7280',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                if (page !== pagination.current_page) {
                                                    e.currentTarget.style.background = '#F9FAFB';
                                                    e.currentTarget.style.borderColor = '#70AE48';
                                                    e.currentTarget.style.color = '#70AE48';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                if (page !== pagination.current_page) {
                                                    e.currentTarget.style.background = 'white';
                                                    e.currentTarget.style.borderColor = '#E5E7EB';
                                                    e.currentTarget.style.color = '#6B7280';
                                                }
                                            }}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

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

export default QuittancesLoyersPage;