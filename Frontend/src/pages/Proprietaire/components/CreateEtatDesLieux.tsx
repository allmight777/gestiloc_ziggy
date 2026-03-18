import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Camera, Home, User, Calendar, FileText, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { conditionReportService } from "../../../services/api";

interface Property {
    id: number;
    name: string;
    address: string;
}

interface Lease {
    id: number;
    tenant: {
        first_name: string;
        last_name: string;
    };
}

interface PhotoField {
    id: string;
    file: File | null;
    preview?: string;
    status: string;
    notes: string;
}

interface CreateEtatDesLieuxProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const CreateEtatDesLieux: React.FC<CreateEtatDesLieuxProps> = ({ notify }) => {
    const navigate = useNavigate();
    const [properties, setProperties] = useState<Property[]>([]);
    const [leases, setLeases] = useState<Lease[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    
    const [formData, setFormData] = useState({
        property_id: '',
        lease_id: '',
        type: 'entry',
        report_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const [photos, setPhotos] = useState<PhotoField[]>([
        { id: crypto.randomUUID(), file: null, preview: undefined, status: 'good', notes: '' }
    ]);

    // DÉBOGAGE : Vérifier ce qui est importé
    useEffect(() => {
        console.log('========== DÉBOGAGE SERVICE ==========');
        console.log('Service importé:', conditionReportService);
        console.log('Type du service:', typeof conditionReportService);
        console.log('Méthodes disponibles:', Object.keys(conditionReportService || {}));
        console.log('getProperties existe?', typeof conditionReportService?.getProperties);
        console.log('======================================');
    }, []);

    // Charger les propriétés
    useEffect(() => {
        const fetchProperties = async () => {
            console.log('🔄 fetchProperties - Début du chargement');
            console.log('Service disponible?', !!conditionReportService);
            console.log('getProperties disponible?', typeof conditionReportService?.getProperties);
            
            try {
                setLoading(true);
                console.log('📡 Appel API getProperties...');
                
                // Vérification supplémentaire
                if (!conditionReportService) {
                    throw new Error('conditionReportService est undefined');
                }
                
                if (typeof conditionReportService.getProperties !== 'function') {
                    console.error('getProperties n\'est pas une fonction. Contenu du service:', conditionReportService);
                    throw new Error('La méthode getProperties n\'existe pas dans le service');
                }
                
                const data = await conditionReportService.getProperties();
                console.log('✅ Réponse API reçue:', data);
                console.log('Type de données:', Array.isArray(data) ? 'Array' : typeof data);
                
                setProperties(Array.isArray(data) ? data : data?.data || []);
            } catch (error) {
                console.error('❌ Erreur détaillée dans fetchProperties:', error);
                console.error('Message:', error instanceof Error ? error.message : 'Erreur inconnue');
                console.error('Stack:', error instanceof Error ? error.stack : 'Non disponible');
                
                // Afficher plus de détails sur l'erreur
                if (error instanceof Error) {
                    notify(`Erreur: ${error.message}`, 'error');
                } else {
                    notify('Erreur lors du chargement des biens', 'error');
                }
                
                // Données de test pour le développement
                console.log('📋 Utilisation de données de test');
                setProperties([
                    { id: 1, name: 'Appartement Test', address: '123 Rue de Test' },
                    { id: 2, name: 'Maison Test', address: '456 Avenue Test' }
                ]);
            } finally {
                setLoading(false);
                console.log('🏁 fetchProperties - Terminé');
            }
        };
        
        fetchProperties();
    }, [notify]);

    // Charger les baux quand une propriété est sélectionnée
    useEffect(() => {
        const fetchLeases = async () => {
            console.log(`🔄 fetchLeases - Propriété sélectionnée: ${formData.property_id}`);
            
            if (!formData.property_id) {
                console.log('⏭️ Aucune propriété sélectionnée, reset des baux');
                setLeases([]);
                return;
            }
            
            try {
                setLoading(true);
                console.log(`📡 Appel API getLeasesForProperty pour property_id: ${formData.property_id}`);
                
                // Vérification supplémentaire
                if (!conditionReportService) {
                    throw new Error('conditionReportService est undefined');
                }
                
                if (typeof conditionReportService.getLeasesForProperty !== 'function') {
                    console.error('getLeasesForProperty n\'est pas une fonction. Contenu du service:', conditionReportService);
                    throw new Error('La méthode getLeasesForProperty n\'existe pas dans le service');
                }
                
                const response = await conditionReportService.getLeasesForProperty(formData.property_id);
                console.log('✅ Réponse API baux reçue:', response);
                
                setLeases(Array.isArray(response) ? response : response?.data || []);
            } catch (error) {
                console.error('❌ Erreur détaillée dans fetchLeases:', error);
                console.error('Message:', error instanceof Error ? error.message : 'Erreur inconnue');
                console.error('Stack:', error instanceof Error ? error.stack : 'Non disponible');
                
                notify('Erreur lors du chargement des baux', 'error');
                
                // Données de test pour le développement
                console.log('📋 Utilisation de données de test pour les baux');
                setLeases([
                    { 
                        id: 1, 
                        tenant: { first_name: 'Jean', last_name: 'Dupont' } 
                    },
                    { 
                        id: 2, 
                        tenant: { first_name: 'Marie', last_name: 'Martin' } 
                    }
                ]);
            } finally {
                setLoading(false);
                console.log('🏁 fetchLeases - Terminé');
            }
        };
        
        fetchLeases();
    }, [formData.property_id, notify]);

    const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        console.log('🏠 Propriété sélectionnée:', e.target.value);
        setFormData({ ...formData, property_id: e.target.value, lease_id: '' });
    };

    const addPhotoField = () => {
        console.log('📸 Ajout d\'un champ photo');
        setPhotos([...photos, { 
            id: crypto.randomUUID(), 
            file: null, 
            preview: undefined, 
            status: 'good', 
            notes: '' 
        }]);
    };

    const removePhotoField = (id: string) => {
        console.log('🗑️ Suppression photo:', id);
        if (photos.length > 1) {
            setPhotos(photos.filter(p => p.id !== id));
        } else {
            notify('📸 Au moins une photo est requise pour l\'état des lieux', 'error');
        }
    };

    const handleFileChange = (id: string, file: File | null) => {
        console.log('📁 Fichier sélectionné:', file?.name);
        if (file) {
            const preview = URL.createObjectURL(file);
            setPhotos(photos.map(p => 
                p.id === id ? { ...p, file, preview } : p
            ));
        }
    };

    const updatePhotoStatus = (id: string, status: string) => {
        console.log('🔄 Statut photo mis à jour:', status);
        setPhotos(photos.map(p => p.id === id ? { ...p, status } : p));
    };

    const updatePhotoNotes = (id: string, notes: string) => {
        console.log('📝 Notes photo mises à jour:', notes);
        setPhotos(photos.map(p => p.id === id ? { ...p, notes } : p));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 Soumission du formulaire');
        setErrors([]);

        // Validations
        if (!formData.property_id) {
            console.error('❌ Validation échouée: propriété manquante');
            setErrors(['Veuillez sélectionner un bien']);
            notify('Veuillez sélectionner un bien', 'error');
            return;
        }
        if (!formData.lease_id) {
            console.error('❌ Validation échouée: bail manquant');
            setErrors(['Veuillez sélectionner un bail']);
            notify('Veuillez sélectionner un bail', 'error');
            return;
        }
        
        const hasPhotos = photos.some(p => p.file !== null);
        if (!hasPhotos) {
            console.error('❌ Validation échouée: aucune photo');
            setErrors(['Ajoutez au moins une photo']);
            notify('Ajoutez au moins une photo', 'error');
            return;
        }

        setSubmitting(true);

        try {
            console.log('📦 Préparation des données FormData');
            const formDataToSend = new FormData();
            formDataToSend.append('property_id', formData.property_id);
            formDataToSend.append('lease_id', formData.lease_id);
            formDataToSend.append('type', formData.type);
            formDataToSend.append('report_date', formData.report_date);
            if (formData.notes) formDataToSend.append('notes', formData.notes);

            photos.forEach((photo, index) => {
                if (photo.file) {
                    console.log(`📸 Ajout photo ${index + 1}:`, photo.file.name);
                    formDataToSend.append(`photos[${index}]`, photo.file);
                    formDataToSend.append(`condition_statuses[${index}]`, photo.status);
                    if (photo.notes) {
                        formDataToSend.append(`condition_notes[${index}]`, photo.notes);
                    }
                }
            });

            console.log('📡 Envoi de la requête create...');
            const response = await conditionReportService.create(formDataToSend);
            console.log('✅ Réponse reçue:', response);
            
            if (response.success) {
                notify('État des lieux créé avec succès', 'success');
                navigate('/proprietaire/etats-lieux');
            } else {
                throw new Error(response.message || 'Erreur lors de la création');
            }
            
        } catch (error) {
            console.error('❌ Erreur lors de la création:', error);
            console.error('Détails:', error instanceof Error ? error.message : 'Erreur inconnue');
            console.error('Stack:', error instanceof Error ? error.stack : 'Non disponible');
            
            setErrors(['Erreur lors de la création']);
            notify('Erreur lors de la création', 'error');
        } finally {
            setSubmitting(false);
            console.log('🏁 Soumission terminée');
        }
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'good': return <CheckCircle size={14} color="#10b981" />;
            case 'satisfactory': return <Clock size={14} color="#f59e0b" />;
            case 'poor': return <AlertCircle size={14} color="#f97316" />;
            case 'damaged': return <XCircle size={14} color="#ef4444" />;
            default: return null;
        }
    };

    return (
        <div className="create-container">
            <style>{`
                /* Variables et reset */
                .create-container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                /* Header avec gradient */
                .create-header {
                    background: #70AE48;
                    border-radius: 24px;
                    padding: 2rem 2.5rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 20px 25px -5px rgba(112, 174, 72, 0.2);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .header-icon {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(8px);
                    padding: 1rem;
                    border-radius: 18px;
                }

                .header-icon svg {
                    width: 32px;
                    height: 32px;
                    color: white;
                }

                .header-title h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 0.5rem 0;
                    letter-spacing: -0.01em;
                }

                .header-title p {
                    color: rgba(255, 255, 255, 0.9);
                    margin: 0;
                    font-size: 0.95rem;
                }

                .btn-back {
                    background: rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(8px);
                    padding: 0.875rem 1.75rem;
                    border-radius: 14px;
                    color: white;
                    text-decoration: none;
                    font-size: 0.95rem;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }

                .btn-back:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateY(-2px);
                }

                .btn-back svg {
                    width: 18px;
                    height: 18px;
                }

                /* Formulaire */
                .form-card {
                    background: white;
                    border-radius: 24px;
                    box-shadow: 0 20px 35px -10px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e5e7eb;
                    overflow: hidden;
                }

                .form-section {
                    padding: 2rem 2.5rem;
                    border-bottom: 1px solid #f3f4f6;
                }

                .form-section:last-child {
                    border-bottom: none;
                }

                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .section-icon {
                    background: #70AE48;
                    padding: 0.75rem;
                    border-radius: 12px;
                    box-shadow: 0 8px 15px -3px rgba(112, 174, 72, 0.2);
                }

                .section-icon svg {
                    width: 20px;
                    height: 20px;
                    color: white;
                }

                .section-header h2 {
                    font-size: 1.35rem;
                    font-weight: 600;
                    color: #111827;
                    margin: 0;
                }

                .section-header p {
                    margin: 0.25rem 0 0 0;
                    color: #6b7280;
                    font-size: 0.9rem;
                }

                /* Grid */
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.5rem;
                }

                .form-grid-3 {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                    margin-top: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-label {
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .form-label svg {
                    width: 16px;
                    height: 16px;
                    color: #70AE48;
                }

                .required-star {
                    color: #ef4444;
                    margin-left: 0.25rem;
                }

                .form-select, .form-input, .form-textarea {
                    width: 100%;
                    padding: 0.875rem 1rem;
                    background: #f9fafb;
                    border: 2px solid #e5e7eb;
                    border-radius: 14px;
                    font-size: 0.95rem;
                    color: #1f2937;
                    transition: all 0.2s;
                    font-family: inherit;
                }

                .form-select:hover, .form-input:hover, .form-textarea:hover {
                    background: white;
                    border-color: #d1d5db;
                }

                .form-select:focus, .form-input:focus, .form-textarea:focus {
                    outline: none;
                    background: white;
                    border-color: #70AE48;
                    box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
                }

                .form-select:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    background: #f3f4f6;
                }

                .form-textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                /* Section photos */
                .photos-section {
                    background: linear-gradient(to bottom right, #f9fafb, white);
                }

                .info-banner {
                    background: #f0f9f0;
                    border-left: 4px solid #70AE48;
                    border-radius: 14px;
                    padding: 1rem 1.5rem;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }

                .info-banner svg {
                    width: 20px;
                    height: 20px;
                    color: #70AE48;
                    flex-shrink: 0;
                    margin-top: 0.125rem;
                }

                .info-banner p {
                    margin: 0;
                    color: #2d6a4f;
                    font-size: 0.95rem;
                    line-height: 1.5;
                }

                .info-banner strong {
                    display: block;
                    margin-top: 0.5rem;
                    color: #1e3a8a;
                }

                /* Photo card */
                .photo-card {
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 1rem;
                    transition: all 0.2s;
                }

                .photo-card:hover {
                    border-color: #70AE48;
                    box-shadow: 0 8px 15px -3px rgba(112, 174, 72, 0.1);
                }

                .photo-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1.25rem;
                }

                .photo-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .photo-icon {
                    background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%);
                    padding: 0.5rem;
                    border-radius: 10px;
                }

                .photo-icon svg {
                    width: 16px;
                    height: 16px;
                    color: white;
                }

                .photo-title h6 {
                    margin: 0;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #111827;
                }

                .btn-remove {
                    background: none;
                    border: none;
                    color: #9ca3af;
                    padding: 0.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-remove:hover {
                    background: #fef2f2;
                    color: #ef4444;
                }

                .btn-remove svg {
                    width: 18px;
                    height: 18px;
                }

                .photo-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }

                /* File input */
                .file-input-wrapper {
                    position: relative;
                }

                .file-input {
                    width: 100%;
                    padding: 0.625rem;
                    background: #f9fafb;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    color: #1f2937;
                }

                .file-input::file-selector-button {
                    margin-right: 1rem;
                    padding: 0.5rem 1rem;
                    background: #f0f9f0;
                    border: none;
                    border-radius: 8px;
                    color: #70AE48;
                    font-size: 0.85rem;
                    font-weight: 500;
                    transition: all 0.2s;
                }

                .file-input::file-selector-button:hover {
                    background: #e0f0e0;
                }

                /* Statut select */
                .status-select {
                    width: 100%;
                    padding: 0.625rem 1rem;
                    background: #f9fafb;
                    border: 2px solid #e5e7eb;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    color: #1f2937;
                }

                /* Add photo button */
                .btn-add-photo {
                    margin-top: 1.5rem;
                    padding: 1rem 2rem;
                    background: #70AE48;
                    border: none;
                    border-radius: 14px;
                    color: white;
                    font-size: 0.95rem;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 8px 15px -3px rgba(112, 174, 72, 0.3);
                }

                .btn-add-photo:hover {
                    background: #5a8f3a;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 20px -5px rgba(112, 174, 72, 0.4);
                }

                .btn-add-photo svg {
                    width: 18px;
                    height: 18px;
                }

                /* Footer */
                .form-footer {
                    padding: 1.5rem 2.5rem;
                    background: #f9fafb;
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }

                .btn-cancel {
                    padding: 0.875rem 2rem;
                    background: white;
                    border: 2px solid #e5e7eb;
                    border-radius: 14px;
                    color: #4b5563;
                    font-size: 0.95rem;
                    font-weight: 500;
                    text-decoration: none;
                    transition: all 0.2s;
                }

                .btn-cancel:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }

                .btn-submit {
                    padding: 0.875rem 2.5rem;
                    background: #70AE48;
                    border: none;
                    border-radius: 14px;
                    color: white;
                    font-size: 0.95rem;
                    font-weight: 500;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 8px 15px -3px rgba(112, 174, 72, 0.3);
                }

                .btn-submit:hover {
                    background: #5a8f3a;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 20px -5px rgba(112, 174, 72, 0.4);
                }

                .btn-submit svg {
                    width: 18px;
                    height: 18px;
                }

                /* Alert messages */
                .alert {
                    padding: 1rem 1.5rem;
                    border-radius: 14px;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .alert-success {
                    background: #d1fae5;
                    border: 1px solid #10b981;
                    color: #065f46;
                }

                .alert-error {
                    background: #fee2e2;
                    border: 1px solid #ef4444;
                    color: #b91c1c;
                }

                .alert svg {
                    width: 20px;
                    height: 20px;
                    flex-shrink: 0;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .create-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                        padding: 1.5rem;
                    }

                    .form-grid, .form-grid-3, .photo-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-section {
                        padding: 1.5rem;
                    }

                    .form-footer {
                        flex-direction: column;
                    }

                    .btn-cancel, .btn-submit {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>

        

            {/* Messages d'erreur */}
            {errors.length > 0 && (
                <div className="alert alert-error">
                    <AlertCircle size={20} />
                    <div>
                        <strong>Erreurs de validation</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '1rem' }}>
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Formulaire */}
            <div className="form-card">
                <form onSubmit={handleSubmit} encType="multipart/form-data">
                    {/* Section informations générales */}
                    <div className="form-section">
                        <div className="section-header">
                            <div className="section-icon">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h2>Informations générales</h2>
                                <p>Sélectionnez le bien et le bail associé</p>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label className="form-label">
                                    <Home size={16} />
                                    Bien <span className="required-star">*</span>
                                </label>
                                <select 
                                    name="property_id" 
                                    id="property_id" 
                                    className="form-select" 
                                    value={formData.property_id}
                                    onChange={handlePropertyChange}
                                    required
                                >
                                    <option value="">Sélectionner un bien</option>
                                    {properties.map(property => (
                                        <option key={property.id} value={property.id}>
                                            {property.name} - {property.address}
                                        </option>
                                    ))}
                                </select>
                                {properties.length === 0 && !loading && (
                                    <small style={{ color: '#ef4444' }}>Aucun bien chargé</small>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <FileText size={16} />
                                    Bail associé <span className="required-star">*</span>
                                </label>
                                <select 
                                    name="lease_id" 
                                    id="lease_id" 
                                    className="form-select" 
                                    value={formData.lease_id}
                                    onChange={(e) => setFormData({ ...formData, lease_id: e.target.value })}
                                    disabled={!formData.property_id || loading}
                                    required
                                >
                                    <option value="">
                                        {loading ? 'Chargement des baux...' : !formData.property_id ? 'Sélectionnez d\'abord un bien' : 'Aucun bail disponible'}
                                    </option>
                                    {leases.map(lease => (
                                        <option key={lease.id} value={lease.id}>
                                            📄 Bail #{lease.id} - {lease.tenant?.first_name} {lease.tenant?.last_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-grid-3">
                            <div className="form-group">
                                <label className="form-label">
                                    <FileText size={16} />
                                    Type <span className="required-star">*</span>
                                </label>
                                <select 
                                    name="type" 
                                    className="form-select" 
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    required
                                >
                                    <option value="entry">🏠 État des lieux d'entrée</option>
                                    <option value="exit">🚪 État des lieux de sortie</option>
                                    <option value="intermediate">📋 État des lieux intermédiaire</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <Calendar size={16} />
                                    Date <span className="required-star">*</span>
                                </label>
                                <input 
                                    type="date" 
                                    name="report_date" 
                                    className="form-input" 
                                    value={formData.report_date}
                                    onChange={(e) => setFormData({ ...formData, report_date: e.target.value })}
                                    required 
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <FileText size={16} />
                                    Notes générales
                                </label>
                                <textarea 
                                    name="notes" 
                                    className="form-textarea" 
                                    rows={2} 
                                    placeholder="Observations générales..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Section photos */}
                    <div className="form-section photos-section">
                        <div className="section-header">
                            <div className="section-icon" style={{ background: 'linear-gradient(135deg, #70AE48 0%, #5a8f3a 100%)' }}>
                                <Camera size={20} />
                            </div>
                            <div>
                                <h2>Photos et constats</h2>
                                <p>Ajoutez au moins une photo pour documenter l'état</p>
                            </div>
                        </div>

                        <div className="info-banner">
                            <AlertCircle size={20} />
                            <p>
                                Pour chaque photo, indiquez son statut et des notes si nécessaire.
                                <strong>📸 Une première photo est déjà ajoutée</strong>
                            </p>
                        </div>

                        <div id="photos-container">
                            {photos.map((photo, index) => (
                                <div key={photo.id} className="photo-card">
                                    <div className="photo-header">
                                        <div className="photo-title">
                                            <div className="photo-icon">
                                                <Camera size={16} />
                                            </div>
                                            <h6>Photo {index + 1}</h6>
                                        </div>
                                        <button 
                                            type="button" 
                                            className="btn-remove" 
                                            onClick={() => removePhotoField(photo.id)}
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {photo.preview && (
                                        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                                            <img 
                                                src={photo.preview} 
                                                alt="Prévisualisation" 
                                                style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '8px' }} 
                                            />
                                        </div>
                                    )}

                                    <div className="photo-grid">
                                        <div className="file-input-wrapper">
                                            <input 
                                                type="file" 
                                                className="file-input" 
                                                accept="image/*" 
                                                onChange={(e) => handleFileChange(photo.id, e.target.files?.[0] || null)}
                                                required={!photo.file}
                                            />
                                        </div>
                                        <div>
                                            <select 
                                                className="status-select"
                                                value={photo.status}
                                                onChange={(e) => updatePhotoStatus(photo.id, e.target.value)}
                                            >
                                                <option value="good">✅ Bon</option>
                                                <option value="satisfactory">📊 Correct</option>
                                                <option value="poor">⚠️ Mauvais</option>
                                                <option value="damaged">❌ Abîmé</option>
                                            </select>
                                        </div>
                                        <div>
                                            <input 
                                                type="text" 
                                                className="form-input" 
                                                placeholder="ex: fissure mur salon"
                                                value={photo.notes}
                                                onChange={(e) => updatePhotoNotes(photo.id, e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {photo.file && (
                                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {getStatusIcon(photo.status)}
                                            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                {photo.file.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button 
                            type="button" 
                            className="btn-add-photo" 
                            onClick={addPhotoField}
                        >
                            <Plus size={18} />
                            Ajouter une photo
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="form-footer">
                        <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={() => navigate('/proprietaire/etats-lieux')}
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit" 
                            className="btn-submit" 
                            disabled={submitting}
                        >
                            <CheckCircle size={18} />
                            {submitting ? 'Enregistrement...' : 'Enregistrer l\'état des lieux'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEtatDesLieux;