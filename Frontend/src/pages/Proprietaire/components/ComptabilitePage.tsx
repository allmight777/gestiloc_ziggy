// src/pages/Proprietaire/components/ComptabilitePage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Download,
    Plus,
    TrendingUp,
    ArrowUpCircle,
    ArrowDownCircle,
    Home,
    ChevronDown,
    Search,
    FileText,
    CreditCard,
    Smartphone,
    Edit3,
    Trash2,
    Star,
    Loader,
    AlertCircle,
    Landmark,
    Wallet
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarController, BarElement, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { accountingService, propertyService } from '@/services/api';
import paymentMethodService, { PaymentMethod } from '@/services/paymentMethodService';

ChartJS.register(CategoryScale, LinearScale, BarController, BarElement, DoughnutController, ArcElement, Tooltip, Legend);

interface ComptaProps {
    notify?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Transaction {
    id: number;
    date: string;
    type: 'REVENU' | 'CHARGE';
    description: string;
    property_id: number;
    property_name: string;
    category: string;
    amount: number;
    currency?: string;
    payment_method_id?: number;
}

interface Property {
    id: number;
    name: string;
    address: string;
}

interface Stats {
    resultat_net: number;
    resultat_net_formatted: string;
    variation: string;
    revenus: number;
    revenus_formatted: string;
    charges: number;
    charges_formatted: string;
    rentabilite: number;
    active_properties: number;
    transactions_count: number;
    occupied: number;
    vacant: number;
    revenus_par_categorie: Record<string, number>;
    charges_par_categorie: Record<string, number>;
    repartition_par_bien: Record<string, { revenus: number; charges: number; resultat: number }> | Array<{ name: string; resultat: number }>;
}

interface ChartDataPoint {
    month: string;
    received: number;
    average: number;
}

interface PaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    methodId?: number | null;
    onSave: () => void;
    notify?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({ isOpen, onClose, methodId, onSave, notify }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: '',
        beneficiary_name: '',
        country: 'CI',
        currency: 'XOF',
        is_default: false,
        mobile_operator: '',
        mobile_number: '',
        card_brand: '',
        card_last4: '',
        bank_name: '',
        bank_account_number: '',
        bank_iban: '',
        bank_swift: '',
    });

    useEffect(() => {
        if (methodId) {
            loadPaymentMethod();
        } else {
            resetForm();
        }
    }, [methodId]);

    const loadPaymentMethod = async () => {
        if (!methodId) return;
        
        setLoading(true);
        try {
            const method = await paymentMethodService.getById(methodId);
            setFormData({
                type: method.type || '',
                beneficiary_name: method.beneficiary_name || '',
                country: method.country || 'CI',
                currency: method.currency || 'XOF',
                is_default: method.is_default || false,
                mobile_operator: method.mobile_operator || '',
                mobile_number: method.mobile_number || '',
                card_brand: method.card_brand || '',
                card_last4: method.card_last4 || '',
                bank_name: method.bank_name || '',
                bank_account_number: method.bank_account_number || '',
                bank_iban: method.bank_iban || '',
                bank_swift: method.bank_swift || '',
            });
        } catch (error) {
            console.error('Erreur chargement:', error);
            notify?.('Erreur lors du chargement de la méthode de paiement', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            type: '',
            beneficiary_name: '',
            country: 'CI',
            currency: 'XOF',
            is_default: false,
            mobile_operator: '',
            mobile_number: '',
            card_brand: '',
            card_last4: '',
            bank_name: '',
            bank_account_number: '',
            bank_iban: '',
            bank_swift: '',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (methodId) {
                await paymentMethodService.update(methodId, formData);
                notify?.('Méthode de paiement modifiée avec succès', 'success');
            } else {
                await paymentMethodService.create(formData);
                notify?.('Méthode de paiement ajoutée avec succès', 'success');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            notify?.('Erreur lors de l\'enregistrement', 'error');
        } finally {
            setLoading(false);
        }
    };

    const togglePaymentFields = () => {
        // Logique pour afficher/masquer les champs selon le type
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
                zIndex: 1001
            }} onClick={onClose} />
            
            <div style={{
                position: 'relative',
                background: 'white',
                borderRadius: '20px',
                width: '90%',
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                zIndex: 1002,
                animation: 'modalSlideIn 0.3s ease-out'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid #e2e8f0'
                }}>
                    <h3 style={{
                        fontSize: '1.4rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        margin: 0
                    }}>
                        {methodId ? 'Modifier le mode de paiement' : 'Ajouter un mode de paiement'}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#64748b',
                            borderRadius: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f1f5f9';
                            e.currentTarget.style.color = '#1e293b';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'none';
                            e.currentTarget.style.color = '#64748b';
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>
                    <form onSubmit={handleSubmit}>
                        <input type="hidden" name="id" value={methodId || ''} />
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: '#1e293b',
                                marginBottom: '0.5rem'
                            }}>
                                Type de paiement
                            </label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#70AE48';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(112,174,72,0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <option value="">Sélectionnez un type</option>
                                <option value="mobile_money">Mobile Money</option>
                                <option value="card">Carte bancaire</option>
                                <option value="bank_transfer">Virement bancaire</option>
                                <option value="cash">Espèces</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{
                                display: 'block',
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                color: '#1e293b',
                                marginBottom: '0.5rem'
                            }}>
                                Nom du bénéficiaire
                            </label>
                            <input
                                type="text"
                                value={formData.beneficiary_name}
                                onChange={(e) => setFormData({...formData, beneficiary_name: e.target.value})}
                                required
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '10px',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor = '#70AE48';
                                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(112,174,72,0.1)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    marginBottom: '0.5rem'
                                }}>
                                    Pays
                                </label>
                                <select
                                    value={formData.country}
                                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 1rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '10px',
                                        fontSize: '1rem',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="CI">Côte d'Ivoire</option>
                                    <option value="BF">Burkina Faso</option>
                                    <option value="SN">Sénégal</option>
                                    <option value="ML">Mali</option>
                                    <option value="GN">Guinée</option>
                                    <option value="CM">Cameroun</option>
                                    <option value="BJ">Bénin</option>
                                    <option value="TG">Togo</option>
                                </select>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    marginBottom: '0.5rem'
                                }}>
                                    Devise
                                </label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '0.875rem 1rem',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '10px',
                                        fontSize: '1rem',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="XOF">FCFA (UEMOA)</option>
                                    <option value="XAF">FCFA (CEMAC)</option>
                                    <option value="EUR">Euro</option>
                                    <option value="USD">Dollar</option>
                                </select>
                            </div>
                        </div>

                        {/* Champs Mobile Money */}
                        {formData.type === 'mobile_money' && (
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                marginTop: '1rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Opérateur
                                    </label>
                                    <select
                                        value={formData.mobile_operator}
                                        onChange={(e) => setFormData({...formData, mobile_operator: e.target.value})}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="">Sélectionnez un opérateur</option>
                                        <option value="MTN">MTN</option>
                                        <option value="MOOV">MOOV</option>
                                        <option value="CELTIS">CELTIS</option>
                                        <option value="ORANGE">Orange</option>
                                        <option value="WAVE">Wave</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '0' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Numéro de téléphone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.mobile_number}
                                        onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                                        required
                                        placeholder="Ex: 0708091011"
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Champs Carte bancaire */}
                        {formData.type === 'card' && (
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                marginTop: '1rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Type de carte
                                    </label>
                                    <select
                                        value={formData.card_brand}
                                        onChange={(e) => setFormData({...formData, card_brand: e.target.value})}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="">Sélectionnez un type</option>
                                        <option value="Visa">Visa</option>
                                        <option value="Mastercard">Mastercard</option>
                                        <option value="American Express">American Express</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '0' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        marginBottom: '0.5rem'
                                    }}>
                                        4 derniers chiffres
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.card_last4}
                                        onChange={(e) => setFormData({...formData, card_last4: e.target.value})}
                                        required
                                        maxLength={4}
                                        placeholder="1234"
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <input type="hidden" name="card_token" value={`tok_${Math.random().toString(36).substr(2, 9)}`} />
                            </div>
                        )}

                        {/* Champs Virement bancaire */}
                        {formData.type === 'bank_transfer' && (
                            <div style={{
                                background: '#f8fafc',
                                borderRadius: '12px',
                                padding: '1.5rem',
                                marginTop: '1rem',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Nom de la banque
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bank_name}
                                        onChange={(e) => setFormData({...formData, bank_name: e.target.value})}
                                        required
                                        placeholder="Ex: Société Générale"
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        marginBottom: '0.5rem'
                                    }}>
                                        Numéro de compte
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.bank_account_number}
                                        onChange={(e) => setFormData({...formData, bank_account_number: e.target.value})}
                                        required
                                        placeholder="Ex: 12345678901"
                                        style={{
                                            width: '100%',
                                            padding: '0.875rem 1rem',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '10px',
                                            fontSize: '1rem',
                                            transition: 'all 0.2s',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: '#1e293b',
                                            marginBottom: '0.5rem'
                                        }}>
                                            IBAN
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bank_iban}
                                            onChange={(e) => setFormData({...formData, bank_iban: e.target.value})}
                                            placeholder="Ex: FR76 1234 5678 9012"
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '10px',
                                                fontSize: '1rem',
                                                transition: 'all 0.2s',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{
                                            display: 'block',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: '#1e293b',
                                            marginBottom: '0.5rem'
                                        }}>
                                            SWIFT/BIC
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.bank_swift}
                                            onChange={(e) => setFormData({...formData, bank_swift: e.target.value})}
                                            placeholder="Ex: SOGEFRPP"
                                            style={{
                                                width: '100%',
                                                padding: '0.875rem 1rem',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '10px',
                                                fontSize: '1rem',
                                                transition: 'all 0.2s',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_default}
                                    onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
                                    style={{
                                        width: '20px',
                                        height: '20px',
                                        cursor: 'pointer'
                                    }}
                                />
                                <span style={{ color: '#374151' }}>Définir comme méthode de paiement par défaut</span>
                            </label>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '1rem',
                            marginTop: '2rem',
                            paddingTop: '1rem',
                            borderTop: '1px solid #e2e8f0'
                        }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: '0.875rem 1.5rem',
                                    background: '#e2e8f0',
                                    color: '#475569',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#cbd5e1'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#e2e8f0'}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    padding: '0.875rem 2rem',
                                    background: '#70AE48',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.background = '#5d8f3a';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(112,174,72,0.3)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.background = '#70AE48';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

