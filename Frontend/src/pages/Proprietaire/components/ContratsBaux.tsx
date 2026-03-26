import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Plus, Search, Settings, Loader2, FileText, MapPin, Download,
    ChevronDown, Check, Clock, X, AlertCircle, Upload, PenSquare,
    Eye, FileSignature, UserCheck, Users, PenLine
} from 'lucide-react';
import { leaseService } from '@/services/leaseService';

interface ContratData {
    id: string;
    uuid: string;
    typeBadge: string;
    typeBadgeColor: string;
    titre: string;
    bien: string;
    loyerMensuel: string;
    depotGarantie: string;
    dateDebut: string;
    dateFin: string;
    statut: 'actif' | 'attente' | 'expire' | 'pending_signature';
    creeLe: string;
    startDate: Date;
    endDate: Date | null;
    landlord_signature: any | null;
    tenant_signature: any | null;
    signed_document: string | null;
    lease_number: string;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    'nu': { label: "BAIL D'HABITATION NU", color: '#94a3b8' },
    'meuble': { label: 'BAIL MEUBLE', color: '#94a3b8' }
};

interface ContratsBauxProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

// ─── Modal de signature ───────────────────────────────────────────────────────
interface SignatureModalProps {
    isOpen: boolean;
    contrat: ContratData | null;
    onClose: () => void;
    onConfirm: (signatureDataUrl: string) => Promise<void>;
    isSubmitting: boolean;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, contrat, onClose, onConfirm, isSubmitting }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    // Redimensionner le canvas quand le modal devient visible
    useEffect(() => {
        if (!isOpen) return;
        // Petit délai pour que le DOM soit rendu avant de calculer les dimensions
        const timer = setTimeout(() => {
            resizeCanvas();
        }, 60);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(ratio, ratio);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
        }
        setIsEmpty(true);
    };

    const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        if ('touches' in e) {
            const touch = e.touches[0];
            return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
        }
        return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
    };

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        setIsDrawing(true);
        lastPos.current = getPos(e, canvas);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        lastPos.current = pos;
        setIsEmpty(false);
    };

    const stopDraw = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
        setIsEmpty(true);
    };

    const handleConfirm = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        await onConfirm(canvas.toDataURL('image/png'));
    };

    if (!isOpen || !contrat) return null;

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white', borderRadius: '20px',
                    width: '100%', maxWidth: '540px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                    animation: 'sigSlideUp 0.25s ease-out',
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                <style>{`
                    @keyframes sigSlideUp {
                        from { opacity:0; transform:translateY(20px); }
                        to   { opacity:1; transform:translateY(0); }
                    }
                `}</style>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.4rem 1.75rem', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: 44, height: 44, background: '#f0f7eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#70AE48', flexShrink: 0 }}>
                            <PenLine size={20} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#111827', fontFamily: 'Merriweather, serif' }}>
                                Signer le contrat
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280', fontFamily: 'Merriweather, serif' }}>
                                {contrat.titre}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', borderRadius: 8, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Avertissement */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '1rem 1.75rem', margin: '1.25rem 1.75rem 0', borderRadius: '0 8px 8px 0' }}>
                    <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e', lineHeight: 1.5, fontFamily: 'Merriweather, serif' }}>
                        En signant ce contrat, vous reconnaissez avoir lu et accepté toutes les conditions du bail. Cette action est irréversible.
                    </p>
                </div>

                {/* Label canvas */}
                <div style={{ padding: '1.25rem 1.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Manrope, sans-serif' }}>
                    Dessinez votre signature ci-dessous
                </div>

                {/* Canvas */}
                <div style={{ margin: '0 1.75rem', border: '2px dashed #d1d5db', borderRadius: 12, background: '#fafafa', overflow: 'hidden', cursor: 'crosshair' }}>
                    <canvas
                        ref={canvasRef}
                        style={{ width: '100%', height: 200, display: 'block', background: 'white', touchAction: 'none' }}
                        onMouseDown={startDraw}
                        onMouseMove={draw}
                        onMouseUp={stopDraw}
                        onMouseLeave={stopDraw}
                        onTouchStart={startDraw}
                        onTouchMove={draw}
                        onTouchEnd={stopDraw}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.75rem 1.75rem' }}>
                    <button
                        onClick={clearCanvas}
                        disabled={isSubmitting}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f3f4f6', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Merriweather, serif' }}
                    >
                        <X size={14} /> Effacer
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 10, border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Merriweather, serif' }}
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSubmitting || isEmpty}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.6rem 1.3rem', borderRadius: 10, border: 'none',
                                background: isSubmitting || isEmpty ? '#a3c98a' : '#70AE48',
                                color: 'white', fontSize: '0.875rem', fontWeight: 600,
                                cursor: isSubmitting || isEmpty ? 'not-allowed' : 'pointer',
                                fontFamily: 'Merriweather, serif',
                                boxShadow: '0 2px 8px rgba(112,174,72,0.3)',
                                transition: 'all 0.2s',
                            }}
                        >
                            {isSubmitting
                                ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Signature...</>
                                : <><Check size={14} /> Signer le contrat</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const ContratsBaux: React.FC<ContratsBauxProps> = ({ notify }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [contrats, setContrats] = useState<ContratData[]>([]);
    const [loading, setLoading] = useState(true);
    const [propertyFilter, setPropertyFilter] = useState('all');
    const [properties, setProperties] = useState<{ id: number; name: string }[]>([]);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedContract, setSelectedContract] = useState<ContratData | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── État modal signature ──
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [contractToSign, setContractToSign] = useState<ContratData | null>(null);
    const [isSigningModal, setIsSigningModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }
        fetchLeases();
    }, []);

    const fetchLeases = async () => {
        try {
            setLoading(true);
            const data = await leaseService.listLeases();
            const mapped = (data || []).map((l: any) => {
                const config = TYPE_CONFIG[l.type] || { label: l.type.toUpperCase(), color: '#94a3b8' };
                const firstName = l.tenant?.first_name || '';
                const lastName = l.tenant?.last_name || '';
                const tenantName = (firstName + ' ' + lastName).trim() || 'Sans locataire';
                const startDate = new Date(l.start_date);
                const endDate = l.end_date ? new Date(l.end_date) : null;
                const now = new Date();
                let statut: 'actif' | 'attente' | 'expire' | 'pending_signature' = 'attente';
                if (l.status === 'pending_signature') {
                    statut = 'pending_signature';
                } else if (startDate && endDate) {
                    if (startDate <= now && endDate >= now) statut = 'actif';
                    else if (startDate > now) statut = 'attente';
                    else if (endDate < now) statut = 'expire';
                }
                const formatDate = (date: Date | null) => {
                    if (!date) return 'Non défini';
                    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
                };
                return {
                    id: String(l.id),
                    uuid: l.uuid,
                    lease_number: l.lease_number,
                    typeBadge: config.label,
                    typeBadgeColor: config.color,
                    titre: 'Contrat - ' + tenantName,
                    bien: (l.property?.name || 'Bien sans nom') + ' - ' + (l.property?.address || 'Adresse non spécifiée'),
                    loyerMensuel: new Intl.NumberFormat('fr-FR').format(parseInt(l.rent_amount)) + ' FCFA',
                    depotGarantie: l.deposit
                        ? new Intl.NumberFormat('fr-FR').format(parseInt(l.deposit)) + ' FCFA'
                        : new Intl.NumberFormat('fr-FR').format(parseInt(l.rent_amount * 2)) + ' FCFA',
                    dateDebut: formatDate(startDate),
                    dateFin: formatDate(endDate),
                    statut,
                    creeLe: 'Créé le ' + new Date(l.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
                    startDate,
                    endDate,
                    landlord_signature: l.landlord_signature,
                    tenant_signature: l.tenant_signature,
                    signed_document: l.signed_document,
                };
            });
            setContrats(mapped);
            const propertiesData = await leaseService.getProperties();
            setProperties(propertiesData || []);
        } catch (error: any) {
            console.error('Erreur baux:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
            notify('Erreur lors du chargement des baux', 'error');
        } finally {
            setLoading(false);
        }
    };

    const filtered = contrats.filter(c => {
        const matchesProperty = propertyFilter === 'all'
            ? true
            : c.bien.includes(properties.find(p => p.id.toString() === propertyFilter)?.name || '');
        const matchesSearch =
            c.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.bien.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesProperty && matchesSearch;
    });

    const handleDownload = async (uuid: string) => {
        try {
            setDownloadingId(uuid);
            await leaseService.downloadContract(uuid);
            notify('Téléchargement commencé', 'success');
        } catch {
            notify('Erreur lors du téléchargement', 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    // ── Ouvrir le modal de signature ──
    const openSignatureModal = (contrat: ContratData) => {
        setContractToSign(contrat);
        setShowSignatureModal(true);
    };

    // ── Soumettre la signature depuis le modal ──
    const handleSignatureConfirm = async (signatureDataUrl: string) => {
        if (!contractToSign) return;
        setIsSigningModal(true);
        try {
            await leaseService.signContractElectronic(contractToSign.uuid, signatureDataUrl);
            notify('Signature électronique enregistrée', 'success');
            setShowSignatureModal(false);
            setContractToSign(null);
            fetchLeases();
        } catch {
            notify('Erreur lors de la signature', 'error');
        } finally {
            setIsSigningModal(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
    };

    const handleUploadClick = (contrat: ContratData) => {
        setSelectedContract(contrat);
        setShowUploadModal(true);
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile || !selectedContract) return;
        try {
            setUploadingId(selectedContract.uuid);
            await leaseService.uploadSignedContract(selectedContract.uuid, selectedFile);
            notify('Contrat signé téléchargé avec succès', 'success');
            setShowUploadModal(false);
            setSelectedFile(null);
            setSelectedContract(null);
            fetchLeases();
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch {
            notify('Erreur lors du téléchargement', 'error');
        } finally {
            setUploadingId(null);
        }
    };

    const handleViewSigned = (uuid: string) => {
        const token = localStorage.getItem('token');
        if (!token) { window.location.href = '/login'; return; }
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        const baseUrl = apiUrl.replace('/api', '');
        const url = `${baseUrl}/api/landlord/leases/${uuid}/signed`;
        fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/pdf' } })
            .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                window.open(blobUrl, '_blank');
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
            })
            .catch(() => notify('Erreur lors du chargement du document', 'error'));
    };

    const getSignatureStatus = (contrat: ContratData) => {
        const { landlord_signature, tenant_signature, signed_document } = contrat;
        if (signed_document) return <span className="signature-badge signed"><FileText size={10} /> Signé (fichier)</span>;
        if (landlord_signature && tenant_signature) return <span className="signature-badge signed"><Check size={10} /> Signé électroniquement</span>;
        if (landlord_signature) return <span className="signature-badge"><UserCheck size={10} /> Propriétaire signé</span>;
        if (tenant_signature) return <span className="signature-badge"><Users size={10} /> Locataire signé</span>;
        return null;
    };

    const getStatusBadge = (contrat: ContratData) => {
        const { statut, startDate, endDate } = contrat;
        if (statut === 'pending_signature') {
            const signatureStatus = getSignatureStatus(contrat);
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span className="status-badge status-pending"><Clock size={10} />En attente de signature</span>
                    {signatureStatus && <span className="status-badge" style={{ fontSize: '0.6rem', background: '#f3f4f6', color: '#4b5563' }}>{signatureStatus}</span>}
                </div>
            );
        }
        const now = new Date();
        const hasValidDates = startDate && endDate;
        if (!hasValidDates) return <span className="status-badge status-pending"><AlertCircle size={10} />Dates non définies</span>;
        if (startDate <= now && endDate! >= now) return <span className="status-badge status-active"><Check size={10} />Actif</span>;
        if (startDate > now) return <span className="status-badge status-pending"><Clock size={10} />En attente de début</span>;
        if (endDate! < now) return <span className="status-badge status-expired"><X size={10} />Expiré</span>;
        return <span className="status-badge status-expired"><X size={10} />Statut inconnu</span>;
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&family=Manrope:wght@400;500;600;700;800&display=swap');
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }

                .leases-container { max-width:1400px; margin:0 auto; padding:2rem; background:#f8fafc; min-height:100vh; font-family:'Merriweather',serif; }
                .leases-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.2rem; gap:1.2rem; }
                .header-content h1 { font-size:1.4rem; font-weight:700; color:#1e293b; margin:0 0 0.5rem 0; font-family:'Merriweather',serif; }
                .subtitle { color:#64748b; font-size:0.72rem; line-height:1.3; margin:0; font-family:'Merriweather',serif; }
                .btn-new-lease { display:inline-flex; align-items:center; gap:0.5rem; background:#70AE48; color:white; padding:0.5rem 1rem; border-radius:50px; text-decoration:none; font-weight:600; font-size:0.72rem; border:none; cursor:pointer; transition:all 0.2s ease; white-space:nowrap; font-family:'Merriweather',serif; }
                .btn-new-lease:hover { background:#5a8f3a; transform:translateY(-1px); box-shadow:0 4px 12px rgba(112,174,72,0.3); }
                .filters-section { margin-bottom:2rem; }
                .filters-card { background:white; border:1px solid #e2e8f0; border-radius:12px; padding:0.8rem; box-shadow:0 1px 3px rgba(0,0,0,0.05); }
                .filters-title { font-size:0.875rem; font-weight:700; color:#64748b; letter-spacing:0.05em; margin:0 0 0.5rem 0; text-transform:uppercase; font-family:'Manrope',sans-serif; }
                .filter-row { display:flex; gap:1rem; align-items:center; width:100%; }
                .filter-select-wrapper { position:relative; flex:2; }
                .filter-select { width:100%; padding:0.45rem 0.7rem; padding-right:2.5rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.72rem; color:#000; background:#fff; appearance:none; cursor:pointer; transition:border-color 0.2s; font-family:'Merriweather',serif; }
                .filter-select:focus { outline:none; border-color:#70AE48 !important; box-shadow:0 0 0 3px rgba(112,174,72,0.1); }
                .select-icon { position:absolute; right:1rem; top:50%; transform:translateY(-50%); width:16px; height:16px; color:#6b7280; pointer-events:none; }
                .search-input-wrapper { position:relative; flex:3; }
                .search-icon { position:absolute; left:1rem; top:50%; transform:translateY(-50%); width:16px; height:16px; color:#9ca3af; }
                .search-input { width:100%; padding:0.45rem 0.7rem 0.45rem 2.2rem; border:1px solid #d1d5db; border-radius:8px; font-size:0.72rem; color:#374151; background:#fff; transition:border-color 0.2s; font-family:'Merriweather',serif; }
                .search-input:focus { outline:none; border-color:#70AE48; box-shadow:0 0 0 3px rgba(112,174,72,0.1); }
                .search-input::placeholder { color:#9ca3af; }
                .btn-display { display:inline-flex; align-items:center; gap:0.5rem; padding:0.45rem 0.8rem; border:1px solid #d1d5db; border-radius:8px; background:white; color:#374151; font-size:0.72rem; font-weight:500; cursor:pointer; transition:all 0.2s; white-space:nowrap; flex:1; font-family:'Merriweather',serif; }
                .btn-display:hover { background:#f9fafb; border-color:#9ca3af; }
                .contracts-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(480px,1fr)); gap:0.8rem; }
                .contract-card { background:white; border-radius:12px; border:1px solid #e2e8f0; padding:1.1rem; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:all 0.2s ease; display:flex; flex-direction:column; gap:0.65rem; }
                .contract-card:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.1); }
                .contract-type { font-size:0.58rem; font-weight:700; color:#94a3b8; letter-spacing:0.05em; text-transform:uppercase; font-family:'Manrope',sans-serif; }
                .contract-title { font-size:0.7rem; font-weight:700; color:#1e293b; margin:0; font-family:'Merriweather',serif; }
                .contract-location { display:flex; align-items:center; gap:0.5rem; font-size:0.7rem; color:#64748b; margin-bottom:0.5rem; font-family:'Merriweather',serif; }
                .contract-details { display:grid; grid-template-columns:1fr 1fr; gap:0.4rem; padding:0.4rem 0; border-top:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; }
                .detail-group { display:flex; flex-direction:column; gap:0.1rem; }
                .detail-label { font-size:0.6rem; font-weight:700; color:#94a3b8; letter-spacing:0.05em; font-family:'Manrope',sans-serif; }
                .detail-value { font-size:0.75rem; font-weight:600; color:#1e293b; font-family:'Merriweather',serif; }
                .contract-footer { display:flex; justify-content:space-between; align-items:center; padding-top:0.3rem; }
                .status-badge { display:inline-flex; align-items:center; gap:0.375rem; padding:0.2rem 0.5rem; border-radius:4px; font-size:0.62rem; font-weight:600; font-family:'Manrope',sans-serif; }
                .status-active { background:#dcfce7; color:#166534; }
                .status-pending { background:#fef3c7; color:#92400e; }
                .status-expired { background:#f3f4f6; color:#6b7280; }
                .signature-badge { display:inline-flex; align-items:center; gap:0.2rem; font-size:0.6rem; color:#64748b; font-family:'Manrope',sans-serif; }
                .signature-badge.signed { color:#166534; }
                .contract-actions { display:flex; gap:0.5rem; flex-wrap:wrap; justify-content:flex-end; }
                .action-btn { display:inline-flex; align-items:center; justify-content:center; gap:0.1rem; padding:0.4rem 0.8rem; border-radius:6px; border:none; background:#f3f4f6; color:#374151; cursor:pointer; transition:all 0.2s; text-decoration:none; font-size:0.7rem; font-weight:500; font-family:'Merriweather',serif; }
                .action-btn:hover { background:#e5e7eb; }
                .action-btn:disabled { opacity:0.6; cursor:not-allowed; }
                .btn-download { background:#70AE48; color:white; }
                .btn-download:hover { background:#5a8f3a; color:white; }
                .btn-sign { background:#fef3c7; color:#92400e; }
                .btn-sign:hover { background:#fde68a; }
                .btn-upload { background:#dbeafe; color:#1e40af; }
                .btn-upload:hover { background:#bfdbfe; }
                .btn-view { background:#f3f4f6; color:#4b5563; }
                .btn-view:hover { background:#e5e7eb; }
                .contract-date { font-size:0.62rem; color:#94a3b8; margin-top:0.25rem; font-family:'Merriweather',serif; }
                .signature-info { display:flex; align-items:center; gap:0.1rem; font-size:0.6rem; color:#64748b; font-family:'Manrope',sans-serif; }
                .empty-state { grid-column:1/-1; text-align:center; padding:3rem 2rem; background:white; border-radius:12px; border:2px dashed #e2e8f0; }
                .empty-state h3 { font-size:0.7rem; font-weight:600; color:#374151; margin:1rem 0 0.5rem 0; font-family:'Merriweather',serif; }
                .empty-state p { color:#6b7280; font-size:1.125rem; margin-bottom:1.5rem; font-family:'Merriweather',serif; }
                .loading-state { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; padding:2.5rem 1.5rem; background:white; border-radius:12px; border:1px solid #e2e8f0; }
                .loading-state p { font-size:0.72rem; margin-top:0.6rem; color:#6b7280; font-weight:600; font-family:'Merriweather',serif; }
                .modal-overlay { position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000; }
                .modal-content { background:white; border-radius:12px; padding:1.5rem; max-width:500px; width:90%; max-height:90vh; overflow-y:auto; }
                .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; }
                .modal-header h3 { margin:0; font-size:1.1rem; font-weight:600; font-family:'Merriweather',serif; }
                .modal-close { background:none; border:none; font-size:1.5rem; cursor:pointer; color:#64748b; }
                .modal-body { margin-bottom:1.5rem; }
                .modal-footer { display:flex; justify-content:flex-end; gap:0.5rem; }
                .file-input { width:100%; padding:0.5rem; border:1px solid #d1d5db; border-radius:6px; margin-bottom:1rem; }
                @media (max-width:768px) {
                    .leases-container { padding:0.8rem; }
                    .leases-header { flex-direction:column; align-items:stretch; }
                    .contracts-grid { grid-template-columns:1fr; }
                    .filter-row { flex-direction:column; gap:0.5rem; }
                    .btn-display { width:100%; }
                    .contract-actions { flex-wrap:wrap; }
                }
            `}</style>

            <div className="leases-container">
                <div className="leases-header">
                    <div className="header-content">
                        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>Contrats de bail</h1>
                        <p className="subtitle" style={{ fontSize: '16px', lineHeight: '1.6', color: '#555' }}>
                            Générez automatiquement vos contrats de bail personnalisés en quelques clics.<br />
                            Documents conformes et prêts à signer.
                        </p>
                    </div>
                    <a href="/proprietaire/nouvelle-location" className="btn-new-lease">Contrat de bail</a>
                </div>

                <div className="filters-section">
                    <div className="filters-card">
                        <h3 className="filters-title">FILTRER PAR BIEN</h3>
                        <div className="filter-row">
                            <div className="filter-select-wrapper">
                                <select className="filter-select" value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)}>
                                    <option value="all">Tous les biens</option>
                                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <ChevronDown size={16} className="select-icon" />
                            </div>
                            <div className="search-input-wrapper">
                                <Search size={16} className="search-icon" />
                                <input type="text" className="search-input" placeholder="Rechercher" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <button type="button" className="btn-display">
                                <Settings size={16} /> Affichage
                            </button>
                        </div>
                    </div>
                </div>

                <div className="contracts-grid">
                    {loading ? (
                        <div className="loading-state">
                            <Loader2 size={28} className="animate-spin" color="#70AE48" />
                            <p>Chargement des contrats...</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        filtered.map(c => (
                            <div className="contract-card" key={c.id}>
                                <div className="contract-type" style={{ color: c.typeBadgeColor }}>{c.typeBadge}</div>
                                <h3 className="contract-title">{c.titre}</h3>
                                <div className="contract-location">
                                    <MapPin size={16} color="#e74c3c" />
                                    <span>{c.bien}</span>
                                </div>
                                <div className="contract-details">
                                    <div className="detail-group">
                                        <div className="detail-label">LOYER MENSUEL</div>
                                        <div className="detail-value">{c.loyerMensuel}</div>
                                    </div>
                                    <div className="detail-group">
                                        <div className="detail-label">DÉPÔT DE GARANTIE</div>
                                        <div className="detail-value">{c.depotGarantie}</div>
                                    </div>
                                    <div className="detail-group">
                                        <div className="detail-label">DATE DE DÉBUT</div>
                                        <div className="detail-value">{c.dateDebut}</div>
                                    </div>
                                    <div className="detail-group">
                                        <div className="detail-label">DATE DE FIN</div>
                                        <div className="detail-value">{c.dateFin}</div>
                                    </div>
                                </div>
                                <div className="contract-footer">
                                    <div>{getStatusBadge(c)}</div>
                                    <div className="contract-actions">
                                        <button onClick={() => handleDownload(c.uuid)} disabled={downloadingId === c.uuid} className="action-btn btn-download">
                                            {downloadingId === c.uuid ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                            <span>PDF</span>
                                        </button>
                                        {c.statut === 'pending_signature' && (
                                            <>
                                                {!c.landlord_signature && (
                                                    // ✅ Ouvre le modal de signature au lieu d'appeler l'API directement
                                                    <button onClick={() => openSignatureModal(c)} className="action-btn btn-sign">
                                                        <PenSquare size={14} />
                                                        <span>Signer</span>
                                                    </button>
                                                )}
                                                <button onClick={() => handleUploadClick(c)} disabled={uploadingId === c.uuid} className="action-btn btn-upload">
                                                    {uploadingId === c.uuid ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                                                    <span>Upload</span>
                                                </button>
                                            </>
                                        )}
                                        {c.signed_document && (
                                            <button onClick={() => handleViewSigned(c.uuid)} className="action-btn btn-view">
                                                <Eye size={14} /> <span>Voir</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="contract-date">{c.creeLe}</div>
                                {c.statut === 'pending_signature' && getSignatureStatus(c) && (
                                    <div className="signature-info">
                                        <FileSignature size={12} />
                                        {getSignatureStatus(c)}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <FileText size={64} color="#cbd5e1" />
                            <h3>Aucun contrat de bail</h3>
                            <p>Vous n'avez pas encore créé de contrat de bail.</p>
                            <a href="/proprietaire/nouvelle-location" className="btn-new-lease" style={{ display: 'inline-flex', margin: '0 auto' }}>
                                <Plus size={18} /> Créer un contrat
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Modal signature électronique ── */}
            <SignatureModal
                isOpen={showSignatureModal}
                contrat={contractToSign}
                onClose={() => { setShowSignatureModal(false); setContractToSign(null); }}
                onConfirm={handleSignatureConfirm}
                isSubmitting={isSigningModal}
            />

            {/* ── Modal upload (inchangé) ── */}
            {showUploadModal && selectedContract && (
                <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Uploader un contrat signé</h3>
                            <button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>Contrat : <strong>{selectedContract.titre}</strong></p>
                            <p style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#666' }}>Sélectionnez le fichier PDF signé :</p>
                            <input type="file" ref={fileInputRef} className="file-input" accept=".pdf" onChange={handleFileChange} />
                            {selectedFile && <p style={{ fontSize: '0.75rem', color: '#70AE48' }}>Fichier sélectionné : {selectedFile.name}</p>}
                        </div>
                        <div className="modal-footer">
                            <button className="action-btn" onClick={() => setShowUploadModal(false)} style={{ padding: '0.5rem 1rem' }}>Annuler</button>
                            <button className="action-btn btn-upload" onClick={handleUploadSubmit} disabled={!selectedFile || uploadingId === selectedContract.uuid} style={{ padding: '0.5rem 1rem' }}>
                                {uploadingId === selectedContract.uuid ? <><Loader2 size={14} className="animate-spin" /> Upload...</> : 'Uploader'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ContratsBaux;