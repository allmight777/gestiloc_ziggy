import React, { useState, useEffect } from 'react';
import api from '@/services/api';

interface ParametresPageProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface PaymentMethod {
    id: number;
    type: string;
    type_label: string;
    display_name: string;
    beneficiary_name: string;
    is_default: boolean;
    is_active: boolean;
    icon: string;
    color: string;
    mobile_operator?: string;
    mobile_number?: string;
    card_last4?: string;
    card_brand?: string;
    bank_name?: string;
    bank_account_number?: string;
}

const ParametresPage: React.FC<ParametresPageProps> = ({ notify }) => {
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<any>(null);
    const [notifications, setNotifications] = useState({
        email_notifications: true,
        payment_reminders: true,
        lease_expiry: true,
        maintenance: true,
        newsletter: false,
    });
    const [preferences, setPreferences] = useState({
        language: 'fr',
        date_format: 'dd/mm/yyyy',
        time_format: '24h',
        dark_mode: false,
    });
    const [security, setSecurity] = useState({
        two_factor_enabled: false,
        last_password_change_days: 3,
    });
    const [advanced, setAdvanced] = useState({
        auto_backup: true,
        classic_mode: false,
    });
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [newPaymentMethod, setNewPaymentMethod] = useState({
        type: 'mobile_money',
        beneficiary_name: '',
        mobile_operator: 'MTN',
        mobile_number: '',
        card_last4: '',
        card_brand: 'Visa',
        bank_name: '',
        bank_account_number: '',
        is_default: false,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/settings');
            const data = response.data;
            setSettings(data);
            setNotifications(data.notifications);
            setPreferences({
                language: data.preferences.language,
                date_format: data.preferences.date_format,
                time_format: data.preferences.time_format || '24h',
                dark_mode: data.preferences.dark_mode,
            });
            setSecurity({
                two_factor_enabled: data.security.two_factor_enabled,
                last_password_change_days: data.security.last_password_change_days,
            });
            setAdvanced(data.advanced);
            setPaymentMethods(data.payment_methods || []);
        } catch (error: any) {
            console.error('❌ Erreur chargement paramètres:', error);
            notify(error.response?.data?.message || 'Erreur lors du chargement des paramètres', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateNotifications = async (field: string, value: boolean) => {
        try {
            const updated = { ...notifications, [field]: value };
            await api.put('/settings/notifications', updated);
            setNotifications(updated);
            notify('Préférences de notifications mises à jour', 'success');
        } catch (error: any) {
            notify(error.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const updatePreferences = async (field: string, value: any) => {
        try {
            const updated = { ...preferences, [field]: value };
            
            // Correction: s'assurer que le format de date est valide
            if (field === 'date_format') {
                // Convertir le format pour le backend
                let backendFormat = value;
                if (value === 'dd/mm/yyyy') backendFormat = 'd/m/Y';
                if (value === 'mm/dd/yyyy') backendFormat = 'm/d/Y';
                if (value === 'yyyy-mm-dd') backendFormat = 'Y-m-d';
                
                await api.put('/settings/preferences', { 
                    ...updated,
                    date_format: backendFormat 
                });
            } else if (field === 'dark_mode') {
                await api.put('/settings/preferences', { dark_mode: value });
            } else if (field === 'language') {
                await api.put('/settings/preferences', { language: value });
            } else if (field === 'time_format') {
                await api.put('/settings/preferences', { time_format: value });
            } else {
                await api.put('/settings/preferences', updated);
            }
            
            setPreferences(updated);
            
            if (field === 'dark_mode') {
                if (value) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
            
            notify('Préférences mises à jour', 'success');
        } catch (error: any) {
            console.error('❌ Erreur mise à jour préférences:', error);
            notify(error.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const updatePassword = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
        if (newPassword !== confirmPassword) {
            notify('Les mots de passe ne correspondent pas', 'error');
            return false;
        }
        
        try {
            await api.put('/settings/password', {
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword,
            });
            notify('Mot de passe modifié avec succès', 'success');
            return true;
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
            notify(message, 'error');
            return false;
        }
    };

    const toggleTwoFactor = async () => {
        try {
            if (security.two_factor_enabled) {
                await api.post('/settings/2fa/disable');
                setSecurity({ ...security, two_factor_enabled: false });
                notify('Authentification à deux facteurs désactivée', 'success');
            } else {
                const response = await api.post('/settings/2fa/enable');
                const { secret, recovery_codes } = response.data;
                setSecurity({ ...security, two_factor_enabled: true });
                notify(`2FA activée - Secret: ${secret} - Codes: ${recovery_codes.join(', ')}`, 'success');
            }
        } catch (error: any) {
            notify(error.response?.data?.message || 'Erreur lors de l\'activation/désactivation 2FA', 'error');
        }
    };

    const updateAdvanced = async (field: string, value: boolean) => {
        try {
            const updated = { ...advanced, [field]: value };
            await api.put('/settings/advanced', updated);
            setAdvanced(updated);
            notify('Paramètres avancés mis à jour', 'success');
        } catch (error: any) {
            notify(error.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const addPaymentMethod = async () => {
        try {
            const payload: any = {
                type: newPaymentMethod.type,
                beneficiary_name: newPaymentMethod.beneficiary_name,
                is_default: newPaymentMethod.is_default,
            };
            
            switch (newPaymentMethod.type) {
                case 'mobile_money':
                    payload.mobile_operator = newPaymentMethod.mobile_operator;
                    payload.mobile_number = newPaymentMethod.mobile_number;
                    break;
                case 'card':
                    payload.card_last4 = newPaymentMethod.card_last4;
                    payload.card_brand = newPaymentMethod.card_brand;
                    break;
                case 'bank_transfer':
                    payload.bank_name = newPaymentMethod.bank_name;
                    payload.bank_account_number = newPaymentMethod.bank_account_number;
                    break;
            }
            
            const response = await api.post('/settings/payment-method/add', payload);
            setPaymentMethods([...paymentMethods, response.data.data]);
            setShowPaymentModal(false);
            setNewPaymentMethod({
                type: 'mobile_money',
                beneficiary_name: '',
                mobile_operator: 'MTN',
                mobile_number: '',
                card_last4: '',
                card_brand: 'Visa',
                bank_name: '',
                bank_account_number: '',
                is_default: false,
            });
            notify('Méthode de paiement ajoutée avec succès', 'success');
        } catch (error: any) {
            const message = error.response?.data?.message || 'Erreur lors de l\'ajout';
            notify(message, 'error');
        }
    };

    const deletePaymentMethod = async (id: number) => {
        if (!confirm('Supprimer cette méthode de paiement ?')) return;
        
        try {
            await api.delete(`/settings/payment-method/${id}`);
            setPaymentMethods(paymentMethods.filter(m => m.id !== id));
            notify('Méthode de paiement supprimée', 'success');
        } catch (error: any) {
            notify(error.response?.data?.message || 'Erreur lors de la suppression', 'error');
        }
    };

    const setDefaultPaymentMethod = async (id: number) => {
        try {
            await api.put(`/settings/payment-method/${id}/set-default`);
            setPaymentMethods(paymentMethods.map(m => ({
                ...m,
                is_default: m.id === id
            })));
            notify('Méthode par défaut mise à jour', 'success');
        } catch (error: any) {
            notify(error.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
        }
    };

    const exportData = async () => {
        try {
            const response = await api.get('/settings/export-data', {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `export_landlord_${new Date().toISOString().slice(0, 19)}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            notify('Export des données réussi', 'success');
        } catch (error: any) {
            notify(error.response?.data?.message || 'Erreur lors de l\'export', 'error');
        }
    };

    const deactivateAccount = async () => {
        const password = prompt('Pour désactiver votre compte, veuillez entrer votre mot de passe:');
        if (!password) return;
        
        try {
            await api.post('/settings/deactivate', { password });
            localStorage.removeItem('token');
            window.location.href = '/login';
        } catch (error: any) {
            notify(error.response?.data?.message || 'Erreur lors de la désactivation', 'error');
        }
    };

    const deleteAccount = async () => {
        const confirmText = prompt('ATTENTION : Cette action est irréversible. Pour confirmer, tapez "SUPPRIMER"');
        if (confirmText !== 'SUPPRIMER') return;
        
        const password = prompt('Veuillez entrer votre mot de passe pour confirmer:');
        if (!password) return;
        
        try {
            await api.delete('/settings/account', {
                data: { password, confirmation: 'SUPPRIMER' }
            });
            localStorage.removeItem('token');
            window.location.href = '/login';
        } catch (error: any) {
            notify(error.response?.data?.message || 'Erreur lors de la suppression', 'error');
        }
    };

    const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
        <div onClick={() => onChange(!checked)} className={`toggle-switch ${checked ? 'active' : ''}`}>
            <div className="toggle-knob"></div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Manrope:wght@400;500;600;700;800&display=swap');
                
                .sp-page {
                    padding: 1.5rem 1rem 3rem;
                    font-family: 'Manrope', sans-serif;
                    color: #1a1a1a;
                    width: 100%;
                    box-sizing: border-box;
                    max-width: 100%;
                }
                
                .sp-section {
                    background: #fff;
                    border: 1.5px solid #e5e7eb;
                    border-radius: 20px;
                    padding: 1.8rem;
                    margin-bottom: 1.5rem;
                }
                
                .sp-section-title {
                    font-family: 'Merriweather', serif;
                    font-size: 1.4rem;
                    font-weight: 800;
                    margin: 0 0 6px 0;
                }
                
                .sp-section-sub {
                    font-size: 0.95rem;
                    color: #9ca3af;
                    margin: 0 0 22px 0;
                }
                
                .sp-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 0;
                    border-bottom: 1px solid #f3f4f6;
                }
                
                .sp-row:last-child {
                    border-bottom: none;
                }
                
                .sp-row-left {
                    flex: 1;
                }
                
                .sp-row-label {
                    font-size: 1rem;
                    font-weight: 700;
                    margin: 0 0 4px 0;
                }
                
                .sp-row-desc {
                    font-size: 0.85rem;
                    color: #9ca3af;
                    margin: 0;
                }
                
                .sp-row-action {
                    font-size: 0.9rem;
                    font-weight: 700;
                    color: #83C757;
                    cursor: pointer;
                    background: none;
                    border: none;
                    font-family: 'Manrope', sans-serif;
                    text-decoration: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    transition: background 0.2s;
                }
                
                .sp-row-action:hover {
                    background: #f0fdf4;
                }
                
                .sp-row-action.red {
                    color: #ef4444;
                }
                
                .sp-row-action.red:hover {
                    background: #fef2f2;
                }
                
                .sp-select {
                    padding: 0.65rem 1rem;
                    border: 1.5px solid #d1d5db;
                    border-radius: 12px;
                    font-size: 0.95rem;
                    font-family: 'Manrope', sans-serif;
                    font-weight: 500;
                    color: #1f2937;
                    background: #fff;
                    outline: none;
                    min-width: 180px;
                    cursor: pointer;
                }
                
                .sp-select:focus {
                    border-color: #83C757;
                    box-shadow: 0 0 0 2px rgba(131, 199, 87, 0.2);
                }
                
                .sp-info-banner {
                    background: #f0fdf4;
                    border: 1.5px solid #83C757;
                    border-radius: 14px;
                    padding: 14px 20px;
                    font-size: 0.9rem;
                    color: #166534;
                    margin-top: 14px;
                }
                
                .sp-danger {
                    background: #fff;
                    border: 1.5px solid #fecaca;
                    border-radius: 20px;
                    padding: 1.8rem;
                    margin-bottom: 1.5rem;
                }
                
                .sp-danger-title {
                    font-family: 'Merriweather', serif;
                    font-size: 1.3rem;
                    font-weight: 800;
                    color: #ef4444;
                    margin: 0 0 6px 0;
                }
                
                .sp-danger-sub {
                    font-size: 0.9rem;
                    color: #9ca3af;
                    margin: 0 0 22px 0;
                }
                
                .sp-btn-outline-danger {
                    background: #fff;
                    border: 1.5px solid #ef4444;
                    color: #ef4444;
                    border-radius: 12px;
                    padding: 10px 22px;
                    font-family: 'Manrope', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .sp-btn-outline-danger:hover {
                    background: #ef4444;
                    color: #fff;
                }
                
                .sp-btn-danger {
                    background: #ef4444;
                    border: none;
                    color: #fff;
                    border-radius: 12px;
                    padding: 10px 22px;
                    font-family: 'Manrope', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .sp-btn-danger:hover {
                    background: #dc2626;
                }
                
                .toggle-switch {
                    width: 52px;
                    height: 28px;
                    border-radius: 14px;
                    cursor: pointer;
                    position: relative;
                    transition: background 0.2s;
                    flex-shrink: 0;
                    background: #d1d5db;
                }
                
                .toggle-switch.active {
                    background: #83C757;
                }
                
                .toggle-switch .toggle-knob {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #fff;
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    transition: left 0.2s;
                    box-shadow: 0 1px 3px rgba(0,0,0,.15);
                }
                
                .toggle-switch.active .toggle-knob {
                    left: 26px;
                }
                
                .payment-method-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #f9fafb;
                    border-radius: 12px;
                    margin-bottom: 8px;
                }
                
                .payment-method-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                }
                
                .payment-method-info {
                    flex: 1;
                }
                
                .payment-method-name {
                    font-weight: 700;
                    font-size: 0.9rem;
                    margin: 0;
                }
                
                .payment-method-details {
                    font-size: 0.75rem;
                    color: #6b7280;
                    margin: 2px 0 0;
                }
                
                .payment-method-badge {
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 20px;
                    background: #e5e7eb;
                    color: #374151;
                }
                
                .payment-method-badge.default {
                    background: #83C757;
                    color: white;
                }
                
                .sp-row-info {
                    background: #f9fafb;
                    border-radius: 12px;
                    padding: 0.75rem 1rem;
                    margin-top: 0.75rem;
                    font-size: 0.85rem;
                    color: #4b5563;
                }
                
                /* Styles pour les inputs en fond blanc (même en mode sombre) */
                .dark-mode .sp-select,
                .dark-mode input,
                .dark-mode textarea,
                .dark-mode select:not(.sp-select) {
                    background: #ffffff !important;
                    color: #1f2937 !important;
                    border-color: #d1d5db !important;
                }
                
                .dark-mode .sp-select option {
                    background: #ffffff !important;
                    color: #1f2937 !important;
                }
                
                /* Modal styles - fond blanc pour les inputs */
                .modal-input {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1.5px solid #d1d5db;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-family: 'Manrope', sans-serif;
                    background: #ffffff !important;
                    color: #1f2937 !important;
                    outline: none;
                }
                
                .modal-input:focus {
                    border-color: #83C757;
                    box-shadow: 0 0 0 2px rgba(131, 199, 87, 0.2);
                }
                
                .modal-select {
                    width: 100%;
                    padding: 0.75rem;
                    border: 1.5px solid #d1d5db;
                    border-radius: 12px;
                    font-size: 0.9rem;
                    font-family: 'Manrope', sans-serif;
                    background: #ffffff !important;
                    color: #1f2937 !important;
                    outline: none;
                    cursor: pointer;
                }
                
                .dark-mode .sp-section {
                    background: #1f2937;
                    border-color: #374151;
                }
                
                .dark-mode .sp-section-title {
                    color: #f3f4f6;
                }
                
                .dark-mode .sp-row-label {
                    color: #e5e7eb;
                }
                
                .dark-mode .sp-row-desc {
                    color: #9ca3af;
                }
                
                .dark-mode .payment-method-card {
                    background: #111827;
                }
                
                .dark-mode .payment-method-name {
                    color: #f3f4f6;
                }
            `}</style>
            
            <div className={`sp-page ${preferences.dark_mode ? 'dark-mode' : ''}`}>
                <div className="max-w-4xl mx-auto">
                    {/* Notifications */}
                    <div className="sp-section">
                        <p className="sp-section-title">Préférences de notifications</p>
                        <p className="sp-section-sub">Choisissez comment vous souhaitez être notifié</p>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Notifications par email</p>
                                <p className="sp-row-desc">Recevez les notifications importantes par email</p>
                            </div>
                            <Toggle checked={notifications.email_notifications} onChange={(v) => updateNotifications('email_notifications', v)} />
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Rappels de paiements</p>
                                <p className="sp-row-desc">Alertes pour les loyers à recevoir</p>
                            </div>
                            <Toggle checked={notifications.payment_reminders} onChange={(v) => updateNotifications('payment_reminders', v)} />
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Échéance de bail</p>
                                <p className="sp-row-desc">Notifications avant les renouvellements de baux</p>
                            </div>
                            <Toggle checked={notifications.lease_expiry} onChange={(v) => updateNotifications('lease_expiry', v)} />
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Travaux et réparations</p>
                                <p className="sp-row-desc">Alertes pour les interventions</p>
                            </div>
                            <Toggle checked={notifications.maintenance} onChange={(v) => updateNotifications('maintenance', v)} />
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Newsletter mensuelle</p>
                                <p className="sp-row-desc">Conseils et actualités de la gestion locative</p>
                            </div>
                            <Toggle checked={notifications.newsletter} onChange={(v) => updateNotifications('newsletter', v)} />
                        </div>
                    </div>

                    {/* Méthodes de paiement */}
                    <div className="sp-section">
                        <p className="sp-section-title">Moyens de paiement</p>
                        <p className="sp-section-sub">Gérez vos méthodes de paiement</p>

                        {paymentMethods.length > 0 ? (
                            paymentMethods.map((method) => (
                                <div key={method.id} className="payment-method-card">
                                    <div className="payment-method-icon" style={{ background: `${method.color}20` }}>
                                        <i className={method.icon} style={{ color: method.color }}></i>
                                    </div>
                                    <div className="payment-method-info">
                                        <p className="payment-method-name">{method.display_name}</p>
                                        <p className="payment-method-details">{method.beneficiary_name}</p>
                                    </div>
                                    <div>
                                        {method.is_default ? (
                                            <span className="payment-method-badge default">Par défaut</span>
                                        ) : (
                                            <button className="sp-row-action" style={{ fontSize: '0.8rem' }} onClick={() => setDefaultPaymentMethod(method.id)}>
                                                Définir par défaut
                                            </button>
                                        )}
                                        <button className="sp-row-action red" style={{ fontSize: '0.8rem' }} onClick={() => deletePaymentMethod(method.id)}>
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="sp-row-info">Aucune méthode de paiement enregistrée.</div>
                        )}

                        <div className="sp-row" style={{ borderTop: '1px solid #e5e7eb', marginTop: '12px', paddingTop: '16px' }}>
                            <button className="sp-row-action" onClick={() => setShowPaymentModal(true)}>+ Ajouter une méthode de paiement</button>
                        </div>
                    </div>

                    {/* Apparence */}
                    <div className="sp-section">
                        <p className="sp-section-title">Apparence</p>
                        <p className="sp-section-sub">Personnalisez l'interface de l'application</p>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Thème</p>
                                <p className="sp-row-desc">Choisir le thème de l'application</p>
                            </div>
                            <select 
                                className="sp-select" 
                                value={preferences.dark_mode ? 'dark' : 'light'}
                                onChange={(e) => updatePreferences('dark_mode', e.target.value === 'dark')}
                            >
                                <option value="light">Clair</option>
                                <option value="dark">Sombre</option>
                            </select>
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Langue</p>
                                <p className="sp-row-desc">Langue de l'interface</p>
                            </div>
                            <select 
                                className="sp-select" 
                                value={preferences.language}
                                onChange={(e) => updatePreferences('language', e.target.value)}
                            >
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                            </select>
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Format horaire</p>
                                <p className="sp-row-desc">Format d'affichage des dates et heures</p>
                            </div>
                            <select 
                                className="sp-select" 
                                value={preferences.time_format}
                                onChange={(e) => updatePreferences('time_format', e.target.value)}
                            >
                                <option value="24h">24h (19:00)</option>
                                <option value="12h">12h (07:00 PM)</option>
                            </select>
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Format de date</p>
                                <p className="sp-row-desc">Comment afficher les dates</p>
                            </div>
                            <select 
                                className="sp-select" 
                                value={preferences.date_format}
                                onChange={(e) => updatePreferences('date_format', e.target.value)}
                            >
                                <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                                <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                            </select>
                        </div>
                    </div>

                    {/* Sécurité */}
                    <div className="sp-section">
                        <p className="sp-section-title">Sécurité</p>
                        <p className="sp-section-sub">Protégez votre compte et vos données</p>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Mot de passe</p>
                                <p className="sp-row-desc">Dernière modification il y a {security.last_password_change_days} mois</p>
                            </div>
                            <button className="sp-row-action" onClick={() => setShowPasswordModal(true)}>Changer le mot de passe</button>
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Authentification à deux facteurs</p>
                                <p className="sp-row-desc">Sécurisez davantage votre compte</p>
                            </div>
                            <Toggle checked={security.two_factor_enabled} onChange={toggleTwoFactor} />
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Sessions actives</p>
                                <p className="sp-row-desc">Gérer les appareils connectés</p>
                            </div>
                            <button className="sp-row-action" onClick={() => notify('Liste des sessions actives à venir', 'info')}>Voir les sessions</button>
                        </div>

                        <div className="sp-info-banner">
                            Nous recommandons d'activer l'authentification à deux facteurs pour une sécurité optimale de vos informations.
                        </div>
                    </div>

                    {/* Paramètres avancés */}
                    <div className="sp-section">
                        <p className="sp-section-title">Paramètres avancés</p>
                        <p className="sp-section-sub">Options de configuration avancées</p>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Exporter les données</p>
                                <p className="sp-row-desc">Téléchargez vos données au format JSON</p>
                            </div>
                            <button className="sp-row-action" onClick={exportData}>Exporter</button>
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Sauvegarde automatique</p>
                                <p className="sp-row-desc">Sauvegarder automatiquement mes données</p>
                            </div>
                            <Toggle checked={advanced.auto_backup} onChange={(v) => updateAdvanced('auto_backup', v)} />
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Mode classique</p>
                                <p className="sp-row-desc">Activer les fonctionnalités en développement</p>
                            </div>
                            <Toggle checked={advanced.classic_mode} onChange={(v) => updateAdvanced('classic_mode', v)} />
                        </div>
                    </div>

                    {/* Zone de danger */}
                    <div className="sp-danger">
                        <p className="sp-danger-title">Zone de danger</p>
                        <p className="sp-danger-sub">Ces actions sont irréversibles. Assurez-vous de bien comprendre les conséquences avant de les exécuter.</p>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Désactiver le compte</p>
                                <p className="sp-row-desc">Désactiver temporairement votre compte</p>
                            </div>
                            <button className="sp-btn-outline-danger" onClick={deactivateAccount}>Désactiver</button>
                        </div>

                        <div className="sp-row">
                            <div className="sp-row-left">
                                <p className="sp-row-label">Supprimer le compte</p>
                                <p className="sp-row-desc">Supprimer définitivement votre compte et toutes vos données</p>
                            </div>
                            <button className="sp-btn-danger" onClick={deleteAccount}>Supprimer le compte</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal changement de mot de passe */}
            {showPasswordModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '90%' }}>
                        <h3 style={{ fontFamily: 'Merriweather, serif', fontSize: '1.4rem', margin: '0 0 1rem 0' }}>Changer le mot de passe</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const currentPassword = (form.elements.namedItem('current_password') as HTMLInputElement).value;
                            const newPassword = (form.elements.namedItem('new_password') as HTMLInputElement).value;
                            const confirmPassword = (form.elements.namedItem('new_password_confirmation') as HTMLInputElement).value;
                            const success = await updatePassword(currentPassword, newPassword, confirmPassword);
                            if (success) setShowPasswordModal(false);
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Mot de passe actuel</label>
                                <input type="password" name="current_password" required className="modal-input" />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nouveau mot de passe</label>
                                <input type="password" name="new_password" required className="modal-input" />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Confirmer le nouveau mot de passe</label>
                                <input type="password" name="new_password_confirmation" required className="modal-input" />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '0.6rem 1.2rem', border: '1.5px solid #e5e7eb', background: 'white', borderRadius: '12px', cursor: 'pointer' }}>Annuler</button>
                                <button type="submit" style={{ padding: '0.6rem 1.2rem', background: '#83C757', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Changer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal ajout méthode de paiement */}
            {showPaymentModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
                        <h3 style={{ fontFamily: 'Merriweather, serif', fontSize: '1.4rem', margin: '0 0 1rem 0' }}>Ajouter une méthode de paiement</h3>
                        <form onSubmit={(e) => { e.preventDefault(); addPaymentMethod(); }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Type</label>
                                <select 
                                    className="modal-select"
                                    value={newPaymentMethod.type}
                                    onChange={(e) => {
                                        setNewPaymentMethod({ ...newPaymentMethod, type: e.target.value });
                                        document.getElementById('mobile-money-fields')!.style.display = e.target.value === 'mobile_money' ? 'block' : 'none';
                                        document.getElementById('card-fields')!.style.display = e.target.value === 'card' ? 'block' : 'none';
                                        document.getElementById('bank-fields')!.style.display = e.target.value === 'bank_transfer' ? 'block' : 'none';
                                    }}
                                >
                                    <option value="mobile_money">Mobile Money</option>
                                    <option value="card">Carte bancaire</option>
                                    <option value="bank_transfer">Virement bancaire</option>
                                    <option value="cash">Espèces</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nom du bénéficiaire</label>
                                <input type="text" value={newPaymentMethod.beneficiary_name} onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, beneficiary_name: e.target.value })} required className="modal-input" />
                            </div>
                            <div id="mobile-money-fields">
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Opérateur</label>
                                    <select className="modal-select" value={newPaymentMethod.mobile_operator} onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, mobile_operator: e.target.value })}>
                                        <option value="MTN">MTN</option>
                                        <option value="MOOV">MOOV</option>
                                        <option value="CELTIS">CELTIS</option>
                                        <option value="ORANGE">ORANGE</option>
                                        <option value="WAVE">WAVE</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Numéro de téléphone</label>
                                    <input type="tel" value={newPaymentMethod.mobile_number} onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, mobile_number: e.target.value })} className="modal-input" />
                                </div>
                            </div>
                            <div id="card-fields" style={{ display: 'none' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Marque de la carte</label>
                                    <select className="modal-select" value={newPaymentMethod.card_brand} onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, card_brand: e.target.value })}>
                                        <option value="Visa">Visa</option>
                                        <option value="Mastercard">Mastercard</option>
                                        <option value="American Express">American Express</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>4 derniers chiffres</label>
                                    <input type="text" maxLength={4} value={newPaymentMethod.card_last4} onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, card_last4: e.target.value })} className="modal-input" />
                                </div>
                            </div>
                            <div id="bank-fields" style={{ display: 'none' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nom de la banque</label>
                                    <input type="text" value={newPaymentMethod.bank_name} onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, bank_name: e.target.value })} className="modal-input" />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Numéro de compte</label>
                                    <input type="text" value={newPaymentMethod.bank_account_number} onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, bank_account_number: e.target.value })} className="modal-input" />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                    <input type="checkbox" checked={newPaymentMethod.is_default} onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, is_default: e.target.checked })} /> Définir comme méthode par défaut
                                </label>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: '0.6rem 1.2rem', border: '1.5px solid #e5e7eb', background: 'white', borderRadius: '12px', cursor: 'pointer' }}>Annuler</button>
                                <button type="submit" style={{ padding: '0.6rem 1.2rem', background: '#83C757', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Ajouter</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ParametresPage;