const ComptabilitePage: React.FC<ComptaProps> = ({ notify }) => {
    const navigate = useNavigate();
    const revenueChartRef = useRef<HTMLCanvasElement>(null);
    const occupancyChartRef = useRef<HTMLCanvasElement>(null);
    const revenueChartInstance = useRef<ChartJS | null>(null);
    const occupancyChartInstance = useRef<ChartJS | null>(null);

    // États
    const [loading, setLoading] = useState(true);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState<number[]>([new Date().getFullYear()]);
    const [stats, setStats] = useState<Stats>({
        resultat_net: 0,
        resultat_net_formatted: '0',
        variation: '0',
        revenus: 0,
        revenus_formatted: '0',
        charges: 0,
        charges_formatted: '0',
        rentabilite: 0,
        active_properties: 0,
        transactions_count: 0,
        occupied: 0,
        vacant: 0,
        revenus_par_categorie: {},
        charges_par_categorie: {},
        repartition_par_bien: {}
    });
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

    // États des filtres
    const [activeFilter, setActiveFilter] = useState<string>('all');
    const [propertyFilter, setPropertyFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // État du modal
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);

    // Charger les données
    useEffect(() => {
        fetchData();
    }, [currentYear]);

    useEffect(() => {
        applyFilters();
    }, [transactions, activeFilter, propertyFilter, categoryFilter, searchQuery]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Charger les stats
            const statsResponse = await accountingService.getStats(currentYear);
            
            // Charger les transactions
            const transactionsResponse = await accountingService.getTransactions({ year: currentYear });
            
            // Charger les propriétés
            const propertiesResponse = await propertyService.listProperties();

            // Charger les données des graphiques
            const chartResponse = await accountingService.getChartData(currentYear);

            // Charger les méthodes de paiement
            await fetchPaymentMethods();

            // Mettre à jour les stats
            if (statsResponse) {
                setStats({
                    resultat_net: statsResponse.resultat_net || 0,
                    resultat_net_formatted: formatNumber(statsResponse.resultat_net || 0),
                    variation: statsResponse.variation || '0%',
                    revenus: statsResponse.revenus || 0,
                    revenus_formatted: formatNumber(statsResponse.revenus || 0),
                    charges: statsResponse.charges || 0,
                    charges_formatted: formatNumber(statsResponse.charges || 0),
                    rentabilite: statsResponse.rentabilite || 0,
                    active_properties: statsResponse.active_properties || 0,
                    transactions_count: statsResponse.transactions_count || 0,
                    occupied: statsResponse.occupied || 0,
                    vacant: statsResponse.vacant || 0,
                    revenus_par_categorie: statsResponse.revenus_par_categorie || {},
                    charges_par_categorie: statsResponse.charges_par_categorie || {},
                    repartition_par_bien: statsResponse.repartition_par_bien || {}
                });
            }

            // Mettre à jour les transactions
            if (transactionsResponse.data) {
                setTransactions(transactionsResponse.data);
                setFilteredTransactions(transactionsResponse.data);
            }

            // Mettre à jour les propriétés
            if (propertiesResponse.data) {
                setProperties(propertiesResponse.data);
            }

            // Mettre à jour les données des graphiques
            if (chartResponse) {
                setChartData(chartResponse.data || []);
            }

            // Mettre à jour les années disponibles
            if (statsResponse?.available_years) {
                setAvailableYears(statsResponse.available_years);
            }

        } catch (error) {
            console.error('Erreur chargement données:', error);
            notify?.('Erreur lors du chargement des données', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentMethods = async () => {
        setLoadingPaymentMethods(true);
        try {
            const methods = await paymentMethodService.getAll();
            setPaymentMethods(methods);
        } catch (error) {
            console.error('Erreur chargement méthodes de paiement:', error);
        } finally {
            setLoadingPaymentMethods(false);
        }
    };

    const formatNumber = (num: number): string => {
        return new Intl.NumberFormat('fr-FR').format(num);
    };

    const formatCurrency = (amount: number, currency: string = 'FCFA'): string => {
        return `${formatNumber(amount)} ${currency}`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    };

    const maskNumber = (number: string): string => {
        if (!number) return '';
        if (number.length <= 4) return number;
        const visible = number.slice(-4);
        const masked = '*'.repeat(4);
        return masked + visible;
    };

    const getCountryName = (code: string): string => {
        const countries: Record<string, string> = {
            'CI': 'Côte d\'Ivoire',
            'BF': 'Burkina Faso',
            'SN': 'Sénégal',
            'ML': 'Mali',
            'GN': 'Guinée',
            'CM': 'Cameroun',
            'BJ': 'Bénin',
            'TG': 'Togo'
        };
        return countries[code] || code;
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'mobile_money': return Smartphone;
            case 'card': return CreditCard;
            case 'bank_transfer': return Landmark;
            case 'cash': return Wallet;
            default: return CreditCard;
        }
    };

    const getColor = (type: string): string => {
        const colors = {
            'mobile_money': '#70AE48',
            'card': '#FF9800',
            'bank_transfer': '#2196F3',
            'cash': '#4CAF50'
        };
        return colors[type as keyof typeof colors] || '#9E9E9E';
    };

    const getTypeLabel = (type: string): string => {
        const labels = {
            'mobile_money': 'Mobile Money',
            'card': 'Carte bancaire',
            'bank_transfer': 'Virement bancaire',
            'cash': 'Espèces'
        };
        return labels[type as keyof typeof labels] || 'Autre';
    };

    // Graphique des revenus
    useEffect(() => {
        if (!revenueChartRef.current || chartData.length === 0) return;
        if (revenueChartInstance.current) revenueChartInstance.current.destroy();

        const ctx = revenueChartRef.current.getContext('2d');
        if (!ctx) return;

        revenueChartInstance.current = new ChartJS(ctx, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.month),
                datasets: [
                    {
                        label: 'Loyers reçus',
                        data: chartData.map(d => d.received),
                        backgroundColor: '#70AE48',
                        borderRadius: 4,
                        barPercentage: 0.6,
                    },
                    {
                        label: 'Moyenne mensuelle',
                        data: chartData.map(d => d.average),
                        backgroundColor: '#f59e0b',
                        borderRadius: 4,
                        barPercentage: 0.6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return context.dataset.label + ': ' + context.parsed.y.toLocaleString('fr-FR') + ' FCFA';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value.toLocaleString('fr-FR') + ' FCFA'
                        }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });

        return () => {
            if (revenueChartInstance.current) {
                revenueChartInstance.current.destroy();
            }
        };
    }, [chartData]);

    // Graphique d'occupation
    useEffect(() => {
        if (!occupancyChartRef.current) return;
        if (occupancyChartInstance.current) occupancyChartInstance.current.destroy();

        const ctx = occupancyChartRef.current.getContext('2d');
        if (!ctx) return;

        occupancyChartInstance.current = new ChartJS(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Occupés', 'Vacants'],
                datasets: [{
                    data: [stats.occupied, stats.vacant],
                    backgroundColor: ['#70AE48', '#fbbf24'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = stats.occupied + stats.vacant;
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });

        return () => {
            if (occupancyChartInstance.current) {
                occupancyChartInstance.current.destroy();
            }
        };
    }, [stats.occupied, stats.vacant]);

    const applyFilters = () => {
        let filtered = [...transactions];

        // Filtre par type
        if (activeFilter === 'revenu') {
            filtered = filtered.filter(t => t.type === 'REVENU');
        } else if (activeFilter === 'charge') {
            filtered = filtered.filter(t => t.type === 'CHARGE');
        } else if (activeFilter === 'jan' || activeFilter === 'fev') {
            const month = activeFilter === 'jan' ? 0 : 1;
            filtered = filtered.filter(t => {
                const date = new Date(t.date);
                return date.getMonth() === month && date.getFullYear() === currentYear;
            });
        }

        // Filtre par propriété
        if (propertyFilter !== 'all') {
            filtered = filtered.filter(t => t.property_id === parseInt(propertyFilter));
        }

        // Filtre par catégorie
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        // Recherche textuelle
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.property_name.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query)
            );
        }

        setFilteredTransactions(filtered);
    };

    const handleExport = () => {
        const headers = ['Date', 'Type', 'Description', 'Bien', 'Catégorie', 'Montant'];
        const rows = filteredTransactions.map(t => [
            formatDate(t.date),
            t.type,
            t.description,
            t.property_name,
            t.category,
            `${t.type === 'REVENU' ? '+' : '-'} ${formatCurrency(t.amount, t.currency || 'FCFA')}`
        ]);

        const csv = [headers, ...rows].map(row => row.join(';')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        notify?.('Export réussi', 'success');
    };

    const handleOpenModal = (methodId?: number) => {
        setSelectedMethodId(methodId || null);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedMethodId(null);
    };

    const handleSaveMethod = () => {
        fetchPaymentMethods();
    };

    const handleDeleteMethod = async (id: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette méthode de paiement ?')) {
            return;
        }

        try {
            await paymentMethodService.delete(id);
            notify?.('Méthode de paiement supprimée avec succès', 'success');
            fetchPaymentMethods();
        } catch (error) {
            console.error('Erreur suppression:', error);
            notify?.('Erreur lors de la suppression', 'error');
        }
    };

    const handleSetDefault = async (id: number) => {
        try {
            await paymentMethodService.setDefault(id);
            notify?.('Méthode par défaut mise à jour', 'success');
            fetchPaymentMethods();
        } catch (error) {
            console.error('Erreur:', error);
            notify?.('Erreur lors de la mise à jour', 'error');
        }
    };

    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                background: '#f8fafc'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e2e8f0',
                        borderTopColor: '#70AE48',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Chargement des données...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '2rem',
            background: '#f8fafc',
            minHeight: '100vh',
            fontFamily: "'Manrope', sans-serif"
        }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

            {/* Modal */}
            <PaymentMethodModal
                isOpen={modalOpen}
                onClose={handleCloseModal}
                methodId={selectedMethodId}
                onSave={handleSaveMethod}
                notify={notify}
            />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2rem',
                gap: '2rem',
                flexWrap: 'wrap'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        margin: '0 0 0.5rem 0'
                    }}>
                        Comptabilité et travaux
                    </h1>
                    <p style={{
                        color: '#64748b',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                        margin: 0
                    }}>
                        Suivez vos revenus et dépenses locatives en temps réel.<br />
                        Exportez vos données comptables et générez vos déclarations fiscales.
                    </p>
                </div>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem'
                }}>
                    <button
                        onClick={() => handleOpenModal()}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >
                        <CreditCard size={16} />
                        Mode de paiement
                    </button>
                    <button
                        onClick={handleExport}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.2rem',
                            background: '#f97316',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#ea580c'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f97316'}
                    >
                        <Download size={16} />
                        Exporter
                    </button>
                    <button
                        onClick={() => navigate('/proprietaire/comptabilite/nouveau')}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            padding: '0.7rem 1.2rem',
                            background: '#70AE48',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#5d8f3a';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(112,174,72,0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#70AE48';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        <Plus size={16} />
                        Ajouter une transaction
                    </button>
                </div>
            </div>

            {/* Stats Cards - Tailles réduites */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                {/* Carte 1 - Résultat net */}
                <div style={{
                    background: '#70AE48',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    border: '1px solid #70AE48',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.8)',
                        letterSpacing: '0.05em',
                        marginBottom: '0.4rem'
                    }}>
                        RÉSULTAT NET {currentYear}
                    </div>
                    <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: 'white',
                        marginBottom: '0.2rem'
                    }}>
                        + {stats.resultat_net_formatted} FCFA
                    </div>
                    <div style={{
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.9)'
                    }}>
                        {stats.variation} vs {currentYear - 1}
                    </div>
                </div>

                {/* Carte 2 - Revenus */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        letterSpacing: '0.05em',
                        marginBottom: '0.4rem'
                    }}>
                        REVENUS LOCATIFS
                    </div>
                    <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: '#70AE48',
                        marginBottom: '0.2rem'
                    }}>
                        {stats.revenus_formatted} FCFA
                    </div>
                    <div style={{
                        fontSize: '0.7rem',
                        color: '#94a3b8'
                    }}>
                        {stats.active_properties} biens actifs
                    </div>
                </div>

                {/* Carte 3 - Charges */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        letterSpacing: '0.05em',
                        marginBottom: '0.4rem'
                    }}>
                        CHARGES TOTALES
                    </div>
                    <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: '#ef4444',
                        marginBottom: '0.2rem'
                    }}>
                        {stats.charges_formatted} FCFA
                    </div>
                    <div style={{
                        fontSize: '0.7rem',
                        color: '#94a3b8'
                    }}>
                        {stats.transactions_count} transactions
                    </div>
                </div>

                {/* Carte 4 - Rentabilité */}
                <div style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '1.2rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: '#94a3b8',
                        letterSpacing: '0.05em',
                        marginBottom: '0.4rem'
                    }}>
                        TAUX DE RENTABILITÉ
                    </div>
                    <div style={{
                        fontSize: '1.3rem',
                        fontWeight: 700,
                        color: '#70AE48',
                        marginBottom: '0.2rem'
                    }}>
                        {stats.rentabilite}%
                    </div>
                    <div style={{
                        fontSize: '0.7rem',
                        color: '#94a3b8'
                    }}>
                        Brut annuel
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Grand graphique - Revenus */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#1e293b'
                        }}>
                            <TrendingUp size={18} color="#70AE48" />
                            Revenus mensuels
                        </div>
                        <select
                            value={currentYear}
                            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                            style={{
                                padding: '0.4rem 0.8rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                background: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ height: '300px', position: 'relative' }}>
                        <canvas ref={revenueChartRef} />
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '2rem',
                        marginTop: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#70AE48'
                            }}></span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Loyers reçus</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                background: '#f59e0b'
                            }}></span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Moyenne mensuelle</span>
                        </div>
                    </div>
                </div>

                {/* Petit graphique - Taux d'occupation */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#1e293b'
                        }}>
                            Taux d'occupation
                        </span>
                    </div>
                    <div style={{ height: '200px', position: 'relative' }}>
                        <canvas ref={occupancyChartRef} />
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '3rem',
                        marginTop: '1.5rem'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#70AE48' }}>
                                {stats.occupied}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Occupés</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b' }}>
                                {stats.vacant}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Vacants</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Categories Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                {/* Revenus par catégorie */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <ArrowUpCircle size={14} color="#70AE48" />
                        Revenus par catégorie
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {Object.entries(stats.revenus_par_categorie).map(([name, amount]) => (
                            amount > 0 && (
                                <div key={name} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.8rem',
                                    color: '#374151'
                                }}>
                                    <span>{name}</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(amount)}</span>
                                </div>
                            )
                        ))}
                        {Object.keys(stats.revenus_par_categorie).length === 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.8rem',
                                color: '#374151'
                            }}>
                                <span>Aucun revenu</span>
                                <span style={{ fontWeight: 600 }}>0 FCFA</span>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            color: '#374151',
                            paddingTop: '0.6rem',
                            borderTop: '1px solid #e2e8f0',
                            fontWeight: 600
                        }}>
                            <span>Total revenus</span>
                            <span style={{ color: '#70AE48' }}>{formatCurrency(stats.revenus)}</span>
                        </div>
                    </div>
                </div>

                {/* Charges par catégorie */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <ArrowDownCircle size={14} color="#ef4444" />
                        Charges par catégorie
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {Object.entries(stats.charges_par_categorie).map(([name, amount]) => (
                            amount > 0 && (
                                <div key={name} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.8rem',
                                    color: '#374151'
                                }}>
                                    <span>{name}</span>
                                    <span style={{ fontWeight: 600 }}>{formatCurrency(amount)}</span>
                                </div>
                            )
                        ))}
                        {Object.keys(stats.charges_par_categorie).length === 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.8rem',
                                color: '#374151'
                            }}>
                                <span>Aucune charge</span>
                                <span style={{ fontWeight: 600 }}>0 FCFA</span>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            color: '#374151',
                            paddingTop: '0.6rem',
                            borderTop: '1px solid #e2e8f0',
                            fontWeight: 600
                        }}>
                            <span>Total charges</span>
                            <span style={{ color: '#ef4444' }}>{stats.charges_formatted} FCFA</span>
                        </div>
                    </div>
                </div>

                {/* Performance par bien - CORRIGÉ */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                    <h4 style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        margin: '0 0 1rem 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <Home size={14} color="#70AE48" />
                        Performance par bien
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {stats.repartition_par_bien && typeof stats.repartition_par_bien === 'object' && !Array.isArray(stats.repartition_par_bien) ? (
                            Object.entries(stats.repartition_par_bien).slice(0, 5).map(([name, data], index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.8rem',
                                    color: '#374151'
                                }}>
                                    <span title={name}>
                                        {name.length > 20 ? name.substring(0, 20) + '...' : name}
                                    </span>
                                    <span style={{
                                        fontWeight: 600,
                                        color: (data as any).resultat >= 0 ? '#70AE48' : '#ef4444'
                                    }}>
                                        {(data as any).resultat >= 0 ? '+' : ''}{formatCurrency((data as any).resultat)}
                                    </span>
                                </div>
                            ))
                        ) : Array.isArray(stats.repartition_par_bien) ? (
                            (stats.repartition_par_bien as Array<{ name: string; resultat: number }>).slice(0, 5).map((item, index) => (
                                <div key={index} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '0.8rem',
                                    color: '#374151'
                                }}>
                                    <span title={item.name}>
                                        {item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}
                                    </span>
                                    <span style={{
                                        fontWeight: 600,
                                        color: item.resultat >= 0 ? '#70AE48' : '#ef4444'
                                    }}>
                                        {item.resultat >= 0 ? '+' : ''}{formatCurrency(item.resultat)}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '0.8rem',
                                color: '#374151'
                            }}>
                                <span>Aucun résultat</span>
                                <span style={{ fontWeight: 600 }}>0 FCFA</span>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem',
                            color: '#374151',
                            paddingTop: '0.6rem',
                            borderTop: '1px solid #e2e8f0',
                            fontWeight: 600
                        }}>
                            <span>Résultat total</span>
                            <span style={{ color: '#70AE48' }}>+{stats.resultat_net_formatted} FCFA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Méthodes de paiement - EXACTEMENT COMME DANS LA VERSION BLADE */}

{/* Section Méthodes de paiement - Version avec hauteur réduite */}
<div style={{
    marginBottom: '2rem'
}}>
    <h3 style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '1.5rem',
        fontWeight: 600,
        color: '#1e293b',
        marginBottom: '1.5rem'
    }}>
        <CreditCard size={24} color="#70AE48" />
        Mes méthodes de paiement
    </h3>
    
    {loadingPaymentMethods ? (
        <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#64748b',
            fontSize: '1rem'
        }}>
            <div style={{
                width: '30px',
                height: '30px',
                border: '2px solid #e2e8f0',
                borderTopColor: '#70AE48',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 0.5rem'
            }}></div>
            <p>Chargement des méthodes de paiement...</p>
        </div>
    ) : paymentMethods.length === 0 ? (
        <div style={{
            textAlign: 'center',
            padding: '2rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px dashed #e2e8f0'
        }}>
            <CreditCard size={48} color="#94a3b8" style={{ marginBottom: '0.75rem' }} />
            <p style={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '0.25rem'
            }}>
                Aucune méthode de paiement
            </p>
            <p style={{
                fontSize: '0.85rem',
                color: '#64748b'
            }}>
                Ajoutez votre première méthode de paiement
            </p>
        </div>
    ) : (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', // 2 colonnes exactement
            gap: '1rem'
        }}>
            {paymentMethods.map((method) => {
                const Icon = getIcon(method.type);
                const color = getColor(method.type);
                const typeLabel = getTypeLabel(method.type);
                
                return (
                    <div
                        key={method.id}
                        onClick={() => handleOpenModal(method.id)}
                        style={{
                            background: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            padding: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            height: 'auto',
                            minHeight: '200px', // Hauteur minimale réduite
                            ...(method.is_default ? {
                                borderLeft: '3px solid #70AE48',
                                background: 'linear-gradient(to right, #ffffff, #f8fafc)'
                            } : {})
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                            e.currentTarget.style.borderColor = '#70AE48';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        {/* En-tête avec icône et type */}
                        <div style={{
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: `${color}20`,
                                color: color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Icon size={18} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flexWrap: 'wrap',
                                    marginBottom: '0.1rem'
                                }}>
                                    <span style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: '#1e293b'
                                    }}>
                                        {paymentMethodService.getDisplayName(method)}
                                    </span>
                                    {method.is_default && (
                                        <span style={{
                                            background: '#70AE48',
                                            color: 'white',
                                            fontSize: '0.7rem',
                                            padding: '0.15rem 0.5rem',
                                            borderRadius: '20px',
                                            fontWeight: 500
                                        }}>
                                            Par défaut
                                        </span>
                                    )}
                                </div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: '#64748b'
                                }}>
                                    {typeLabel}
                                </div>
                            </div>
                        </div>

                        {/* Détails - Version compacte */}
                        <div style={{
                            background: '#f8fafc',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '0.5rem',
                                fontSize: '0.8rem'
                            }}>
                                <span style={{
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    minWidth: '70px',
                                    fontSize: '0.75rem'
                                }}>
                                    Bénéficiaire:
                                </span>
                                <span style={{
                                    color: '#374151',
                                    fontSize: '0.8rem',
                                    wordBreak: 'break-word'
                                }}>
                                    {method.beneficiary_name.length > 25 
                                        ? method.beneficiary_name.substring(0, 25) + '...' 
                                        : method.beneficiary_name}
                                </span>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '0.5rem',
                                fontSize: '0.8rem'
                            }}>
                                <span style={{
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    minWidth: '70px',
                                    fontSize: '0.75rem'
                                }}>
                                    Pays:
                                </span>
                                <span style={{
                                    color: '#374151',
                                    fontSize: '0.8rem'
                                }}>
                                    {paymentMethodService.getCountryName(method.country)}
                                </span>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '0.5rem',
                                fontSize: '0.8rem'
                            }}>
                                <span style={{
                                    fontWeight: 600,
                                    color: '#1e293b',
                                    minWidth: '70px',
                                    fontSize: '0.75rem'
                                }}>
                                    Devise:
                                </span>
                                <span style={{
                                    color: '#374151',
                                    fontSize: '0.8rem'
                                }}>
                                    {method.currency}
                                </span>
                            </div>

                            {method.bank_name && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        minWidth: '70px',
                                        fontSize: '0.75rem'
                                    }}>
                                        Banque:
                                    </span>
                                    <span style={{
                                        color: '#374151',
                                        fontSize: '0.8rem'
                                    }}>
                                        {method.bank_name.length > 20 
                                            ? method.bank_name.substring(0, 20) + '...' 
                                            : method.bank_name}
                                    </span>
                                </div>
                            )}

                            {method.bank_account_number && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        minWidth: '70px',
                                        fontSize: '0.75rem'
                                    }}>
                                        Compte:
                                    </span>
                                    <span style={{
                                        color: '#374151',
                                        fontSize: '0.8rem'
                                    }}>
                                        {paymentMethodService.maskNumber(method.bank_account_number)}
                                    </span>
                                </div>
                            )}

                            {method.bank_iban && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        minWidth: '70px',
                                        fontSize: '0.75rem'
                                    }}>
                                        IBAN:
                                    </span>
                                    <span style={{
                                        color: '#374151',
                                        fontSize: '0.8rem'
                                    }}>
                                        {paymentMethodService.maskNumber(method.bank_iban)}
                                    </span>
                                </div>
                            )}

                            {method.mobile_operator && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        minWidth: '70px',
                                        fontSize: '0.75rem'
                                    }}>
                                        Opérateur:
                                    </span>
                                    <span style={{
                                        color: '#374151',
                                        fontSize: '0.8rem'
                                    }}>
                                        {method.mobile_operator}
                                    </span>
                                </div>
                            )}

                            {method.mobile_number && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        minWidth: '70px',
                                        fontSize: '0.75rem'
                                    }}>
                                        Téléphone:
                                    </span>
                                    <span style={{
                                        color: '#374151',
                                        fontSize: '0.8rem'
                                    }}>
                                        {paymentMethodService.maskNumber(method.mobile_number)}
                                    </span>
                                </div>
                            )}

                            {method.card_brand && method.card_last4 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    gap: '0.5rem',
                                    fontSize: '0.8rem'
                                }}>
                                    <span style={{
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        minWidth: '70px',
                                        fontSize: '0.75rem'
                                    }}>
                                        Carte:
                                    </span>
                                    <span style={{
                                        color: '#374151',
                                        fontSize: '0.8rem'
                                    }}>
                                        {method.card_brand} •••• {method.card_last4}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Actions - Boutons plus petits */}
                        <div style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginTop: '0.25rem',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal(method.id);
                                }}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.35rem 0.8rem',
                                    background: 'white',
                                    color: '#1e293b',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f1f5f9';
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <Edit3 size={12} />
                                Modifier
                            </button>
                            
                            {!method.is_default && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSetDefault(method.id);
                                    }}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        padding: '0.35rem 0.8rem',
                                        background: 'white',
                                        color: '#1e293b',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#f1f5f9';
                                        e.currentTarget.style.borderColor = '#cbd5e1';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'white';
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                    }}
                                >
                                    <Star size={12} />
                                    Défaut
                                </button>
                            )}
                            
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteMethod(method.id);
                                }}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    padding: '0.35rem 0.8rem',
                                    background: 'white',
                                    color: '#1e293b',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#fee2e2';
                                    e.currentTarget.style.color = '#dc2626';
                                    e.currentTarget.style.borderColor = '#fecaca';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.color = '#1e293b';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                }}
                            >
                                <Trash2 size={12} />
                                Supprimer
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    )}
</div>

            {/* Filter Pills */}
            <div style={{
                display: 'flex',
                gap: '0.6rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap'
            }}>
                {[
                    { id: 'all', label: 'Toutes les transactions' },
                    { id: 'revenu', label: 'Revenus' },
                    { id: 'charge', label: 'Charges' },
                    { id: 'jan', label: `Janvier ${currentYear}` },
                    { id: 'fev', label: `Février ${currentYear}` }
                ].map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: activeFilter === filter.id ? '#70AE48' : '#e2e8f0',
                            color: activeFilter === filter.id ? 'white' : '#475569',
                            border: 'none',
                            borderRadius: '50px',
                            fontWeight: 500,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (activeFilter !== filter.id) {
                                e.currentTarget.style.background = '#cbd5e1';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeFilter !== filter.id) {
                                e.currentTarget.style.background = '#e2e8f0';
                            }
                        }}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Filters Card */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <h3 style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    letterSpacing: '0.05em',
                    margin: '0 0 1rem 0'
                }}>
                    FILTRER LES TRANSACTIONS
                </h3>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1rem'
                }}>
                    {/* Filtre par bien */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={propertyFilter}
                            onChange={(e) => setPropertyFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.7rem 1rem',
                                paddingRight: '2.5rem',
                                border: '1px solid #70AE48',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: '#374151',
                                background: 'white',
                                appearance: 'none',
                                cursor: 'pointer'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#5d8f3a';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(112,174,72,0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#70AE48';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <option value="all">Tous les biens</option>
                            {properties.map(prop => (
                                <option key={prop.id} value={prop.id}>
                                    {prop.name || prop.address}
                                </option>
                            ))}
                        </select>
                        <ChevronDown size={16} style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#64748b',
                            pointerEvents: 'none'
                        }} />
                    </div>

                    {/* Filtre par catégorie */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.7rem 1rem',
                                paddingRight: '2.5rem',
                                border: '1px solid #70AE48',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: '#374151',
                                background: 'white',
                                appearance: 'none',
                                cursor: 'pointer'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#5d8f3a';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(112,174,72,0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#70AE48';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <option value="all">Toutes les catégories</option>
                            <option value="Loyer">Loyer</option>
                            <option value="Dépôt de garantie">Dépôt de garantie</option>
                            <option value="Charges">Charges</option>
                            <option value="Réparations">Réparations</option>
                        </select>
                        <ChevronDown size={16} style={{
                            position: 'absolute',
                            right: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#64748b',
                            pointerEvents: 'none'
                        }} />
                    </div>
                </div>

                {/* Recherche */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#70AE48'
                        }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher une transaction"
                            style={{
                                width: '100%',
                                padding: '0.7rem 1rem 0.7rem 2.5rem',
                                border: '1px solid #70AE48',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                color: '#374151',
                                background: 'white',
                                outline: 'none'
                            }}
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = '#5d8f3a';
                                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(112,174,72,0.1)';
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = '#70AE48';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <div style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1e293b',
                        whiteSpace: 'nowrap'
                    }}>
                        <span>{filteredTransactions.length}</span> transactions
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <h3 style={{
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    margin: '0 0 1rem 0'
                }}>
                    Dernières transactions
                </h3>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        minWidth: '800px'
                    }}>
                        <thead>
                            <tr>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '0.6rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    DATE
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '0.6rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    TYPE
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '0.6rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    DESCRIPTION
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '0.6rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    BIEN
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '0.6rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    CATÉGORIE
                                </th>
                                <th style={{
                                    textAlign: 'left',
                                    padding: '0.6rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    color: '#94a3b8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    borderBottom: '1px solid #e2e8f0'
                                }}>
                                    MONTANT
                                </th>
                            
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((transaction) => {
                                    const isRevenu = transaction.type === 'REVENU';
                                    const date = new Date(transaction.date);
                                    const formattedDate = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
                                    
                                    return (
                                        <tr
                                            key={transaction.id}
                                            style={{
                                                transition: 'background 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{
                                                padding: '0.7rem 0.6rem',
                                                fontSize: '0.8rem',
                                                color: '#374151',
                                                borderBottom: '1px solid #f1f5f9'
                                            }}>
                                                {formattedDate}
                                            </td>
                                            <td style={{
                                                padding: '0.7rem 0.6rem',
                                                fontSize: '0.8rem',
                                                color: '#374151',
                                                borderBottom: '1px solid #f1f5f9'
                                            }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '0.2rem 0.6rem',
                                                    borderRadius: '20px',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    letterSpacing: '0.05em',
                                                    background: isRevenu ? '#e6f2e0' : '#fee2e2',
                                                    color: isRevenu ? '#70AE48' : '#dc2626'
                                                }}>
                                                    {transaction.type}
                                                </span>
                                            </td>
                                            <td style={{
                                                padding: '0.7rem 0.6rem',
                                                fontSize: '0.8rem',
                                                color: '#374151',
                                                borderBottom: '1px solid #f1f5f9'
                                            }}>
                                                {transaction.description}
                                            </td>
                                            <td style={{
                                                padding: '0.7rem 0.6rem',
                                                fontSize: '0.8rem',
                                                color: '#374151',
                                                borderBottom: '1px solid #f1f5f9'
                                            }}>
                                                {transaction.property_name.length > 20
                                                    ? transaction.property_name.substring(0, 20) + '...'
                                                    : transaction.property_name}
                                            </td>
                                            <td style={{
                                                padding: '0.7rem 0.6rem',
                                                fontSize: '0.8rem',
                                                color: '#374151',
                                                borderBottom: '1px solid #f1f5f9'
                                            }}>
                                                {transaction.category}
                                            </td>
                                            <td style={{
                                                padding: '0.7rem 0.6rem',
                                                fontSize: '0.8rem',
                                                borderBottom: '1px solid #f1f5f9',
                                                fontWeight: 600,
                                                color: isRevenu ? '#70AE48' : '#dc2626'
                                            }}>
                                                {isRevenu ? '+' : '-'} {formatCurrency(transaction.amount, transaction.currency || 'FCFA')}
                                            </td>
                                     
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} style={{
                                        textAlign: 'center',
                                        padding: '3rem',
                                        color: '#94a3b8'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}>
                                            <FileText size={40} color="#94a3b8" />
                                            <p style={{ fontSize: '0.8rem' }}>Aucune transaction trouvée</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComptabilitePage;