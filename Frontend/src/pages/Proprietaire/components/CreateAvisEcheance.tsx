import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Mail, Info, Building, Loader2, CheckCircle, DollarSign } from 'lucide-react';
import { rentDueNoticeService } from '@/services/api';

interface CreateAvisEcheanceProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Lease {
    id: number;
    rent_amount: number;
    charges_amount: number;
    property: {
        id: number;
        name: string;
        address: string;
        city: string;
    };
    tenant: {
        id: number;
        first_name: string;
        last_name: string;
        user?: {
            email: string;
            name: string;
        };
    };
}

const CreateAvisEcheance: React.FC<CreateAvisEcheanceProps> = ({ notify }) => {
    const navigate = useNavigate();
    const [leases, setLeases] = useState<Lease[]>([]);
    const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
    const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
    const [noticeType, setNoticeType] = useState<string>('rent');
    const [periodStart, setPeriodStart] = useState<string>('');
    const [periodEnd, setPeriodEnd] = useState<string>('');
    const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState<string>('Virement bancaire');
    const [notes, setNotes] = useState<string>('');
    const [sendEmail, setSendEmail] = useState<boolean>(true);
    const [amountVisible, setAmountVisible] = useState<string>('');
    const [amountHidden, setAmountHidden] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [loadingLeases, setLoadingLeases] = useState<boolean>(true);
    const [errors, setErrors] = useState<string[]>([]);
    const [showAmountField, setShowAmountField] = useState<boolean>(false);

    useEffect(() => {
        const fetchLeases = async () => {
            try {
                setLoadingLeases(true);
                const response = await rentDueNoticeService.getLeasesForForm();
                setLeases(response || []);
            } catch (error) {
                console.error('Erreur chargement baux:', error);
                notify('Erreur lors du chargement des baux', 'error');
            } finally {
                setLoadingLeases(false);
            }
        };
        fetchLeases();
    }, [notify]);

    useEffect(() => {
        if (selectedLeaseId) {
            const lease = leases.find(l => l.id.toString() === selectedLeaseId);
            setSelectedLease(lease || null);
        } else {
            setSelectedLease(null);
        }
    }, [selectedLeaseId, leases]);

    useEffect(() => {
        updateAmountAndInfo();
    }, [selectedLease, noticeType]);

    const updateAmountAndInfo = () => {
        if (selectedLease) {
            // S'assurer que les valeurs sont des nombres
            const rent = typeof selectedLease.rent_amount === 'number' 
                ? selectedLease.rent_amount 
                : parseFloat(String(selectedLease.rent_amount).replace(',', '.')) || 0;
            const charges = typeof selectedLease.charges_amount === 'number' 
                ? selectedLease.charges_amount 
                : parseFloat(String(selectedLease.charges_amount).replace(',', '.')) || 0;
            
            if (noticeType === 'rent') {
                setAmountHidden(rent.toString());
                setShowAmountField(false);
                setAmountVisible('');
            } else if (noticeType === 'charges') {
                setAmountHidden(charges.toString());
                setShowAmountField(false);
                setAmountVisible('');
            } else {
                setShowAmountField(true);
                setAmountHidden('');
            }
        }
    };

    const validateForm = (): boolean => {
        const newErrors: string[] = [];
        
        if (!selectedLeaseId) {
            newErrors.push('Veuillez sélectionner un bail');
        }
        if (!dueDate) {
            newErrors.push('Veuillez sélectionner une date d\'échéance');
        }
        if (showAmountField && (!amountVisible || parseFloat(amountVisible) <= 0)) {
            newErrors.push('Veuillez saisir un montant valide');
        }
        
        setErrors(newErrors);
        if (newErrors.length > 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        setErrors([]);
        
        try {
            const lease = leases.find(l => l.id.toString() === selectedLeaseId);
            if (!lease) throw new Error('Bail non trouvé');
            
            // S'assurer que les valeurs sont des nombres
            const rent = typeof lease.rent_amount === 'number' 
                ? lease.rent_amount 
                : parseFloat(String(lease.rent_amount).replace(',', '.')) || 0;
            const charges = typeof lease.charges_amount === 'number' 
                ? lease.charges_amount 
                : parseFloat(String(lease.charges_amount).replace(',', '.')) || 0;
            
            let totalAmount = 0;
            
            if (noticeType === 'rent') {
                totalAmount = rent;
            } else if (noticeType === 'charges') {
                totalAmount = charges;
            } else {
                totalAmount = parseFloat(amountVisible);
            }
            
            // 🔥 CORRECTION : Ne pas envoyer les champs vides
            const formData: any = {
                lease_id: parseInt(selectedLeaseId),
                type: noticeType,
                due_date: dueDate,
                amount: totalAmount,
                payment_method: paymentMethod,
                send_email: sendEmail
            };
            
            // Ajouter les champs optionnels seulement s'ils ont une valeur
            if (periodStart && periodStart.trim() !== '') {
                formData.period_start = periodStart;
            }
            if (periodEnd && periodEnd.trim() !== '') {
                formData.period_end = periodEnd;
            }
            if (notes && notes.trim() !== '') {
                formData.notes = notes;
            }
            
            console.log('Envoi des données:', formData);
            
            await rentDueNoticeService.create(formData);
            
            notify('Avis d\'échéance créé avec succès', 'success');
            
            setTimeout(() => {
                navigate('/proprietaire/echeance');
            }, 1500);
            
        } catch (error: any) {
            console.error('Erreur création avis:', error);
            setErrors([error.response?.data?.message || 'Erreur lors de la création']);
            notify(error.response?.data?.message || 'Erreur lors de la création', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getTenantName = (lease: Lease): string => {
        if (lease.tenant) {
            if (lease.tenant.user?.name) return lease.tenant.user.name;
            return `${lease.tenant.first_name} ${lease.tenant.last_name}`.trim();
        }
        return 'Locataire inconnu';
    };

    const getTotalAmount = (lease: Lease): number => {
        const rent = typeof lease.rent_amount === 'number' 
            ? lease.rent_amount 
            : parseFloat(String(lease.rent_amount).replace(',', '.')) || 0;
        const charges = typeof lease.charges_amount === 'number' 
            ? lease.charges_amount 
            : parseFloat(String(lease.charges_amount).replace(',', '.')) || 0;
        return rent + charges;
    };

    // Fonction de formatage simple sans multiplication
    const formatAmount = (amount: number): string => {
        if (isNaN(amount)) return '0';
        return amount.toLocaleString('fr-FR');
    };

    return (
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem', background: '#ffffff', minHeight: '100vh', fontFamily: "'Manrope', sans-serif" }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h1 style={{ fontFamily: "'Merriweather', serif", fontSize: '2.2rem', fontWeight: 800, color: '#111827', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                        Nouvel avis d'échéance
                    </h1>
                    <p style={{ color: '#6b7280', fontSize: '1.1rem', fontWeight: 400, fontFamily: "'Manrope', sans-serif", margin: 0 }}>
                        Créez un nouvel avis d'échéance pour un locataire
                    </p>
                </div>
            </div>

            {/* Messages d'alerte */}
            {errors.length > 0 && (
                <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '14px', padding: '1.2rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 8v4M12 16h.01"/>
                    </svg>
                    <div>
                        <strong style={{ color: '#991b1b', fontWeight: 600, display: 'block', marginBottom: '4px', fontSize: '1rem' }}>Erreurs de validation</strong>
                        <ul style={{ marginTop: '0.5rem', paddingLeft: '1rem', color: '#b91c1c' }}>
                            {errors.map((error, idx) => <li key={idx}>{error}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} id="notice-form" style={{ background: 'white', borderRadius: '20px', border: '2px solid #e5e7eb', padding: '40px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ fontFamily: "'Merriweather', serif", fontSize: '1.3rem', fontWeight: 700, color: '#111827', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span>📋</span> Informations de l'avis d'échéance
                </div>

                {/* Première ligne: Sélection du bail + Type de facture */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 40px', marginBottom: '32px' }}>
                    {/* Sélection du bail */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', fontFamily: "'Manrope', sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Bail / Location <span style={{ color: '#dc2626', marginLeft: '2px' }}>*</span>
                        </label>
                        {loadingLeases ? (
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
                            </div>
                        ) : (
                            <select
                                value={selectedLeaseId}
                                onChange={(e) => setSelectedLeaseId(e.target.value)}
                                style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '0.95rem', fontFamily: "'Manrope', sans-serif", fontWeight: 500, color: '#111827', background: 'white', outline: 'none' }}
                                required
                            >
                                <option value="">Sélectionner un bail</option>
                                {leases.map(lease => (
                                    <option key={lease.id} value={lease.id}>
                                        {lease.property?.name} - {getTenantName(lease)}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Type de facture */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', fontFamily: "'Manrope', sans-serif" }}>Type de facture</label>
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                                <input type="radio" name="type" value="rent" checked={noticeType === 'rent'} onChange={(e) => setNoticeType(e.target.value)} style={{ width: '18px', height: '18px', accentColor: '#7FBF55', cursor: 'pointer' }} />
                                Loyer
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                                <input type="radio" name="type" value="charges" checked={noticeType === 'charges'} onChange={(e) => setNoticeType(e.target.value)} style={{ width: '18px', height: '18px', accentColor: '#7FBF55', cursor: 'pointer' }} />
                                Charges
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                                <input type="radio" name="type" value="deposit" checked={noticeType === 'deposit'} onChange={(e) => setNoticeType(e.target.value)} style={{ width: '18px', height: '18px', accentColor: '#7FBF55', cursor: 'pointer' }} />
                                Dépôt de garantie
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                                <input type="radio" name="type" value="repair" checked={noticeType === 'repair'} onChange={(e) => setNoticeType(e.target.value)} style={{ width: '18px', height: '18px', accentColor: '#7FBF55', cursor: 'pointer' }} />
                                Réparation
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', color: '#374151', cursor: 'pointer', fontWeight: 500 }}>
                                <input type="radio" name="type" value="other" checked={noticeType === 'other'} onChange={(e) => setNoticeType(e.target.value)} style={{ width: '18px', height: '18px', accentColor: '#7FBF55', cursor: 'pointer' }} />
                                Autre
                            </label>
                        </div>
                    </div>
                </div>

                {/* Carte info bail */}
                {selectedLease && (
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ background: '#f9fafb', borderRadius: '12px', padding: '1.2rem', border: '1px solid #e5e7eb' }}>
                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#374151', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Info size={16} color="#7FBF55" />
                                Informations du bail
                            </h4>
                            <p style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <Building size={14} /> <strong>Bien :</strong> {selectedLease.property?.name}
                            </p>
                            <p style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <User size={14} /> <strong>Locataire :</strong> {getTenantName(selectedLease)}
                            </p>
                            <p style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <DollarSign size={14} /> <strong>Loyer mensuel :</strong> {formatAmount(getTotalAmount(selectedLease) - (selectedLease?.charges_amount || 0))} FCFA
                            </p>
                            <p style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                <DollarSign size={14} /> <strong>Charges mensuelles :</strong> {formatAmount(selectedLease.charges_amount || 0)} FCFA
                            </p>
                            <p style={{ marginTop: '0.6rem', paddingTop: '0.6rem', borderTop: '1px solid #e5e7eb', fontSize: '1.1rem', fontWeight: 700, color: '#7FBF55' }}>
                                Total mensuel : {formatAmount(getTotalAmount(selectedLease))} FCFA
                            </p>
                        </div>
                    </div>
                )}

                {/* Période début et fin */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 40px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>Période - Début</label>
                        <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '0.95rem', background: '#FFFFFF', color: '#111827' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>Période - Fin</label>
                        <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '0.95rem', background: '#FFFFFF', color: '#111827' }} />
                    </div>
                </div>

                {/* Date d'échéance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 40px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>
                            Date d'échéance <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem 0.85rem 40px', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '0.95rem', background: '#FFFFFF', color: '#111827' }} required />
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Date limite de paiement
                        </div>
                    </div>
                    <div></div>
                </div>

                {/* Montant total caché */}
                <input type="hidden" name="amount" id="amount-hidden" value={amountHidden} />

                {/* Champ montant visible pour deposit/repair/other */}
                {showAmountField && (
                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151' }}>
                                Montant total (FCFA) <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <input type="number" value={amountVisible} onChange={(e) => setAmountVisible(e.target.value)} placeholder="Ex: 50000" step="1" style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '0.95rem', background: '#FFFFFF', color: '#111827' }} />
                            <div style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '6px' }}>Saisissez le montant pour ce type de facture</div>
                        </div>
                    </div>
                )}

                {/* Mode de paiement */}
                <div style={{ marginBottom: '32px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Mode de paiement</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '0.85rem 1rem', border: '2px solid #d1d5db', borderRadius: '10px', fontSize: '0.95rem', background: '#FFFFFF', color: '#111827' }}>
                        <option value="Virement bancaire">Virement bancaire</option>
                        <option value="Espèce">Espèce</option>
                        <option value="Chèque">Chèque</option>
                        <option value="Mobile Money">Mobile Money</option>
                        <option value="Carte bancaire">Carte bancaire</option>
                    </select>
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '32px' }}>
                    <label style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: '8px', display: 'block' }}>Notes (optionnel)</label>
                    <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        rows={3} 
                        placeholder="Informations complémentaires..." 
                        style={{ 
                            width: '100%', 
                            padding: '0.85rem 1rem', 
                            border: '2px solid #d1d5db', 
                            borderRadius: '10px', 
                            fontSize: '0.95rem', 
                            resize: 'vertical', 
                            fontFamily: 'inherit',
                            background: '#FFFFFF',
                            color: '#111827'
                        }} 
                    />
                </div>

                {/* Option email */}
                <div style={{ marginBottom: '32px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#7FBF55', cursor: 'pointer' }} />
                        <Mail size={16} color="#7FBF55" />
                        <span style={{ fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Envoyer automatiquement l'avis d'échéance par email au locataire</span>
                    </label>
                </div>

                {/* Boutons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #f3f4f6' }}>
                    <button type="button" onClick={() => navigate('/proprietaire/echeance')} style={{ padding: '12px 24px', background: 'white', border: '2px solid #fca5a5', borderRadius: '10px', color: '#dc2626', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}>
                        ✕ Annuler
                    </button>
                    <button type="submit" disabled={loading || (!selectedLease && !loadingLeases)} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 26px', background: '#7FBF55', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                        <CheckCircle size={16} />
                        {loading ? 'Création en cours...' : 'Créer l\'avis'}
                    </button>
                </div>
            </form>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: #7FBF55 !important;
                    box-shadow: 0 0 0 4px rgba(127, 191, 85, 0.12);
                }
            `}</style>
        </div>
    );
};

export default CreateAvisEcheance;