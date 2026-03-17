import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, AlertCircle, FileText, User, Calendar, MessageSquare, Check, X, Info } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from "../../../services/api";

interface NoticeDetail {
    id: number;
    reference: string;
    status: string;
    status_label: string;
    type: 'landlord' | 'tenant';
    type_label: string;
    tenant: {
        id: number;
        first_name: string;
        last_name: string;
        email: string;
    };
    property: {
        id: number;
        address: string;
        city: string;
    };
    notice_date: string;
    notice_date_formatted: string;
    end_date: string;
    end_date_formatted: string;
    reason: string;
    notes?: string;
    lease?: {
        id: number;
        start_date: string;
        end_date: string;
        rent_amount: number;
        deposit_amount: number;
    };
}

interface EditPreavisProps {
    notify?: (msg: string, type: 'success' | 'info' | 'error') => void;
    onBack?: () => void;
    onCancel?: () => void;
}

const EditPreavis: React.FC<EditPreavisProps> = ({ 
    notify = () => {}, 
    onBack, 
    onCancel 
}) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const fetchedRef = useRef(false);
    
    const [formData, setFormData] = useState({
        type: '',
        notice_date: '',
        end_date: '',
        reason: '',
        notes: ''
    });
    
    const [notice, setNotice] = useState<NoticeDetail | null>(null);
    const [dateError, setDateError] = useState(false);
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Charger le préavis depuis l'API - Une seule fois
    useEffect(() => {
        // Éviter les appels multiples
        if (fetchedRef.current) {
            console.log('⏭️ Déjà chargé, ignoré');
            return;
        }
        
        const fetchNotice = async () => {
            setIsLoading(true);
            
            try {
                const response = await api.get(`/notices/${id}`);
                const data = response.data;
                
                setNotice(data);
                setFormData({
                    type: data.type,
                    notice_date: data.notice_date.split('T')[0],
                    end_date: data.end_date.split('T')[0],
                    reason: data.reason,
                    notes: data.notes || ''
                });
                
            } catch (error: any) {
                console.error('Erreur lors du chargement du préavis:', error);
                
                if (error.response?.status === 404) {
                    notify(`Préavis avec ID ${id} non trouvé`, 'error');
                } else if (error.response?.status === 403) {
                    notify('Accès non autorisé à ce préavis', 'error');
                } else if (error.response?.status === 401) {
                    notify('Session expirée, veuillez vous reconnecter', 'error');
                } else {
                    notify('Erreur lors du chargement du préavis', 'error');
                }
            } finally {
                setIsLoading(false);
                fetchedRef.current = true;
            }
        };

        if (id) {
            fetchNotice();
        } else {
            console.error('❌ ID manquant dans l\'URL');
            notify('ID du préavis manquant', 'error');
            setIsLoading(false);
            fetchedRef.current = true;
        }
        
        // Pas de cleanup nécessaire
    }, [id]);

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
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    // Gérer le changement de date de fin
    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const endDate = new Date(e.target.value);
        const noticeDate = new Date(formData.notice_date);
        
        if (endDate <= noticeDate) {
            setDateError(true);
        } else {
            setDateError(false);
        }
        
        setFormData({ ...formData, end_date: e.target.value });
    };

    // Gérer le retour - Redirige vers avis-echeance (comme dans CreatePreavis)
    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate('/proprietaire/avis-echeance');
        }
    };

    // Gérer l'annulation - Redirige vers avis-echeance (comme dans CreatePreavis)
    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate('/proprietaire/avis-echeance');
        }
    };

    // Gérer la soumission du formulaire
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (dateError) {
            notify('La date de fin doit être après la date du préavis', 'error');
            return;
        }

        if (!formData.type) {
            notify('Veuillez sélectionner un type de préavis', 'error');
            return;
        }

        if (!formData.reason) {
            notify('Veuillez saisir un motif', 'error');
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            await api.put(`/notices/${id}`, formData);
            
            notify('Préavis modifié avec succès', 'success');
            
            // Rediriger après un court délai
            setTimeout(() => {
                navigate('/proprietaire/avis-echeance');
            }, 1500);
            
        } catch (error: any) {
            console.error('Erreur lors de la modification:', error);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                notify('Erreur de validation', 'error');
            } else {
                const message = error.response?.data?.message || 'Erreur lors de la modification du préavis';
                notify(message, 'error');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div style={styles.container}>
                <div style={styles.contentCard}>
                    <div style={styles.contentBody}>
                        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                            <div style={{ width: '48px', height: '48px', border: '3px solid #E5E7EB', borderTopColor: '#70AE48', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            <p style={{ color: '#6B7280' }}>Chargement du préavis...</p>
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
                
                .form-control {
                    transition: all 0.2s ease;
                }
                
                .form-control:focus {
                    outline: none;
                    border-color: #70AE48 !important;
                    box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.15) !important;
                }
                
                .button-primary {
                    transition: all 0.2s ease;
                }
                
                .button-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 18px 34px rgba(112, 174, 72, 0.28) !important;
                }
                
                .button-primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .button-secondary {
                    transition: all 0.2s ease;
                }
                
                .button-secondary:hover:not(:disabled) {
                    background: rgba(112, 174, 72, 0.06) !important;
                }
                
                .button-secondary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                .loading-spinner {
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            <div style={styles.contentCard}>
                <div style={styles.contentBody}>
                    {/* Top actions */}
                    <div style={styles.topActions}>
                        <button
                            onClick={handleBack}
                            style={styles.buttonSecondary}
                            className="button-secondary"
                            disabled={isSubmitting}
                        >
                            <ArrowLeft size={16} />
                            Retour à la liste
                        </button>
                    </div>

                    {/* Erreurs de validation */}
                    {Object.keys(errors).length > 0 && (
                        <div style={styles.alertError}>
                            <AlertCircle size={20} style={{ flexShrink: 0 }} />
                            <div>
                                <strong style={{ fontWeight: 850 }}>Erreurs de validation</strong>
                                <ul style={styles.errorList}>
                                    {Object.entries(errors).map(([field, fieldErrors]) => (
                                        fieldErrors.map((error, index) => (
                                            <li key={`${field}-${index}`}>{error}</li>
                                        ))
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Formulaire */}
                    <form onSubmit={handleSubmit} style={styles.formCard}>
                        {/* Informations du bail associé */}
                        {notice && notice.lease && (
                            <div style={styles.leaseInfo}>
                                <h3 style={styles.leaseInfoTitle}>
                                    <Info size={16} />
                                    Informations du bail associé
                                </h3>
                                <div style={styles.leaseDetails}>
                                    <div style={styles.detailItem}>
                                        <div style={styles.detailLabel}>Bien</div>
                                        <div style={styles.detailValue}>
                                            {notice.property.address}
                                        </div>
                                    </div>
                                    <div style={styles.detailItem}>
                                        <div style={styles.detailLabel}>Locataire</div>
                                        <div style={styles.detailValue}>
                                            {notice.tenant.first_name} {notice.tenant.last_name}
                                        </div>
                                    </div>
                                    <div style={styles.detailItem}>
                                        <div style={styles.detailLabel}>Loyer mensuel</div>
                                        <div style={styles.detailValue}>
                                            {formatRent(notice.lease.rent_amount)}
                                        </div>
                                    </div>
                                    <div style={styles.detailItem}>
                                        <div style={styles.detailLabel}>Début du bail</div>
                                        <div style={styles.detailValue}>
                                            {formatDate(notice.lease.start_date)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Type de préavis */}
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <User size={16} />
                                Type de préavis *
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                style={styles.formSelect}
                                required
                                disabled={isSubmitting}
                            >
                                <option value="">Sélectionnez le type</option>
                                <option value="landlord">Préavis bailleur</option>
                                <option value="tenant">Préavis locataire</option>
                            </select>
                        </div>

                        {/* Dates */}
                        <div style={styles.formGroup}>
                            <div style={styles.dateGrid}>
                                <div>
                                    <label style={styles.formLabel}>
                                        <Calendar size={16} />
                                        Date du préavis *
                                    </label>
                                    <input
                                        type="date"
                                        name="notice_date"
                                        value={formData.notice_date}
                                        onChange={(e) => setFormData({ ...formData, notice_date: e.target.value })}
                                        style={styles.formControl}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div>
                                    <label style={styles.formLabel}>
                                        <Calendar size={16} />
                                        Date de fin *
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleEndDateChange}
                                        style={{
                                            ...styles.formControl,
                                            ...(dateError ? styles.inputError : {})
                                        }}
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                            {dateError && (
                                <div style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '4px' }}>
                                    La date de fin doit être après la date du préavis
                                </div>
                            )}
                        </div>

                        {/* Motif */}
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <MessageSquare size={16} />
                                Motif *
                            </label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                style={styles.formTextarea}
                                placeholder="Détaillez le motif du préavis..."
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Notes */}
                        <div style={styles.formGroup}>
                            <label style={styles.formLabel}>
                                <FileText size={16} />
                                Notes additionnelles
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                style={styles.formTextarea}
                                placeholder="Informations complémentaires..."
                                disabled={isSubmitting}
                            />
                        </div>

                        {/* Boutons d'action */}
                        <div style={styles.actionButtons}>
                            <button
                                type="submit"
                                style={styles.buttonPrimary}
                                className="button-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="loading-spinner" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
                                        Enregistrement en cours...
                                    </>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Enregistrer les modifications
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleCancel}
                                style={styles.buttonSecondary}
                                className="button-secondary"
                                disabled={isSubmitting}
                            >
                                <X size={16} />
                                Annuler
                            </button>
                        </div>
                    </form>
                </div>
            </div>
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
    alertError: {
        borderRadius: '14px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(248,113,113,.30)',
        fontWeight: 850,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        background: 'rgba(254,242,242,.92)',
        color: '#991b1b',
    },
    errorList: {
        marginTop: '8px',
        paddingLeft: '1rem',
        fontWeight: 650,
        fontSize: '0.9rem',
    },
    formCard: {
        background: 'white',
        borderRadius: '18px',
        padding: '2rem',
        border: '2px solid rgba(102,126,234,.15)',
        boxShadow: '0 12px 40px rgba(0,0,0,.08)',
    },
    formGroup: {
        marginBottom: '1.5rem',
    },
    formLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.9rem',
        fontWeight: 950,
        color: '#0f172a',
        marginBottom: '0.5rem',
    },
    formControl: {
        width: '100%',
        padding: '0.9rem 1rem',
        borderRadius: '12px',
        border: '2px solid rgba(148,163,184,.25)',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        background: 'rgba(255,255,255,.92)',
        boxSizing: 'border-box' as const,
    },
    formSelect: {
        width: '100%',
        padding: '0.9rem 2.5rem 0.9rem 1rem',
        borderRadius: '12px',
        border: '2px solid rgba(148,163,184,.25)',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        background: 'rgba(255,255,255,.92)',
        appearance: 'none' as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1rem center',
        backgroundSize: '16px',
        boxSizing: 'border-box' as const,
    },
    formTextarea: {
        width: '100%',
        padding: '0.9rem 1rem',
        borderRadius: '12px',
        border: '2px solid rgba(148,163,184,.25)',
        fontSize: '0.95rem',
        transition: 'all 0.2s ease',
        background: 'rgba(255,255,255,.92)',
        minHeight: '120px',
        resize: 'vertical' as const,
        boxSizing: 'border-box' as const,
    },
    dateGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
    },
    leaseInfo: {
        background: 'rgba(112, 174, 72, 0.08)',
        borderRadius: '14px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        border: '2px solid rgba(112, 174, 72, 0.20)',
    },
    leaseInfoTitle: {
        fontSize: '1rem',
        fontWeight: 950,
        color: '#70AE48',
        marginBottom: '0.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    leaseDetails: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '0.75rem',
    },
    detailItem: {
        fontSize: '0.9rem',
    },
    detailLabel: {
        fontWeight: 850,
        color: '#64748b',
    },
    detailValue: {
        color: '#0f172a',
        fontWeight: 700,
    },
    inputError: {
        borderColor: 'rgba(239,68,68,.72) !important',
        boxShadow: '0 0 0 3px rgba(239,68,68,.15) !important',
    },
    actionButtons: {
        display: 'flex',
        flexDirection: 'row' as const,
        justifyContent: 'flex-end' as const,
        alignItems: 'center' as const,
        gap: '1rem',
        width: '100%',
        marginTop: '2rem',
    },
    buttonPrimary: {
        padding: '0.9rem 1.35rem',
        borderRadius: '14px',
        fontWeight: 950,
        fontSize: '0.9rem',
        cursor: 'pointer',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: '#70AE48',
        color: '#fff',
        boxShadow: '0 14px 30px rgba(112, 174, 72, 0.22)',
        width: 'auto',
        flex: '0 0 auto',
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
        width: 'auto',
        flex: '0 0 auto',
        textDecoration: 'none',
    },
} as const;

export default EditPreavis;