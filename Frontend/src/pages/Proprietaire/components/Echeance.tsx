import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Loader2, Mail, RefreshCw, Trash2, Clock, CheckCircle, X } from 'lucide-react';
import { rentDueNoticeService } from '@/services/api';

interface EcheanceProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface RentDueNotice {
    id: number;
    reference: string;
    due_date: string;
    due_date_formatted: string;
    total_amount: number;
    month_year: string;
    month_year_formatted: string;
    status: 'pending' | 'sent' | 'paid';
    sent_at: string | null;
    sent_at_formatted: string | null;
    property: {
        id: number;
        name: string;
    };
    tenant: {
        id: number;
        first_name: string;
        last_name: string;
    };
}

interface Stats {
    total: number;
    pending: number;
    sent: number;
    paid: number;
}

interface Property {
    id: number;
    name: string;
}

const Echeance: React.FC<EcheanceProps> = ({ notify }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [notices, setNotices] = useState<RentDueNotice[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, sent: 0, paid: 0 });
    const [properties, setProperties] = useState<Property[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [propertyFilter, setPropertyFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 12,
        total: 0
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const params: any = {
                page: pagination.current_page,
                per_page: pagination.per_page
            };
            
            if (statusFilter) params.status = statusFilter;
            if (propertyFilter) params.property_id = propertyFilter;
            if (searchTerm) params.search = searchTerm;

            const response = await rentDueNoticeService.list(params);
            
            if (response && response.data) {
                setNotices(response.data);
                setPagination({
                    current_page: response.current_page || 1,
                    last_page: response.last_page || 1,
                    per_page: pagination.per_page,
                    total: response.total || 0
                });
            } else if (Array.isArray(response)) {
                setNotices(response);
            }

            const statsRes = await rentDueNoticeService.stats();
            if (statsRes) setStats(statsRes);

            const propsRes = await rentDueNoticeService.getProperties();
            setProperties(propsRes || []);
            
        } catch (error) {
            console.error('Erreur chargement:', error);
            notify('Erreur lors du chargement des avis d\'échéance', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
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
    };

    const handleSend = async (id: number) => {
        try {
            await rentDueNoticeService.send(id);
            notify('Avis d\'échéance envoyé avec succès', 'success');
            fetchData();
        } catch (error) {
            notify('Erreur lors de l\'envoi', 'error');
        }
    };

    const handleResend = async (id: number) => {
        try {
            await rentDueNoticeService.resend(id);
            notify('Avis d\'échéance renvoyé avec succès', 'success');
            fetchData();
        } catch (error) {
            notify('Erreur lors du renvoi', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet avis ? Cette action est irréversible.')) return;
        try {
            await rentDueNoticeService.delete(id);
            notify('Avis d\'échéance supprimé avec succès', 'success');
            fetchData();
        } catch (error) {
            notify('Erreur lors de la suppression', 'error');
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'paid':
                return (
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: '#D1FAE5', color: '#065F46' }}>
                        ✓ PAYÉ
                    </span>
                );
            case 'sent':
                return (
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: '#E0E7FF', color: '#1E40AF' }}>
                        📧 ENVOYÉ
                    </span>
                );
            default:
                return (
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: '#FEF3C7', color: '#92400E' }}>
                        ⏳ EN ATTENTE
                    </span>
                );
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
                        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1F2937', margin: '0 0 0.5rem 0' }}>
                            Avis d'échéance
                        </h1>
                        <p style={{ color: '#6B7280', fontSize: '1rem', margin: '0', maxWidth: '600px' }}>
                            Gérez les avis d'échéance envoyés aux locataires 10 jours avant la date du loyer.
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/proprietaire/avis-echeance/nouveau')}
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
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(112, 174, 72, 0.3)'
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
                        Nouvel avis
                    </button>
                </div>

                {/* Statistiques */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>TOTAL</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1F2937' }}>{stats.total}</div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>EN ATTENTE</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>{stats.pending}</div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>ENVOYÉS</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#70AE48' }}>{stats.sent}</div>
                    </div>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E5E7EB' }}>
                        <div style={{ color: '#9CA3AF', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>PAYÉS</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10B981' }}>{stats.paid}</div>
                    </div>
                </div>

                {/* Filtres */}
                <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid #E5E7EB' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <select 
                                value={propertyFilter} 
                                onChange={handlePropertyFilter}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 16px', 
                                    border: '1px solid #E5E7EB', 
                                    borderRadius: '12px', 
                                    fontSize: '0.9rem',
                                    background: '#FFFFFF',
                                    color: '#1F2937',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#70AE48'; e.target.style.boxShadow = '0 0 0 3px rgba(112, 174, 72, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                            >
                                <option value="">Tous les biens</option>
                                {properties.map(property => (
                                    <option key={property.id} value={property.id}>{property.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1, minWidth: '150px' }}>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => handleStatusFilter(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 16px', 
                                    border: '1px solid #E5E7EB', 
                                    borderRadius: '12px', 
                                    fontSize: '0.9rem',
                                    background: '#FFFFFF',
                                    color: '#1F2937',
                                    cursor: 'pointer'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#70AE48'; e.target.style.boxShadow = '0 0 0 3px rgba(112, 174, 72, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                            >
                                <option value="">Tous les statuts</option>
                                <option value="pending">En attente</option>
                                <option value="sent">Envoyés</option>
                                <option value="paid">Payés</option>
                            </select>
                        </div>

                        <div style={{ flex: 2, minWidth: '250px', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Rechercher..."
                                style={{ 
                                    width: '100%', 
                                    padding: '12px 16px 12px 40px', 
                                    border: '1px solid #E5E7EB', 
                                    borderRadius: '12px', 
                                    fontSize: '0.9rem',
                                    background: '#FFFFFF',
                                    color: '#1F2937'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#70AE48'; e.target.style.boxShadow = '0 0 0 3px rgba(112, 174, 72, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>

                        <button 
                            type="submit" 
                            style={{ 
                                padding: '12px 24px', 
                                background: '#70AE48', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '12px', 
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = '#5d8f3a'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = '#70AE48'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            Rechercher
                        </button>
                    </form>
                </div>

                {/* Liste */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <Loader2 size={48} color="#70AE48" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
                        <p style={{ color: '#6B7280' }}>Chargement des avis d'échéance...</p>
                    </div>
                ) : notices.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '20px', border: '2px dashed #E5E7EB' }}>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6B7280', margin: '1rem 0 0.5rem' }}>Aucun avis d'échéance</h3>
                        <p style={{ color: '#9CA3AF' }}>Les avis seront générés automatiquement 10 jours avant chaque échéance.</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '1.5rem' }}>
                            {notices.map(notice => (
                                <div 
                                    key={notice.id} 
                                    style={{ 
                                        background: 'white', 
                                        borderRadius: '16px', 
                                        padding: '1.5rem', 
                                        border: '1px solid #E5E7EB', 
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                    }}
                                    onMouseOver={(e) => { 
                                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(112, 174, 72, 0.15)'; 
                                        e.currentTarget.style.transform = 'translateY(-2px)'; 
                                        e.currentTarget.style.borderColor = '#70AE48'; 
                                    }}
                                    onMouseOut={(e) => { 
                                        e.currentTarget.style.boxShadow = 'none'; 
                                        e.currentTarget.style.transform = 'translateY(0)'; 
                                        e.currentTarget.style.borderColor = '#E5E7EB'; 
                                    }}
                                >
                                    {/* En-tête */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div>{getStatusBadge(notice.status)}</div>
                                        <span style={{ color: '#9CA3AF', fontSize: '0.75rem' }}>{notice.reference}</span>
                                    </div>

                                    {/* Informations */}
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1F2937', margin: '0 0 0.5rem 0' }}>
                                        {notice.property?.name || 'Bien'}
                                    </h3>
                                    <div style={{ color: '#6B7280', fontSize: '0.85rem', marginBottom: '1rem' }}>
                                        {notice.tenant?.first_name} {notice.tenant?.last_name}
                                    </div>

                                    {/* Détails */}
                                    <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#6B7280' }}>Période</span>
                                            <span style={{ fontWeight: 600 }}>{notice.month_year_formatted || notice.month_year}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span style={{ color: '#6B7280' }}>Date d'échéance</span>
                                            <span style={{ fontWeight: 600 }}>{notice.due_date_formatted}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#6B7280' }}>Loyer + Charges</span>
                                            <span style={{ fontWeight: 600 }}>{formatCurrency(notice.total_amount)}</span>
                                        </div>
                                        {notice.sent_at && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                                <span style={{ color: '#6B7280' }}>Envoyé le</span>
                                                <span style={{ fontWeight: 600 }}>{notice.sent_at_formatted}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {notice.status === 'pending' && (
                                            <form onSubmit={(e) => { e.preventDefault(); handleSend(notice.id); }} style={{ flex: 1 }}>
                                                <button 
                                                    type="submit"
                                                    style={{ 
                                                        width: '100%', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center', 
                                                        gap: '8px', 
                                                        padding: '10px', 
                                                        background: '#70AE48', 
                                                        color: 'white', 
                                                        border: 'none', 
                                                        borderRadius: '10px', 
                                                        cursor: 'pointer', 
                                                        fontWeight: 600,
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseOver={(e) => { e.currentTarget.style.background = '#5d8f3a'; }}
                                                    onMouseOut={(e) => { e.currentTarget.style.background = '#70AE48'; }}
                                                >
                                                    <Mail size={16} />
                                                    Envoyer
                                                </button>
                                            </form>
                                        )}
                                        {notice.status === 'sent' && (
                                            <>
                                                <form onSubmit={(e) => { e.preventDefault(); handleResend(notice.id); }} style={{ flex: 1 }}>
                                                    <button 
                                                        type="submit"
                                                        style={{ 
                                                            width: '100%', 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            gap: '8px', 
                                                            padding: '10px', 
                                                            background: '#F59E0B', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            borderRadius: '10px', 
                                                            cursor: 'pointer', 
                                                            fontWeight: 600,
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => { e.currentTarget.style.background = '#d97706'; }}
                                                        onMouseOut={(e) => { e.currentTarget.style.background = '#F59E0B'; }}
                                                    >
                                                        <RefreshCw size={16} />
                                                        Renvoyer
                                                    </button>
                                                </form>
                                                <form onSubmit={(e) => { e.preventDefault(); handleDelete(notice.id); }} style={{ flex: '0 0 auto' }}>
                                                    <button 
                                                        type="submit"
                                                        style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center', 
                                                            padding: '10px', 
                                                            background: '#EF4444', 
                                                            color: 'white', 
                                                            border: 'none', 
                                                            borderRadius: '10px', 
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => { e.currentTarget.style.background = '#dc2626'; }}
                                                        onMouseOut={(e) => { e.currentTarget.style.background = '#EF4444'; }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </form>
                                            </>
                                        )}
                                        {notice.status === 'paid' && (
                                            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#D1FAE5', borderRadius: '10px', color: '#065F46', fontWeight: 600 }}>
                                                Paiement reçu
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: page }))}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            minWidth: '40px',
                                            height: '40px',
                                            padding: '0 0.75rem',
                                            background: page === pagination.current_page ? '#70AE48' : 'white',
                                            border: '1px solid #E5E7EB',
                                            borderRadius: '8px',
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
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Echeance;