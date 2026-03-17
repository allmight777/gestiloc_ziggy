import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { maintenanceService } from '@/services/api';
import { ArrowLeft, Calendar, AlertTriangle, Loader, Clock, XCircle, CheckCircle, Info, AlertCircle, Home, FileText, Image, Settings, MessageSquare, Send, Play, User, X } from 'lucide-react';

interface IncidentDetailProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({ notify }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [incident, setIncident] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [showCancelForm, setShowCancelForm] = useState(false);
    const [showResolveForm, setShowResolveForm] = useState(false);
    const [replyMessage, setReplyMessage] = useState('');
    const [providerName, setProviderName] = useState('');
    const [providerContact, setProviderContact] = useState('');
    const [estimatedCost, setEstimatedCost] = useState('');
    const [resolutionDetails, setResolutionDetails] = useState('');
    const [actualCost, setActualCost] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);

    useEffect(() => {
        const fetchIncident = async () => {
            setIsLoading(true);
            try {
                const data = await maintenanceService.getIncident(parseInt(id!));
                setIncident(data);
            } catch (error) {
                notify("Erreur lors du chargement de l'intervention", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchIncident();
    }, [id, notify]);

    const formatDate = (dateStr: string): string => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(',', '');
    };

    const getStatusInfo = () => {
        if (!incident) return { label: '', class: '', icon: null };
        
        if (incident.status === 'open' && incident.priority === 'emergency') {
            return { 
                label: 'URGENT', 
                class: 'emergency',
                icon: <AlertTriangle size={12} />
            };
        }
        switch (incident.status) {
            case 'open':
                return { 
                    label: 'EN ATTENTE', 
                    class: 'open',
                    icon: <Clock size={12} />
                };
            case 'in_progress':
                return { 
                    label: 'EN COURS', 
                    class: 'in_progress',
                    icon: <Loader size={12} />
                };
            case 'resolved':
                return { 
                    label: 'RÉSOLU', 
                    class: 'resolved',
                    icon: <CheckCircle size={12} />
                };
            case 'cancelled':
                return { 
                    label: 'ANNULÉ', 
                    class: 'cancelled',
                    icon: <XCircle size={12} />
                };
            default:
                return { 
                    label: 'EN ATTENTE', 
                    class: 'open',
                    icon: <Clock size={12} />
                };
        }
    };

    const getPriorityInfo = () => {
        if (!incident) return { label: '', class: '' };
        
        switch (incident.priority) {
            case 'emergency':
                return { label: 'Urgence', class: 'emergency' };
            case 'high':
                return { label: 'Élevée', class: 'high' };
            case 'medium':
                return { label: 'Moyenne', class: 'medium' };
            case 'low':
                return { label: 'Faible', class: 'low' };
            default:
                return { label: incident.priority, class: 'medium' };
        }
    };

    const getCategoryLabel = (category: string): string => {
        const categories: Record<string, string> = {
            'plumbing': 'Plomberie',
            'electricity': 'Électricité',
            'heating': 'Chauffage',
            'other': 'Autre',
        };
        return categories[category] || category;
    };

    const handleStartIncident = async () => {
        try {
            await maintenanceService.update(parseInt(id!), { status: 'in_progress' });
            notify("Intervention démarrée avec succès", "success");
            const data = await maintenanceService.getIncident(parseInt(id!));
            setIncident(data);
        } catch (error) {
            notify("Erreur lors du démarrage de l'intervention", "error");
        }
    };

    const handleAssignProvider = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await maintenanceService.update(parseInt(id!), { 
                assigned_provider: providerName,
                provider_contact: providerContact,
                estimated_cost: parseFloat(estimatedCost) || null
            });
            notify("Prestataire assigné avec succès", "success");
            setShowAssignForm(false);
            const data = await maintenanceService.getIncident(parseInt(id!));
            setIncident(data);
        } catch (error) {
            notify("Erreur lors de l'assignation du prestataire", "error");
        }
    };

    const handleResolveIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await maintenanceService.update(parseInt(id!), { 
                status: 'resolved',
                resolution_details: resolutionDetails,
                actual_cost: parseFloat(actualCost) || null
            });
            notify("Intervention marquée comme résolue", "success");
            setShowResolveForm(false);
            const data = await maintenanceService.getIncident(parseInt(id!));
            setIncident(data);
        } catch (error) {
            notify("Erreur lors de la résolution", "error");
        }
    };

    const handleCancelIncident = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await maintenanceService.update(parseInt(id!), { 
                status: 'cancelled',
                cancellation_reason: cancelReason
            });
            notify("Intervention annulée", "success");
            setShowCancelForm(false);
            const data = await maintenanceService.getIncident(parseInt(id!));
            setIncident(data);
        } catch (error) {
            notify("Erreur lors de l'annulation", "error");
        }
    };

    const handleSendReply = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendingReply(true);
        try {
            await maintenanceService.replyToTenant(parseInt(id!), { message: replyMessage });
            notify("Message envoyé au locataire avec succès", "success");
            setReplyMessage('');
        } catch (error) {
            notify("Erreur lors de l'envoi du message", "error");
        } finally {
            setSendingReply(false);
        }
    };

    const openPhotoModal = (src: string) => {
        setModalImage(src);
        setShowPhotoModal(true);
    };

    const closePhotoModal = () => {
        setShowPhotoModal(false);
    };

    if (isLoading) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                background: '#fff',
                borderRadius: '22px',
                boxShadow: '0 22px 70px rgba(0,0,0,.18)',
                maxWidth: '1800px',
                margin: '2rem auto',
                width: '90%'
            }}>
                Chargement...
            </div>
        );
    }

    if (!incident) {
        return (
            <div style={{ 
                textAlign: 'center', 
                padding: '3rem',
                background: '#fff',
                borderRadius: '22px',
                boxShadow: '0 22px 70px rgba(0,0,0,.18)',
                maxWidth: '1800px',
                margin: '2rem auto',
                width: '90%'
            }}>
                Intervention non trouvée
            </div>
        );
    }

    const statusInfo = getStatusInfo();
    const priorityInfo = getPriorityInfo();

    return (
        <div className="incident-detail-container">
            <style>{`
                .incident-detail-container {
                    min-height: 100vh;
                    background: #ffffff;
                    padding: 2rem;
                    width: 90%;
                    max-width: 1800px;
                    margin: 0 auto;
                }

                .incident-detail-container::before {
                    content: "";
                    position: fixed;
                    inset: 0;
                    background:
                        radial-gradient(900px 520px at 12% -8%, rgba(102,126,234,.16) 0%, rgba(102,126,234,0) 62%),
                        radial-gradient(900px 520px at 92% 8%, rgba(118,75,162,.14) 0%, rgba(118,75,162,0) 64%),
                        radial-gradient(700px 420px at 40% 110%, rgba(16,185,129,.10) 0%, rgba(16,185,129,0) 60%);
                    pointer-events: none;
                    z-index: -2;
                }

                .incident-card {
                    max-width: 1800px;
                    margin: 0 auto;
                    background: rgba(255,255,255,.95);
                    border-radius: 22px;
                    box-shadow: 0 22px 70px rgba(0,0,0,.18);
                    overflow: hidden;
                    border: 1px solid rgba(102,126,234,.18);
                    position: relative;
                    backdrop-filter: blur(10px);
                }

                .incident-body {
                    padding: 2.5rem;
                    position: relative;
                    z-index: 1;
                }

                .back-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #64748b;
                    text-decoration: none;
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 1.5rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .back-button:hover {
                    color: #70AE48;
                    background: rgba(112, 174, 72, 0.05);
                }

                .details-grid {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }

                @media (max-width: 1200px) {
                    .details-grid {
                        grid-template-columns: 1fr;
                    }
                }

                .detail-section {
                    background: rgba(255,255,255,.95);
                    border: 2px solid rgba(102,126,234,.10);
                    border-radius: 16px;
                    padding: 1.5rem;
                }

                .detail-section-title {
                    font-size: 1.1rem;
                    font-weight: 950;
                    color: #0f172a;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 1rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(102,126,234,.08);
                }

                .detail-row:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                    padding-bottom: 0;
                }

                .detail-label {
                    font-weight: 700;
                    color: #64748b;
                    font-size: 0.9rem;
                }

                .detail-value {
                    font-weight: 600;
                    color: #0f172a;
                    text-align: right;
                    max-width: 70%;
                }

                .badge {
                    padding: 0.35rem 0.85rem;
                    border-radius: 9999px;
                    font-size: 0.8rem;
                    font-weight: 850;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                }

                .badge.open { background: rgba(245,158,11,.15); color: #92400e; border: 1px solid rgba(245,158,11,.25); }
                .badge.in_progress { background: rgba(59,130,246,.15); color: #1d4ed8; border: 1px solid rgba(59,130,246,.25); }
                .badge.resolved { background: rgba(34,197,94,.15); color: #166534; border: 1px solid rgba(34,197,94,.25); }
                .badge.cancelled { background: rgba(148,163,184,.15); color: #475569; border: 1px solid rgba(148,163,184,.25); }
                .badge.emergency { background: rgba(239,68,68,.15); color: #991b1b; border: 1px solid rgba(239,68,68,.25); }
                .badge.high { background: rgba(245,158,11,.15); color: #92400e; border: 1px solid rgba(245,158,11,.25); }
                .badge.medium { background: rgba(59,130,246,.15); color: #1d4ed8; border: 1px solid rgba(59,130,246,.25); }
                .badge.low { background: rgba(34,197,94,.15); color: #166534; border: 1px solid rgba(34,197,94,.25); }

                .description-box {
                    white-space: pre-line;
                    color: #0f172a;
                    line-height: 1.6;
                    padding: 1.25rem;
                    background: rgba(249,250,251,0.8);
                    border-radius: 12px;
                    font-size: 0.95rem;
                }

                .slots-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 1.25rem;
                    margin-top: 1rem;
                }

                .slot-item {
                    padding: 1.25rem;
                    background: rgba(249,250,251,0.8);
                    border-radius: 12px;
                    border: 1px solid rgba(102,126,234,.15);
                }

                .photos-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }

                .photo-item {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 2px solid rgba(102,126,234,.15);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .photo-item:hover {
                    transform: translateY(-2px);
                    border-color: #70AE48;
                    box-shadow: 0 10px 25px rgba(112, 174, 72, 0.15);
                }

                .photo-item img {
                    width: 100%;
                    height: 180px;
                    object-fit: cover;
                    display: block;
                }

                .action-section {
                    margin-top: 2.5rem;
                    padding: 1.5rem;
                    background: rgba(255,255,255,.95);
                    border: 2px solid rgba(102,126,234,.10);
                    border-radius: 16px;
                }

                .action-buttons {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    margin-bottom: 1.5rem;
                }

                .button {
                    padding: 0.9rem 1.5rem;
                    border-radius: 14px;
                    font-weight: 950;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-family: inherit;
                    white-space: nowrap;
                }

                .button-primary {
                    background: #70AE48;
                    color: #fff;
                    box-shadow: 0 14px 30px rgba(112, 174, 72, 0.22);
                }

                .button-primary:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 18px 34px rgba(112, 174, 72, 0.28);
                }

                .button-secondary {
                    background: rgba(255,255,255,.95);
                    color: #70AE48;
                    border: 2px solid rgba(112, 174, 72, 0.20);
                }

                .button-secondary:hover {
                    background: rgba(112, 174, 72, 0.06);
                }

                .button-danger {
                    background: rgba(239,68,68,.10);
                    color: #ef4444;
                    border: 2px solid rgba(239,68,68,.20);
                }

                .button-danger:hover {
                    background: rgba(239,68,68,.15);
                }

                .button-success {
                    background: rgba(34,197,94,.10);
                    color: #166534;
                    border: 2px solid rgba(34,197,94,.20);
                }

                .button-success:hover {
                    background: rgba(34,197,94,.15);
                }

                .button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-label {
                    display: block;
                    font-weight: 700;
                    color: #0f172a;
                    font-size: 0.9rem;
                    margin-bottom: 0.5rem;
                }

                .form-input,
                .form-textarea {
                    width: 100%;
                    padding: 0.85rem 1rem;
                    border-radius: 10px;
                    border: 1px solid rgba(102,126,234,.25);
                    background: white;
                    color: #0f172a;
                    font-size: 0.95rem;
                    font-family: inherit;
                    box-sizing: border-box;
                }

                .form-textarea {
                    min-height: 120px;
                    resize: vertical;
                }

                .form-input:focus,
                .form-textarea:focus {
                    outline: none;
                    border-color: #70AE48;
                    box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.15);
                }

                .flex-end {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 1.5rem;
                }

                .reply-section {
                    margin-top: 2.5rem;
                    padding-top: 2rem;
                    border-top: 2px solid rgba(102,126,234,.10);
                }

                .photo-modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.95);
                    z-index: 1000;
                    align-items: center;
                    justify-content: center;
                }

                .photo-modal.active {
                    display: flex;
                }

                .modal-image {
                    max-width: 90vw;
                    max-height: 90vh;
                    border-radius: 12px;
                    object-fit: contain;
                }

                .modal-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: white;
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 24px;
                    transition: all 0.2s ease;
                }

                .modal-close:hover {
                    background: rgba(255,255,255,0.2);
                }

                .empty-state {
                    text-align: center;
                    color: #64748b;
                    padding: 2rem;
                }
            `}</style>

            <div className="incident-card">
                <div className="incident-body">
                    <button className="back-button" onClick={() => navigate('/proprietaire/incidents')}>
                        <ArrowLeft size={16} />
                        Retour à la liste des interventions
                    </button>

                    <div className="details-grid">
                        {/* Informations principales */}
                        <div className="detail-section">
                            <h3 className="detail-section-title">
                                <Info size={18} />
                                Informations de la demande
                            </h3>

                            <div className="detail-row">
                                <span className="detail-label">Titre</span>
                                <span className="detail-value">{incident.title || '—'}</span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">Statut</span>
                                <span className="detail-value">
                                    <span className={`badge ${incident.status === 'open' && incident.priority === 'emergency' ? 'emergency' : incident.status}`}>
                                        {incident.status === 'open' && incident.priority === 'emergency' ? (
                                            <><AlertTriangle size={12} /> Urgent</>
                                        ) : incident.status === 'open' ? (
                                            <><Clock size={12} /> En attente</>
                                        ) : incident.status === 'in_progress' ? (
                                            <><Loader size={12} /> En cours</>
                                        ) : incident.status === 'resolved' ? (
                                            <><CheckCircle size={12} /> Résolu</>
                                        ) : (
                                            <><XCircle size={12} /> Annulé</>
                                        )}
                                    </span>
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">Priorité</span>
                                <span className="detail-value">
                                    <span className={`badge ${priorityInfo.class}`}>
                                        {incident.priority === 'emergency' && <AlertTriangle size={12} />}
                                        {incident.priority === 'high' && <AlertCircle size={12} />}
                                        {incident.priority === 'medium' && <Info size={12} />}
                                        {incident.priority === 'low' && <CheckCircle size={12} />}
                                        {priorityInfo.label}
                                    </span>
                                </span>
                            </div>

                            <div className="detail-row">
                                <span className="detail-label">Catégorie</span>
                                <span className="detail-value">{getCategoryLabel(incident.category)}</span>
                            </div>

                            {incident.assigned_provider && (
                                <div className="detail-row">
                                    <span className="detail-label">Prestataire</span>
                                    <span className="detail-value">{incident.assigned_provider}</span>
                                </div>
                            )}

                            <div className="detail-row">
                                <span className="detail-label">Créée le</span>
                                <span className="detail-value">{formatDate(incident.created_at)}</span>
                            </div>

                            {incident.resolved_at && (
                                <div className="detail-row">
                                    <span className="detail-label">Résolue le</span>
                                    <span className="detail-value">{formatDate(incident.resolved_at)}</span>
                                </div>
                            )}
                        </div>

                        {/* Informations du bien et locataire */}
                        <div className="detail-section">
                            <h3 className="detail-section-title">
                                <Home size={18} />
                                Contexte
                            </h3>

                            <div className="detail-row">
                                <span className="detail-label">Bien</span>
                                <span className="detail-value">
                                    {incident.property?.address || incident.property?.name || 'Bien inconnu'}
                                </span>
                            </div>

                            {incident.property?.city && (
                                <div className="detail-row">
                                    <span className="detail-label">Ville</span>
                                    <span className="detail-value">{incident.property.city}</span>
                                </div>
                            )}

                            <div className="detail-row">
                                <span className="detail-label">Locataire</span>
                                <span className="detail-value">
                                    {incident.tenant ? 
                                        `${incident.tenant.first_name || ''} ${incident.tenant.last_name || ''}`.trim() || 'Locataire' 
                                        : 'Non assigné'}
                                </span>
                            </div>

                            {incident.tenant?.email && (
                                <div className="detail-row">
                                    <span className="detail-label">Email</span>
                                    <span className="detail-value">{incident.tenant.email}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {incident.description && (
                        <div className="detail-section" style={{ marginTop: '2rem' }}>
                            <h3 className="detail-section-title">
                                <FileText size={18} />
                                Description
                            </h3>
                            <div className="description-box">
                                {incident.description}
                            </div>
                        </div>
                    )}

                    {/* Créneaux préférés */}
                    {incident.preferred_slots && incident.preferred_slots.length > 0 && (
                        <div className="detail-section" style={{ marginTop: '2rem' }}>
                            <h3 className="detail-section-title">
                                <Calendar size={18} />
                                Disponibilités du locataire
                            </h3>
                            <div className="slots-grid">
                                {incident.preferred_slots.map((slot: any, index: number) => (
                                    <div key={index} className="slot-item">
                                        <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                                            {slot.date || 'Date non spécifiée'}
                                        </div>
                                        <div style={{ color: '#64748b' }}>
                                            {slot.from || '—'} → {slot.to || '—'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Photos */}
                    {incident.photos && incident.photos.length > 0 && (
                        <div className="detail-section" style={{ marginTop: '2rem' }}>
                            <h3 className="detail-section-title">
                                <Image size={18} />
                                Photos ({incident.photos.length})
                            </h3>
                            <div className="photos-grid">
                                {incident.photos.map((photo: string, index: number) => {
                                    const photoUrl = photo.startsWith('http') 
                                        ? photo 
                                        : `http://localhost:8000/storage/${photo.replace(/^\//, '')}`;
                                    return (
                                        <div key={index} className="photo-item">
                                            <img 
                                                src={photoUrl} 
                                                alt={`Photo ${index + 1}`}
                                                onClick={() => openPhotoModal(photoUrl)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="action-section">
                        <h3 className="detail-section-title">
                            <Settings size={18} />
                            Actions
                        </h3>

                        <div className="action-buttons">
                            {incident.status === 'open' && (
                                <>
                                    <button className="button button-primary" onClick={handleStartIncident}>
                                        <Play size={16} />
                                        Prendre en charge
                                    </button>
                                    <button className="button button-secondary" onClick={() => setShowAssignForm(!showAssignForm)}>
                                        <User size={16} />
                                        Assigner un prestataire
                                    </button>
                                    <button className="button button-danger" onClick={() => setShowCancelForm(!showCancelForm)}>
                                        <XCircle size={16} />
                                        Annuler
                                    </button>
                                </>
                            )}
                            {incident.status === 'in_progress' && (
                                <button className="button button-success" onClick={() => setShowResolveForm(!showResolveForm)}>
                                    <CheckCircle size={16} />
                                    Marquer comme résolu
                                </button>
                            )}
                        </div>

                        {/* Formulaire assignation */}
                        {showAssignForm && (
                            <form onSubmit={handleAssignProvider}>
                                <div className="form-group">
                                    <label className="form-label">Nom du prestataire *</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={providerName}
                                        onChange={(e) => setProviderName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Contact</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={providerContact}
                                        onChange={(e) => setProviderContact(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Coût estimé (FCFA)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={estimatedCost}
                                        onChange={(e) => setEstimatedCost(e.target.value)}
                                    />
                                </div>
                                <div className="flex-end">
                                    <button type="submit" className="button button-primary">
                                        <User size={16} />
                                        Assigner
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Formulaire annulation */}
                        {showCancelForm && (
                            <form onSubmit={handleCancelIncident}>
                                <div className="form-group">
                                    <label className="form-label">Raison de l'annulation *</label>
                                    <textarea 
                                        className="form-textarea" 
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex-end">
                                    <button type="submit" className="button button-danger">
                                        <XCircle size={16} />
                                        Confirmer l'annulation
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Formulaire résolution */}
                        {showResolveForm && (
                            <form onSubmit={handleResolveIncident}>
                                <div className="form-group">
                                    <label className="form-label">Détails de la résolution</label>
                                    <textarea 
                                        className="form-textarea" 
                                        value={resolutionDetails}
                                        onChange={(e) => setResolutionDetails(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Coût final (FCFA)</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={actualCost}
                                        onChange={(e) => setActualCost(e.target.value)}
                                    />
                                </div>
                                <div className="flex-end">
                                    <button type="submit" className="button button-success">
                                        <CheckCircle size={16} />
                                        Marquer comme résolu
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Réponse au locataire */}
                        <div className="reply-section">
                            <h3 className="detail-section-title">
                                <MessageSquare size={18} />
                                Répondre au locataire
                            </h3>
                            <form onSubmit={handleSendReply}>
                                <div className="form-group">
                                    <label className="form-label">Votre message *</label>
                                    <textarea 
                                        className="form-textarea" 
                                        placeholder="Écrivez votre réponse au locataire..."
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        required
                                        disabled={sendingReply}
                                    />
                                </div>
                                <div className="flex-end">
                                    <button 
                                        type="submit" 
                                        className="button button-primary" 
                                        disabled={sendingReply || !replyMessage.trim()}
                                    >
                                        <Send size={16} />
                                        {sendingReply ? 'Envoi...' : 'Envoyer au locataire'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal photos */}
            <div className={`photo-modal ${showPhotoModal ? 'active' : ''}`} onClick={closePhotoModal}>
                <img className="modal-image" src={modalImage} alt="" />
                <button className="modal-close" onClick={closePhotoModal}>
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};

export default IncidentDetail;