import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SignaturePad from 'react-signature-canvas';
import { conditionReportService } from "../../../services/api";

interface Photo {
    id: number;
    url: string;
    original_filename: string;
    condition_status: string;
    condition_status_label: string;
    condition_notes?: string;
}

interface Report {
    id: number;
    type: 'entry' | 'exit' | 'intermediate';
    type_label: string;
    report_date: string;
    report_date_formatted: string;
    notes?: string;
    property?: {
        id: number;
        name: string;
        address: string;
    };
    lease?: {
        id: number;
        tenant?: {
            first_name?: string;
            last_name?: string;
        };
    };
    creator?: {
        name: string;
    };
    created_at: string;
    created_at_formatted: string;
    signed_at?: string;
    signed_at_formatted?: string;
    signed_by_name?: string;
    is_signed: boolean;
    general_condition: string;
    photos: Photo[];
}

interface EtatDesLieuxDetailProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const EtatDesLieuxDetail: React.FC<EtatDesLieuxDetailProps> = ({ notify }) => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const signaturePadRef = useRef<any>(null);
    
    const [report, setReport] = useState<Report | null>(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);
    const [photoCount, setPhotoCount] = useState(0);

    useEffect(() => {
        fetchReport();
    }, [id]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            const data = await conditionReportService.get(id!);
            setReport(data);
        } catch (error) {
            console.error('Erreur chargement:', error);
            notify('Erreur lors du chargement de l\'état des lieux', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        try {
            const blob = await conditionReportService.downloadPdf(id!);
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

    const handleDelete = async () => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet état des lieux ?')) return;
        
        try {
            await conditionReportService.delete(id!);
            notify('État des lieux supprimé avec succès', 'success');
            navigate('/proprietaire/etats-lieux');
        } catch (error) {
            notify('Erreur lors de la suppression', 'error');
        }
    };

    const clearSignature = () => {
        if (signaturePadRef.current) {
            signaturePadRef.current.clear();
        }
    };

    const submitSignature = async () => {
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
            alert('Veuillez signer');
            return;
        }

        setSigning(true);
        try {
            const signatureData = signaturePadRef.current.toDataURL();
            const response = await conditionReportService.sign(id!, signatureData);
            
            if (response.success) {
                alert('Signé avec succès !');
                fetchReport(); // Recharger les données
            } else {
                alert('Erreur: ' + (response.error || 'Inconnue'));
            }
        } catch (error) {
            console.error('Erreur signature:', error);
            alert('Erreur de connexion');
        } finally {
            setSigning(false);
        }
    };

    const handleUploadSigned = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Veuillez sélectionner un fichier PDF');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('Le fichier ne doit pas dépasser 10 Mo');
            return;
        }

        try {
            const response = await conditionReportService.uploadSigned(id!, file);
            if (response.success) {
                alert('Document uploadé avec succès !');
                fetchReport();
            }
        } catch (error) {
            console.error('Erreur upload:', error);
            alert('Erreur lors de l\'upload');
        }
    };

    const addPhotoField = () => {
        const container = document.getElementById('photos-container');
        if (!container) return;

        const newCount = photoCount + 1;
        setPhotoCount(newCount);

        const div = document.createElement('div');
        div.className = 'mb-3 p-3 border rounded';
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <strong>Photo ${newCount}</strong>
                <button type="button" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <input type="file" name="photos[]" class="form-control mb-2" accept="image/*" required>
            <select name="condition_statuses[]" class="form-select mb-2">
                <option value="good">Bon</option>
                <option value="satisfactory">Correct</option>
                <option value="poor">Mauvais</option>
                <option value="damaged">Abîmé</option>
            </select>
            <input type="text" name="condition_notes[]" class="form-control" placeholder="Notes">
        `;
        container.appendChild(div);
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'good': return (
                <svg viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                    <polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
            );
            case 'satisfactory': return (
                <svg viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
                </svg>
            );
            case 'poor': return (
                <svg viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
                </svg>
            );
            case 'damaged': return (
                <svg viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                </svg>
            );
            default: return null;
        }
    };

    const getStatusClass = (status: string) => {
        switch(status) {
            case 'good': return 'success';
            case 'satisfactory': return 'warning';
            case 'poor': return 'warning';
            case 'damaged': return 'danger';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ 
                    width: 40, 
                    height: 40, 
                    border: '3px solid #e5e7eb', 
                    borderTopColor: '#70AE48', 
                    borderRadius: '50%', 
                    margin: '0 auto',
                    animation: 'spin 1s linear infinite'
                }} />
                <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="page-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <svg viewBox="0 0 24 24" style={{ width: 48, height: 48, margin: '0 auto', color: '#ef4444' }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <h3 style={{ marginTop: '1rem' }}>État des lieux non trouvé</h3>
                <button 
                    onClick={() => navigate('/proprietaire/etats-lieux')} 
                    style={{ 
                        marginTop: '1rem', 
                        padding: '0.5rem 1rem', 
                        background: '#70AE48', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '0.5rem', 
                        cursor: 'pointer' 
                    }}
                >
                    Retour
                </button>
            </div>
        );
    }

    return (
        <div className="page-container">
            <style>{`
                :root {
                    --primary: #70AE48;
                    --primary-dark: #5a8f3a;
                    --primary-light: #f0f7eb;
                    --gray-50: #f9fafb;
                    --gray-100: #f3f4f6;
                    --gray-200: #e5e7eb;
                    --gray-300: #d1d5db;
                    --gray-400: #9ca3af;
                    --gray-500: #6b7280;
                    --gray-600: #4b5563;
                    --gray-700: #374151;
                    --gray-800: #1f2937;
                    --gray-900: #111827;
                    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                    --radius-sm: 0.375rem;
                    --radius: 0.5rem;
                    --radius-md: 0.75rem;
                    --radius-lg: 1rem;
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }

                .page-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem 1.5rem;
                }

                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 2.5rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .page-title {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .page-title-icon {
                    width: 3rem;
                    height: 3rem;
                    background: var(--primary-light);
                    border-radius: var(--radius-lg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary);
                }

                .page-title-icon svg {
                    width: 1.5rem;
                    height: 1.5rem;
                    stroke: currentColor;
                    stroke-width: 2;
                    fill: none;
                }

                .page-title h1 {
                    font-size: 2rem;
                    font-weight: 700;
                    color: var(--gray-900);
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .page-title .badge {
                    background: var(--gray-100);
                    color: var(--gray-600);
                    font-size: 0.875rem;
                    font-weight: 600;
                    padding: 0.35rem 1rem;
                    border-radius: 2rem;
                    margin-left: 0.75rem;
                }

                .page-actions {
                    display: flex;
                    gap: 0.75rem;
                }

                .btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.625rem;
                    padding: 0.75rem 1.5rem;
                    border-radius: var(--radius);
                    font-size: 0.95rem;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    cursor: pointer;
                    border: none;
                    line-height: 1;
                    white-space: nowrap;
                }

                .btn svg {
                    width: 1.125rem;
                    height: 1.125rem;
                    stroke: currentColor;
                    stroke-width: 2;
                    fill: none;
                }

                .btn-primary {
                    background: var(--primary);
                    color: white;
                    box-shadow: 0 2px 4px rgba(112, 174, 72, 0.2);
                }

                .btn-primary:hover {
                    background: var(--primary-dark);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(112, 174, 72, 0.3);
                }

                .btn-outline {
                    background: white;
                    border: 1px solid var(--gray-200);
                    color: var(--gray-700);
                }

                .btn-outline:hover {
                    background: var(--gray-50);
                    border-color: var(--gray-300);
                }

                .btn-outline-primary {
                    background: white;
                    border: 1px solid var(--gray-200);
                    color: var(--primary);
                }

                .btn-outline-primary:hover {
                    background: var(--primary-light);
                    border-color: var(--primary);
                }

                .btn-outline-danger {
                    background: white;
                    border: 1px solid var(--gray-200);
                    color: #dc2626;
                }

                .btn-outline-danger:hover {
                    background: #fef2f2;
                    border-color: #fecaca;
                }

                .btn-lg {
                    padding: 0.875rem 2rem;
                    font-size: 1rem;
                }

                .btn-lg svg {
                    width: 1.25rem;
                    height: 1.25rem;
                }

                .btn-block {
                    width: 100%;
                }

                .card {
                    background: white;
                    border-radius: var(--radius-lg);
                    border: 1px solid var(--gray-200);
                    overflow: hidden;
                    margin-bottom: 1.5rem;
                    box-shadow: var(--shadow);
                }

                .card-header {
                    padding: 1.5rem 2rem;
                    border-bottom: 1px solid var(--gray-200);
                    background: white;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .card-header svg {
                    width: 1.25rem;
                    height: 1.25rem;
                    stroke: var(--primary);
                    stroke-width: 2;
                    fill: none;
                }

                .card-header h2 {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--gray-800);
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .card-header .badge {
                    margin-left: auto;
                    background: var(--gray-100);
                    color: var(--gray-600);
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 0.25rem 1rem;
                    border-radius: 2rem;
                }

                .card-body {
                    padding: 2rem;
                }

                .grid-2 {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 1.5rem;
                }

                @media (max-width: 1024px) {
                    .grid-2 {
                        grid-template-columns: 1fr;
                    }
                }

                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 2rem;
                }

                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .info-label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: var(--gray-500);
                    text-transform: uppercase;
                    letter-spacing: 0.025em;
                }

                .info-value {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: var(--gray-900);
                    line-height: 1.4;
                }

                .info-value-lg {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .info-note {
                    margin-top: 1.5rem;
                    padding: 1.25rem;
                    background: var(--gray-50);
                    border-radius: var(--radius);
                    font-size: 1rem;
                    color: var(--gray-700);
                    border-left: 4px solid var(--primary);
                    line-height: 1.6;
                }

                .info-note svg {
                    width: 1.25rem;
                    height: 1.25rem;
                    margin-right: 0.5rem;
                    stroke: var(--primary);
                    vertical-align: middle;
                }

                .status-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 1rem;
                    border-radius: 2rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    line-height: 1;
                }

                .status-badge svg {
                    width: 1rem;
                    height: 1rem;
                    stroke: currentColor;
                    stroke-width: 2.5;
                    fill: none;
                }

                .status-badge.success {
                    background: #ecfdf5;
                    color: #059669;
                }

                .status-badge.warning {
                    background: #fffbeb;
                    color: #d97706;
                }

                .status-badge.entry {
                    background: #ecfdf5;
                    color: #059669;
                }

                .status-badge.exit {
                    background: #fef2f2;
                    color: #dc2626;
                }

                .status-badge.intermediate {
                    background: #eff6ff;
                    color: #2563eb;
                }

                .signature-box {
                    background: var(--primary-light);
                    border-radius: var(--radius-lg);
                    padding: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                    border: 1px solid rgba(112, 174, 72, 0.2);
                }

                .signature-box svg {
                    width: 2rem;
                    height: 2rem;
                    stroke: var(--primary);
                    stroke-width: 2;
                    fill: none;
                }

                .signature-content {
                    flex: 1;
                }

                .signature-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--primary-dark);
                    margin-bottom: 0.25rem;
                }

                .signature-date {
                    font-size: 0.9rem;
                    color: var(--gray-600);
                }

                .signature-pending {
                    background: var(--gray-50);
                    border-radius: var(--radius-lg);
                    padding: 2rem;
                    text-align: center;
                    border: 2px dashed var(--gray-300);
                }

                .signature-pending svg {
                    width: 3rem;
                    height: 3rem;
                    stroke: var(--gray-400);
                    stroke-width: 1.5;
                    margin-bottom: 1rem;
                }

                .signature-pending h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: var(--gray-700);
                    margin-bottom: 0.5rem;
                }

                .signature-pending p {
                    color: var(--gray-500);
                    margin-bottom: 1.5rem;
                    font-size: 1rem;
                }

                .actions-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }

                .actions-list .btn {
                    width: 100%;
                    justify-content: flex-start;
                    padding: 1rem 1.5rem;
                    font-size: 1rem;
                }

                .photo-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 1.5rem;
                }

                .photo-card {
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    transition: all 0.2s ease;
                }

                .photo-card:hover {
                    box-shadow: var(--shadow-md);
                    transform: translateY(-2px);
                }

                .photo-image {
                    height: 220px;
                    background: var(--gray-100);
                    position: relative;
                    overflow: hidden;
                }

                .photo-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .photo-overlay {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(4px);
                    padding: 0.5rem;
                    border-radius: 2rem;
                    box-shadow: var(--shadow);
                }

                .photo-info {
                    padding: 1.25rem;
                }

                .photo-name {
                    font-size: 1rem;
                    font-weight: 600;
                    color: var(--gray-800);
                    margin-bottom: 0.75rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .photo-meta {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .photo-notes {
                    font-size: 0.9rem;
                    color: var(--gray-600);
                    margin-top: 0.75rem;
                    padding-top: 0.75rem;
                    border-top: 1px solid var(--gray-200);
                    line-height: 1.5;
                }

                .photo-notes svg {
                    width: 0.875rem;
                    height: 0.875rem;
                    margin-right: 0.375rem;
                    stroke: var(--primary);
                }

                .empty-gallery {
                    text-align: center;
                    padding: 4rem 2rem;
                    background: var(--gray-50);
                    border-radius: var(--radius-lg);
                }

                .empty-gallery svg {
                    width: 4rem;
                    height: 4rem;
                    stroke: var(--gray-300);
                    stroke-width: 1.5;
                    margin-bottom: 1.5rem;
                }

                .empty-gallery p {
                    color: var(--gray-500);
                    margin-bottom: 1.5rem;
                    font-size: 1.1rem;
                }

                .signature-canvas-container {
                    border: 2px dashed var(--gray-300);
                    border-radius: var(--radius);
                    padding: 1rem;
                    background: white;
                    margin-bottom: 1rem;
                }

                #signature-pad {
                    width: 100%;
                    height: 200px;
                    background: white;
                    border: 1px solid var(--gray-200);
                    border-radius: var(--radius-sm);
                }

                .form-control {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid var(--gray-300);
                    border-radius: var(--radius-sm);
                    font-size: 0.9rem;
                }

                .form-select {
                    width: 100%;
                    padding: 0.5rem 0.75rem;
                    border: 1px solid var(--gray-300);
                    border-radius: var(--radius-sm);
                    font-size: 0.9rem;
                    background: white;
                }

                hr {
                    border: none;
                    border-top: 1px solid var(--gray-200);
                    margin: 1rem 0;
                }

                .divider-text {
                    position: relative;
                    text-align: center;
                    margin: 1.5rem 0;
                }

                .divider-text span {
                    background: white;
                    padding: 0 1rem;
                    color: var(--gray-400);
                    font-size: 0.9rem;
                }

                .divider-text hr {
                    position: absolute;
                    top: 50%;
                    left: 0;
                    right: 0;
                    margin: 0;
                    z-index: -1;
                }

                @media (max-width: 768px) {
                    .page-container {
                        padding: 1rem;
                    }

                    .page-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .page-actions {
                        width: 100%;
                        flex-direction: column;
                    }

                    .page-actions .btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .info-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .photo-grid {
                        grid-template-columns: 1fr;
                    }

                    .signature-box {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="page-header">
                <div className="page-title">
                    <div className="page-title-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                        </svg>
                    </div>
                    <h1>
                        État des lieux
                        <span className="badge">#{report.id.toString().padStart(6, '0')}</span>
                    </h1>
                </div>
                <div className="page-actions">
                    <button onClick={handleDownload} className="btn btn-outline-primary">
                        <svg viewBox="0 0 24 24">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Télécharger PDF
                    </button>
                    <button onClick={() => navigate('/proprietaire/etats-lieux')} className="btn btn-outline">
                        <svg viewBox="0 0 24 24">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Retour
                    </button>
                </div>
            </div>

            {/* Grille principale */}
            <div className="grid-2">
                {/* Colonne gauche : Informations */}
                <div>
                    {/* Carte informations générales */}
                    <div className="card">
                        <div className="card-header">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="16" x2="12" y2="12"/>
                                <line x1="12" y1="8" x2="12.01" y2="8"/>
                            </svg>
                            <h2>Informations générales</h2>
                        </div>
                        <div className="card-body">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Date de l'état des lieux</span>
                                    <span className="info-value">{report.report_date_formatted}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Type</span>
                                    <span className={`status-badge ${report.type}`}>
                                        {report.type === 'entry' && (
                                            <>
                                                <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                                État des lieux d'entrée
                                            </>
                                        )}
                                        {report.type === 'exit' && (
                                            <>
                                                <svg viewBox="0 0 24 24"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                                État des lieux de sortie
                                            </>
                                        )}
                                        {report.type === 'intermediate' && (
                                            <>
                                                <svg viewBox="0 0 24 24">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <line x1="12" y1="8" x2="12" y2="16"/>
                                                    <line x1="8" y1="12" x2="16" y2="12"/>
                                                </svg>
                                                État des lieux intermédiaire
                                            </>
                                        )}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Bien concerné</span>
                                    <span className="info-value">{report.property?.name || 'Non spécifié'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Adresse du bien</span>
                                    <span className="info-value">{report.property?.address || 'Non spécifiée'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Bail associé</span>
                                    <span className="info-value">#{report.lease?.id?.toString().padStart(6, '0') || 'N/A'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Locataire</span>
                                    <span className="info-value">
                                        {report.lease?.tenant?.first_name || ''} {report.lease?.tenant?.last_name || 'Non spécifié'}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Créé par</span>
                                    <span className="info-value">{report.creator?.name || 'Utilisateur'}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Créé le</span>
                                    <span className="info-value">{report.created_at_formatted}</span>
                                </div>
                            </div>

                            {report.notes && (
                                <div className="info-note">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5 5 5-5M12 14V3"/>
                                    </svg>
                                    <strong>Notes :</strong> {report.notes}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Colonne droite : Actions et Signature */}
                <div>
                    {/* Carte signature */}
                    <div className="card">
                        <div className="card-header">
                            <svg viewBox="0 0 24 24">
                                <path d="M2 22L10 14M14 2L22 10M16 8L6 18M18 6L8 16"/>
                            </svg>
                            <h2>Signature</h2>
                            {report.is_signed ? (
                                <span className="badge" style={{ background: '#ecfdf5', color: '#059669' }}>Signé</span>
                            ) : (
                                <span className="badge" style={{ background: '#fffbeb', color: '#d97706' }}>En attente</span>
                            )}
                        </div>
                        <div className="card-body">
                            {report.is_signed ? (
                                /* Déjà signé */
                                <div className="signature-box">
                                    <svg viewBox="0 0 24 24">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                    <div className="signature-content">
                                        <div className="signature-title">Document signé</div>
                                        <div className="signature-date">
                                            Signé par <strong>{report.signed_by_name || 'Co-propriétaire'}</strong><br />
                                            le {report.signed_at_formatted}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* En attente de signature */
                                <div className="signature-pending">
                                    <svg viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="12" y1="8" x2="12" y2="12"/>
                                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                                    </svg>
                                    <h3>État des lieux en attente de signature</h3>
                                    <p>Signez ce document pour finaliser l'état des lieux. Une fois signé, il ne pourra plus être modifié.</p>

                                    <div className="signature-canvas-container">
                                        <SignaturePad
                                            ref={signaturePadRef}
                                            canvasProps={{
                                                id: 'signature-pad',
                                                className: 'signature-pad'
                                            }}
                                        />

                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.8rem' }}>
                                            <button
                                                className="btn btn-outline"
                                                onClick={clearSignature}
                                                style={{ fontSize: '13px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                                disabled={signing}
                                            >
                                                <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                                                    <path d="M18 6L6 18M6 6l12 12"/>
                                                </svg>
                                                Effacer
                                            </button>

                                            <button
                                                className="btn btn-primary"
                                                onClick={submitSignature}
                                                style={{ fontSize: '13px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
                                                disabled={signing}
                                            >
                                                <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                                {signing ? 'Signature...' : 'Signer'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="divider-text">
                                        <hr />
                                        <span>OU</span>
                                    </div>

                                    {/* Upload PDF */}
                          <div>
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        
        <input
            type="file"
            className="form-control"
            accept=".pdf"
            onChange={handleUploadSigned}
            style={{ flex: '0 0 200px', fontSize: '13px', padding: '5px' }}
        />

        <button
            type="button"
            className="btn btn-primary"
            style={{
                fontSize: '13px',
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap' // 🔥 empêche le texte de se couper
            }}
            onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                if (input?.files?.length) {
                    handleUploadSigned({ target: input } as any);
                } else {
                    alert('Veuillez sélectionner un fichier');
                }
            }}
        >
            <svg viewBox="0 0 24 24" style={{ width: '14px', height: '14px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Uploader
        </button>

    </div>

    <p style={{
        fontSize: '0.8rem',
        color: 'var(--gray-500)',
        marginTop: '0.4rem',
        textAlign: 'left'
    }}>
        PDF uniquement (max 10 Mo)
    </p>
</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Carte actions */}
                    <div className="card">
                        <div className="card-header">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="3"/>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82L12 22zM12 2v5"/>
                            </svg>
                            <h2>Actions</h2>
                        </div>
                        <div className="card-body">
                            <div className="actions-list">
                                <button onClick={handleDownload} className="btn btn-outline-primary">
                                    <svg viewBox="0 0 24 24">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Télécharger le PDF
                                </button>

                                {!report.is_signed && (
                                    <button
                                        onClick={handleDelete}
                                        className="btn btn-outline-danger"
                                    >
                                        <svg viewBox="0 0 24 24">
                                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                        </svg>
                                        Supprimer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Galerie photos */}
            <div className="card">
                <div className="card-header">
                    <svg viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <h2>Photos et constats</h2>
                    <span className="badge">{report.photos?.length || 0} photo(s)</span>
                </div>
                <div className="card-body">
                    {!report.photos || report.photos.length === 0 ? (
                        <div className="empty-gallery">
                            <svg viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                            <p>Aucune photo</p>
                            {!report.is_signed && (
                                <button
                                    className="btn btn-primary"
                                    data-bs-toggle="modal"
                                    data-bs-target="#addPhotosModal"
                                    onClick={() => {
                                        const modal = document.getElementById('addPhotosModal');
                                        if (modal) modal.style.display = 'block';
                                    }}
                                >
                                    <svg viewBox="0 0 24 24">
                                        <line x1="12" y1="5" x2="12" y2="19"/>
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    Ajouter des photos
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="photo-grid">
                            {report.photos.map((photo) => (
                                <div key={photo.id} className="photo-card">
                                    <div className="photo-image">
                                        <img src={photo.url} alt={photo.original_filename} />
                                        <div className="photo-overlay">
                                            <span className={`status-badge ${getStatusClass(photo.condition_status)}`}>
                                                {getStatusIcon(photo.condition_status)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="photo-info">
                                        <div className="photo-name">{photo.original_filename}</div>
                                        {photo.condition_notes && (
                                            <div className="photo-notes">
                                                <svg viewBox="0 0 24 24">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 9l5 5 5-5M12 14V3"/>
                                                </svg>
                                                {photo.condition_notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Ajouter Photos (version simplifiée) */}
            {!report.is_signed && (
                <div
                    id="addPhotosModal"
                    style={{
                        display: 'none',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.5)',
                        zIndex: 1000,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            e.currentTarget.style.display = 'none';
                        }
                    }}
                >
                    <div style={{
                        background: 'white',
                        borderRadius: 'var(--radius-lg)',
                        padding: '2rem',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Ajouter des photos</h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                try {
                                    await conditionReportService.create(formData);
                                    alert('Photos ajoutées avec succès');
                                    fetchReport();
                                    document.getElementById('addPhotosModal')!.style.display = 'none';
                                } catch (error) {
                                    alert('Erreur lors de l\'ajout');
                                }
                            }}
                        >
                            <div id="photos-container"></div>
                            <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={addPhotoField}
                                style={{ marginTop: '1rem' }}
                            >
                                <svg viewBox="0 0 24 24">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                Ajouter une photo
                            </button>
                            <hr />
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={() => {
                                        document.getElementById('addPhotosModal')!.style.display = 'none';
                                    }}
                                >
                                    Annuler
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EtatDesLieuxDetail;