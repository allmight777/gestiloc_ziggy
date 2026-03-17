import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, User, Calendar, Home, FileText, Clock, CheckCircle, XCircle, Mail, Phone, MapPin, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from "../../../services/api";

interface NoticeDetail {
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
    tenant: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
    };
    property: {
        id: number;
        address: string;
        city: string;
        postal_code?: string;
    };
    landlord?: {
        id: number;
        name: string;
        email: string;
    };
    notice_date: string;
    notice_date_formatted: string;
    end_date: string;
    end_date_formatted: string;
    reason: string;
    notes?: string;
    created_at: string;
    created_at_formatted: string;
    updated_at?: string;
    remaining_days: number;
    lease?: {
        id: number;
        start_date: string;
        end_date: string;
        rent_amount: number;
        deposit_amount: number;
    };
}

interface PreavisDetailProps {
    notify?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const PreavisDetail: React.FC<PreavisDetailProps> = ({ notify = () => {} }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const [notice, setNotice] = useState<NoticeDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    // Charger les détails du préavis
    useEffect(() => {
        const fetchNoticeDetail = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await api.get(`/notices/${id}`);
                setNotice(response.data);
            } catch (error: any) {
                console.error('Erreur lors du chargement du préavis:', error);
                const message = error.response?.data?.message || 'Erreur lors du chargement du préavis';
                setError(message);
                notify(message, 'error');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchNoticeDetail();
        } else {
            setError('ID du préavis manquant');
            setIsLoading(false);
        }
    }, [id, notify]);

    // Gérer la modification
    const handleEdit = () => {
        navigate(`/proprietaire/preavis/${id}/edit`);
    };

    // Gérer la suppression
    const handleDelete = async () => {
        try {
            await api.delete(`/notices/${id}`);
            notify('Préavis supprimé avec succès', 'success');
            navigate('/proprietaire/avis-echeance');
        } catch (error: any) {
            console.error('Erreur lors de la suppression:', error);
            const message = error.response?.data?.message || 'Erreur lors de la suppression';
            notify(message, 'error');
        } finally {
            setShowConfirmDelete(false);
        }
    };

    // Formater le loyer
    const formatRent = (amount?: number) => {
        if (!amount || isNaN(amount)) return 'Non spécifié';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Formater la date
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Non spécifié';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Obtenir l'icône de statut
    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'pending':
                return <Clock size={20} color="#D97706" />;
            case 'confirmed':
                return <CheckCircle size={20} color="#047857" />;
            case 'cancelled':
                return <XCircle size={20} color="#DC2626" />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div style={styles.container}>
                <div style={styles.contentCard}>
                    <div style={styles.contentBody}>
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                border: '3px solid #E5E7EB', 
                                borderTopColor: '#70AE48', 
                                borderRadius: '50%', 
                                margin: '0 auto 1rem',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            <p style={{ color: '#6B7280' }}>Chargement du préavis...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !notice) {
        return (
            <div style={styles.container}>
                <div style={styles.contentCard}>
                    <div style={styles.contentBody}>
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <AlertCircle size={64} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#DC2626', margin: '0 0 0.5rem 0' }}>
                                Erreur
                            </h3>
                            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>{error || 'Préavis non trouvé'}</p>
                            <button
                                onClick={() => navigate('/proprietaire/avis-echeance')}
                                style={styles.buttonSecondary}
                            >
                                <ArrowLeft size={16} />
                                Retour à la liste
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                * {
                    font-family: 'Inter', sans-serif;
                }
                
                .detail-card {
                    transition: all 0.2s ease;
                }
                
                .detail-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
            `}</style>

            <div style={styles.contentCard}>
                <div style={styles.contentBody}>
                    {/* Top actions */}
                    <div style={styles.topActions}>
                        <button
                            onClick={() => navigate('/proprietaire/avis-echeance')}
                            style={styles.buttonSecondary}
                        >
                            <ArrowLeft size={16} />
                            Retour à la liste
                        </button>
                        
                        <div style={styles.actionButtons}>
                            <button
                                onClick={handleEdit}
                                style={styles.buttonEdit}
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
                                onClick={() => setShowConfirmDelete(true)}
                                style={styles.buttonDelete}
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
                                Supprimer
                            </button>
                        </div>
                    </div>

                    {/* En-tête du préavis */}
                    <div style={styles.headerCard}>
                        <div style={styles.headerLeft}>
                            <h1 style={styles.title}>{notice.reference}</h1>
                            <div style={styles.badgeContainer}>
                                <div style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    padding: '6px 14px', 
                                    background: notice.status_bg_color, 
                                    borderRadius: '30px'
                                }}>
                                    {getStatusIcon(notice.status)}
                                    <span style={{ 
                                        color: notice.status_color, 
                                        fontSize: '0.85rem', 
                                        fontWeight: 700, 
                                        textTransform: 'uppercase' 
                                    }}>
                                        {notice.status_label}
                                    </span>
                                </div>
                                
                                <div style={{ 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    gap: '6px', 
                                    padding: '6px 14px', 
                                    background: notice.type_bg_color, 
                                    borderRadius: '30px'
                                }}>
                                    <User size={16} color={notice.type_color} />
                                    <span style={{ 
                                        color: notice.type_color, 
                                        fontSize: '0.85rem', 
                                        fontWeight: 700, 
                                        textTransform: 'uppercase' 
                                    }}>
                                        {notice.type_label}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div style={styles.headerRight}>
                            <div style={styles.remainingDays}>
                                <Clock size={20} color={notice.remaining_days > 0 ? '#70AE48' : '#EF4444'} />
                                <span style={{ 
                                    fontSize: '1.2rem', 
                                    fontWeight: 700, 
                                    color: notice.remaining_days > 0 ? '#70AE48' : '#EF4444' 
                                }}>
                                    {notice.remaining_days} jours restants
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Grille d'informations */}
                    <div style={styles.infoGrid}>
                        {/* Colonne gauche - Informations locataire et bien */}
                        <div style={styles.infoColumn}>
                            {/* Informations locataire */}
                            <div style={styles.infoCard}>
                                <h3 style={styles.infoCardTitle}>
                                    <User size={18} color="#70AE48" />
                                    Informations locataire
                                </h3>
                                <div style={styles.infoCardContent}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Nom complet</span>
                                        <span style={styles.infoValue}>
                                            {notice.tenant.first_name} {notice.tenant.last_name}
                                        </span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Email</span>
                                        <span style={styles.infoValue}>
                                            <a href={`mailto:${notice.tenant.email}`} style={styles.emailLink}>
                                                {notice.tenant.email}
                                            </a>
                                        </span>
                                    </div>
                                    {notice.tenant.phone && (
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Téléphone</span>
                                            <span style={styles.infoValue}>{notice.tenant.phone}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Informations bien */}
                            <div style={styles.infoCard}>
                                <h3 style={styles.infoCardTitle}>
                                    <Home size={18} color="#70AE48" />
                                    Informations du bien
                                </h3>
                                <div style={styles.infoCardContent}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Adresse</span>
                                        <span style={styles.infoValue}>{notice.property.address}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Ville</span>
                                        <span style={styles.infoValue}>{notice.property.city}</span>
                                    </div>
                                    {notice.property.postal_code && (
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Code postal</span>
                                            <span style={styles.infoValue}>{notice.property.postal_code}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Informations propriétaire */}
                            {notice.landlord && (
                                <div style={styles.infoCard}>
                                    <h3 style={styles.infoCardTitle}>
                                        <User size={18} color="#70AE48" />
                                        Informations propriétaire
                                    </h3>
                                    <div style={styles.infoCardContent}>
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Nom</span>
                                            <span style={styles.infoValue}>{notice.landlord.name}</span>
                                        </div>
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Email</span>
                                            <span style={styles.infoValue}>
                                                <a href={`mailto:${notice.landlord.email}`} style={styles.emailLink}>
                                                    {notice.landlord.email}
                                                </a>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Colonne droite - Dates, motif et bail */}
                        <div style={styles.infoColumn}>
                            {/* Dates du préavis */}
                            <div style={styles.infoCard}>
                                <h3 style={styles.infoCardTitle}>
                                    <Calendar size={18} color="#70AE48" />
                                    Dates du préavis
                                </h3>
                                <div style={styles.infoCardContent}>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Date du préavis</span>
                                        <span style={styles.infoValue}>{formatDate(notice.notice_date)}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Date de fin</span>
                                        <span style={styles.infoValue}>{formatDate(notice.end_date)}</span>
                                    </div>
                                    <div style={styles.infoRow}>
                                        <span style={styles.infoLabel}>Créé le</span>
                                        <span style={styles.infoValue}>{formatDate(notice.created_at)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Motif */}
                            <div style={styles.infoCard}>
                                <h3 style={styles.infoCardTitle}>
                                    <FileText size={18} color="#70AE48" />
                                    Motif du préavis
                                </h3>
                                <div style={styles.infoCardContent}>
                                    <div style={styles.motifBox}>
                                        {notice.reason}
                                    </div>
                                </div>
                            </div>

                            {/* Notes additionnelles */}
                            {notice.notes && (
                                <div style={styles.infoCard}>
                                    <h3 style={styles.infoCardTitle}>
                                        <FileText size={18} color="#70AE48" />
                                        Notes additionnelles
                                    </h3>
                                    <div style={styles.infoCardContent}>
                                        <div style={styles.notesBox}>
                                            {notice.notes}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Informations du bail */}
                            {notice.lease && (
                                <div style={styles.infoCard}>
                                    <h3 style={styles.infoCardTitle}>
                                        <DollarSign size={18} color="#70AE48" />
                                        Informations du bail
                                    </h3>
                                    <div style={styles.infoCardContent}>
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Début du bail</span>
                                            <span style={styles.infoValue}>{formatDate(notice.lease.start_date)}</span>
                                        </div>
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Fin du bail</span>
                                            <span style={styles.infoValue}>{formatDate(notice.lease.end_date)}</span>
                                        </div>
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Loyer mensuel</span>
                                            <span style={styles.infoValueHighlight}>
                                                {formatRent(notice.lease.rent_amount)}
                                            </span>
                                        </div>
                                        <div style={styles.infoRow}>
                                            <span style={styles.infoLabel}>Dépôt de garantie</span>
                                            <span style={styles.infoValue}>
                                                {formatRent(notice.lease.deposit_amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modale de confirmation de suppression */}
            {showConfirmDelete && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContainer}>
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>Confirmer la suppression</h3>
                            <button 
                                onClick={() => setShowConfirmDelete(false)}
                                style={styles.modalClose}
                            >
                                ×
                            </button>
                        </div>
                        <div style={styles.modalBody}>
                            <p style={styles.modalText}>
                                Êtes-vous sûr de vouloir supprimer ce préavis ? Cette action est irréversible.
                            </p>
                        </div>
                        <div style={styles.modalFooter}>
                            <button
                                onClick={() => setShowConfirmDelete(false)}
                                style={styles.modalButtonSecondary}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDelete}
                                style={styles.modalButtonDelete}
                            >
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: '#ffffff',
        padding: '2rem',
        position: 'relative' as const,
        backgroundImage: `
            radial-gradient(900px 520px at 12% -8%, rgba(102,126,234,.16) 0%, rgba(102,126,234,0) 62%),
            radial-gradient(900px 520px at 92% 8%, rgba(118,75,162,.14) 0%, rgba(118,75,162,0) 64%),
            radial-gradient(700px 420px at 40% 110%, rgba(16,185,129,.10) 0%, rgba(16,185,129,0) 60%)
        `,
    },
    contentCard: {
        maxWidth: '1500px',
        margin: '0 auto',
        background: 'rgba(255,255,255,.92)',
        borderRadius: '22px',
        boxShadow: '0 22px 70px rgba(0,0,0,.18)',
        overflow: 'hidden',
        border: '1px solid rgba(102,126,234,.18)',
        position: 'relative' as const,
        backdropFilter: 'blur(10px)',
    },
    contentBody: {
        padding: '2.5rem',
        position: 'relative' as const,
        zIndex: 1,
    },
    topActions: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap' as const,
        gap: '1rem',
    },
    buttonSecondary: {
        padding: '0.9rem 1.35rem',
        borderRadius: '14px',
        fontWeight: 950,
        fontSize: '0.9rem',
        cursor: 'pointer',
        border: '2px solid rgba(112, 174, 72, 0.20)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(255,255,255,.92)',
        color: '#70AE48',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
    },
    actionButtons: {
        display: 'flex',
        gap: '0.75rem',
    },
    buttonEdit: {
        padding: '0.9rem 1.35rem',
        borderRadius: '14px',
        fontWeight: 950,
        fontSize: '0.9rem',
        cursor: 'pointer',
        border: '2px solid #70AE48',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'white',
        color: '#70AE48',
        transition: 'all 0.2s ease',
    },
    buttonDelete: {
        padding: '0.9rem 1.35rem',
        borderRadius: '14px',
        fontWeight: 950,
        fontSize: '0.9rem',
        cursor: 'pointer',
        border: '2px solid #FCA5A5',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'white',
        color: '#EF4444',
        transition: 'all 0.2s ease',
    },
    headerCard: {
        background: 'white',
        borderRadius: '18px',
        padding: '2rem',
        marginBottom: '2rem',
        border: '2px solid rgba(112, 174, 72, .15)',
        boxShadow: '0 12px 40px rgba(0,0,0,.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: '1rem',
    },
    headerLeft: {
        flex: 1,
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: 800,
        color: '#0f172a',
        margin: '0 0 0.75rem 0',
    },
    badgeContainer: {
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap' as const,
    },
    headerRight: {
        textAlign: 'right' as const,
    },
    remainingDays: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(112, 174, 72, 0.08)',
        padding: '0.75rem 1.5rem',
        borderRadius: '50px',
    },
    infoGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
    },
    infoColumn: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.5rem',
    },
    infoCard: {
        background: 'white',
        borderRadius: '16px',
        border: '2px solid rgba(112, 174, 72, .12)',
        overflow: 'hidden',
        boxShadow: '0 8px 25px rgba(0,0,0,.05)',
    },
    infoCardTitle: {
        background: 'linear-gradient(135deg, rgba(112, 174, 72, .10) 0%, rgba(139, 195, 74, .08) 100%)',
        padding: '1.2rem 1.5rem',
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: 800,
        color: '#70AE48',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        borderBottom: '1px solid rgba(112, 174, 72, .15)',
    },
    infoCardContent: {
        padding: '1.5rem',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 0',
        borderBottom: '1px solid rgba(148, 163, 184, .15)',
    },
    infoLabel: {
        fontSize: '0.9rem',
        fontWeight: 600,
        color: '#64748b',
    },
    infoValue: {
        fontSize: '0.95rem',
        fontWeight: 600,
        color: '#0f172a',
    },
    infoValueHighlight: {
        fontSize: '1rem',
        fontWeight: 700,
        color: '#70AE48',
    },
    emailLink: {
        color: '#70AE48',
        textDecoration: 'none',
        borderBottom: '1px dashed #70AE48',
    },
    motifBox: {
        background: '#F9FAFB',
        padding: '1.2rem',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        fontSize: '0.95rem',
        lineHeight: '1.6',
        color: '#0f172a',
    },
    notesBox: {
        background: '#F9FAFB',
        padding: '1.2rem',
        borderRadius: '10px',
        border: '1px solid #E5E7EB',
        fontSize: '0.95rem',
        lineHeight: '1.6',
        color: '#0f172a',
        fontStyle: 'italic',
    },
    // Styles pour la modale
    modalOverlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContainer: {
        background: 'white',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '450px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
    },
    modalHeader: {
        padding: '1.5rem',
        borderBottom: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: '1.2rem',
        fontWeight: 700,
        color: '#0f172a',
        margin: 0,
    },
    modalClose: {
        background: 'none',
        border: 'none',
        fontSize: '2rem',
        cursor: 'pointer',
        color: '#64748b',
        lineHeight: 1,
    },
    modalBody: {
        padding: '1.5rem',
    },
    modalText: {
        fontSize: '1rem',
        color: '#0f172a',
        margin: 0,
    },
    modalFooter: {
        padding: '1.5rem',
        borderTop: '1px solid #E5E7EB',
        display: 'flex',
        gap: '1rem',
        justifyContent: 'flex-end',
    },
    modalButtonSecondary: {
        padding: '0.75rem 1.5rem',
        borderRadius: '10px',
        border: '2px solid #E5E7EB',
        background: 'white',
        color: '#64748b',
        fontWeight: 600,
        cursor: 'pointer',
    },
    modalButtonDelete: {
        padding: '0.75rem 1.5rem',
        borderRadius: '10px',
        border: 'none',
        background: '#EF4444',
        color: 'white',
        fontWeight: 600,
        cursor: 'pointer',
    },
} as const;

export default PreavisDetail;