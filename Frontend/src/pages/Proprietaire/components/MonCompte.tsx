import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Edit2,
  Save,
  X,
  Shield,
  Briefcase,
  CheckCircle,
  AlertCircle,
  CreditCard,
  FileSignature,
  Building2,
  Lock,
  Globe
} from 'lucide-react';
import { landlordService } from '@/services/api';

interface MonCompteProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const MonCompte: React.FC<MonCompteProps> = ({ notify }) => {
    // États
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'account'>('personal');
    const [formData, setFormData] = useState<any>({});

    const [prenom, setPrenom] = useState('');
    const [nom, setNom] = useState('');
    const [email, setEmail] = useState('');
    const [tel, setTel] = useState('');
    const [adresse, setAdresse] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Récupérer les données du localStorage au chargement
    useEffect(() => {
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setPrenom(savedUser.first_name || '');
        setNom(savedUser.last_name || '');
        setEmail(savedUser.email || '');
        setTel(savedUser.phone || '');
        setAdresse(savedUser.address || '');
        setCompanyName(savedUser.company_name || '');
        setBirthDate(savedUser.birth_date || '');
        setIsLoading(false);
    }, []);

    // Charger les dernières données depuis l'API au montage
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setIsLoading(true);
                const data = await landlordService.getSettings();
                console.log('Données reçues:', data);
                
                if (data.user) {
                    const u = data.user;
                    setPrenom(u.first_name || '');
                    setNom(u.last_name || '');
                    setEmail(u.email || '');
                    setTel(u.phone || '');
                    setAdresse(u.address || '');
                    setCompanyName(u.company_name || '');
                    setBirthDate(u.birth_date || '');
                    
                    // Mettre à jour le localStorage
                    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const updatedUser = { ...currentUser, ...u };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    setProfile(data);
                }
            } catch (err) {
                console.error('Erreur lors du chargement des paramètres:', err);
                // On garde les données du localStorage
                const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
                setProfile({ user: savedUser });
            } finally {
                setIsLoading(false);
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await landlordService.updateProfile({
                first_name: prenom,
                last_name: nom,
                phone: tel,
                address: adresse,
                company_name: companyName,
                birth_date: birthDate
            });
            
            // Mettre à jour le localStorage avec TOUTES les informations
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { 
                ...currentUser, 
                first_name: prenom, 
                last_name: nom, 
                phone: tel,
                address: adresse,
                company_name: companyName,
                birth_date: birthDate
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Mettre à jour le profile state
            setProfile(prev => ({
                ...prev,
                user: {
                    ...prev?.user,
                    first_name: prenom,
                    last_name: nom,
                    phone: tel,
                    address: adresse,
                    company_name: companyName,
                    birth_date: birthDate
                }
            }));
            
            setIsEditing(false);
            notify('Profil mis à jour avec succès', 'success');
        } catch (error: any) {
            console.error('❌ Erreur sauvegarde:', error);
            
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
                
                if (error.response.data?.message) {
                    notify(`Erreur: ${error.response.data.message}`, 'error');
                } else if (error.response.data?.errors) {
                    const errors = Object.values(error.response.data.errors).flat();
                    notify(errors.join(', '), 'error');
                } else {
                    notify(`Erreur ${error.response.status} lors de la sauvegarde`, 'error');
                }
            } else if (error.request) {
                notify('Erreur de connexion au serveur', 'error');
            } else {
                notify('Erreur lors de la mise à jour du profil', 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Recharger les données depuis le localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setPrenom(user.first_name || '');
        setNom(user.last_name || '');
        setEmail(user.email || '');
        setTel(user.phone || '');
        setAdresse(user.address || '');
        setCompanyName(user.company_name || '');
        setBirthDate(user.birth_date || '');
        setIsEditing(false);
        notify('Modifications annulées', 'info');
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Non spécifié';
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return 'Non spécifié';
        }
    };

    // Déterminer le type de compte
    const isProfessional = profile?.user?.is_professional || false;
    const isAgency = profile?.user?.co_owner_type === 'agency';
    const isSimpleUser = !isProfessional && !isAgency;

    if (loading || isLoading) {
        return (
            <div className="space-y-6 animate-fade-in p-6 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-64 mt-2 animate-pulse"></div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-gray-200 rounded-xl w-12 h-12"></div>
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="text-center py-16 animate-fade-in max-w-7xl mx-auto">
                <div className="relative inline-block">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#70AE48] to-[#8BC34A] rounded-full blur-xl opacity-30 animate-pulse"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 animate-slide-up">
                    Profil non trouvé
                </h3>
                <p className="text-gray-600 animate-slide-up delay-75">
                    Impossible de charger les informations du profil.
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Manrope:wght@400;500;600;700;800&display=swap');
                
                @keyframes spin { 
                    to { transform: rotate(360deg); } 
                }
                
                .mc-page { 
                    padding: 1.5rem 1rem 3rem; 
                    font-family: 'Manrope', sans-serif; 
                    color: #1a1a1a; 
                    width: 100%; 
                    box-sizing: border-box; 
                }
                
                .mc-card { 
                    background: #fff; 
                    border: 1.5px solid #e5e7eb; 
                    border-radius: 14px; 
                    padding: 1.5rem 2rem; 
                }
                
                .mc-title { 
                    font-family: 'Merriweather', serif; 
                    font-size: 1.5rem; 
                    font-weight: 800; 
                    margin: 0 0 4px 0; 
                    color: #1a1a1a;
                }
                
                .mc-subtitle { 
                    font-size: 0.9rem; 
                    color: #6b7280; 
                    margin: 0 0 24px 0; 
                }
                
                .mc-photo-row { 
                    display: flex; 
                    align-items: center; 
                    gap: 20px; 
                    padding-bottom: 24px; 
                    border-bottom: 1px solid #f3f4f6; 
                    margin-bottom: 20px; 
                }
                
                .mc-avatar { 
                    width: 70px; 
                    height: 70px; 
                    border-radius: 50%; 
                    background: #70AE48; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    color: #fff; 
                    font-size: 1.8rem; 
                    font-weight: 800; 
                    flex-shrink: 0; 
                }
                
                .mc-photo-info { 
                    flex: 1; 
                }
                
                .mc-photo-label { 
                    font-size: 1rem; 
                    font-weight: 700; 
                    margin: 0 0 2px 0; 
                }
                
                .mc-photo-desc { 
                    font-size: 0.85rem; 
                    color: #9ca3af; 
                    margin: 0; 
                }
                
                .mc-photo-btns { 
                    display: flex; 
                    gap: 10px; 
                }
                
                .mc-btn-outline { 
                    background: #fff; 
                    border: 1.5px solid #d1d5db; 
                    border-radius: 8px; 
                    padding: 8px 20px; 
                    font-family: 'Manrope', sans-serif; 
                    font-size: 0.85rem; 
                    font-weight: 600; 
                    color: #374151; 
                    cursor: pointer; 
                    transition: all 0.2s;
                }
                
                .mc-btn-outline:hover { 
                    background: #f9fafb; 
                    border-color: #9ca3af;
                }
                
                .mc-btn-red { 
                    background: #fef2f2; 
                    border: 1.5px solid #fecaca; 
                    border-radius: 8px; 
                    padding: 8px 20px; 
                    font-family: 'Manrope', sans-serif; 
                    font-size: 0.85rem; 
                    font-weight: 600; 
                    color: #ef4444; 
                    cursor: pointer; 
                    transition: all 0.2s;
                }
                
                .mc-btn-red:hover { 
                    background: #fee2e2; 
                    border-color: #f87171;
                }
                
                .mc-field { 
                    padding: 20px 0; 
                    border-bottom: 1px solid #f3f4f6; 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                }
                
                .mc-field:last-of-type { 
                    border-bottom: none; 
                }
                
                .mc-field-left { 
                    flex: 1; 
                }
                
                .mc-field-label { 
                    font-size: 0.95rem; 
                    font-weight: 700; 
                    margin: 0 0 2px 0; 
                }
                
                .mc-field-desc { 
                    font-size: 0.8rem; 
                    color: #9ca3af; 
                    margin: 0; 
                }
                
                .mc-input { 
                    padding: 0.6rem 1rem; 
                    border: 1.5px solid #d1d5db; 
                    border-radius: 8px; 
                    font-size: 0.9rem; 
                    font-family: 'Manrope', sans-serif; 
                    font-weight: 500; 
                    color: #1a1a1a; 
                    outline: none; 
                    min-width: 300px; 
                    background: #fff; 
                    box-sizing: border-box; 
                    transition: all 0.2s;
                }
                
                .mc-input:focus { 
                    border-color: #70AE48; 
                    box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
                }
                
                .mc-input:read-only { 
                    background-color: #f9fafb; 
                    cursor: not-allowed; 
                }
                
                .mc-actions { 
                    display: flex; 
                    justify-content: flex-end; 
                    gap: 12px; 
                    margin-top: 24px; 
                    padding-top: 20px; 
                    border-top: 1px solid #f3f4f6; 
                }
                
                .mc-btn-cancel { 
                    background: #fff; 
                    border: 1.5px solid #d1d5db; 
                    border-radius: 8px; 
                    padding: 10px 30px; 
                    font-family: 'Manrope', sans-serif; 
                    font-size: 0.9rem; 
                    font-weight: 600; 
                    color: #374151; 
                    cursor: pointer; 
                    transition: all 0.2s;
                }
                
                .mc-btn-cancel:hover { 
                    background: #f9fafb; 
                }
                
                .mc-btn-save { 
                    background: #70AE48; 
                    border: none; 
                    border-radius: 8px; 
                    padding: 10px 30px; 
                    font-family: 'Manrope', sans-serif; 
                    font-size: 0.9rem; 
                    font-weight: 600; 
                    color: #fff; 
                    cursor: pointer; 
                    transition: all 0.2s;
                }
                
                .mc-btn-save:hover { 
                    background: #5a8f3a; 
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(112, 174, 72, 0.3);
                }
                
                .mc-btn-save:disabled { 
                    background: #e5e7eb; 
                    color: #9ca3af; 
                    cursor: not-allowed; 
                    transform: none;
                    box-shadow: none;
                }
                
                @media (max-width: 768px) {
                    .mc-photo-row { 
                        flex-direction: column; 
                        text-align: center; 
                    }
                    .mc-photo-btns { 
                        justify-content: center; 
                    }
                    .mc-field { 
                        flex-direction: column; 
                        align-items: flex-start; 
                        gap: 10px; 
                    }
                    .mc-input { 
                        min-width: 100%; 
                        width: 100%; 
                    }
                    .mc-actions { 
                        flex-direction: column; 
                    }
                    .mc-btn-cancel, 
                    .mc-btn-save { 
                        width: 100%; 
                        text-align: center; 
                    }
                    .mc-card { 
                        padding: 1rem; 
                    }
                }
                
                @media (max-width: 480px) {
                    .mc-page { 
                        padding: 1rem 0.5rem 2rem; 
                    }
                }
            `}</style>
            
            <div className="mc-page">
                <div className="mc-card">
                    <h2 className="mc-title">Mon compte</h2>
                    <p className="mc-subtitle">Gérez vos informations personnelles et vos préférences</p>

                    <div className="mc-photo-row">
                        <div className="mc-avatar">
                            {prenom ? prenom.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div className="mc-photo-info">
                            <p className="mc-photo-label">Photo de profil</p>
                            <p className="mc-photo-desc">Format JPG, PNG ou GIF (max 2MB)</p>
                        </div>
                    </div>

                    <div className="mc-field">
                        <div className="mc-field-left">
                            <p className="mc-field-label">Prénom</p>
                            <p className="mc-field-desc">Votre prénom</p>
                        </div>
                        <input 
                            className="mc-input" 
                            value={prenom} 
                            onChange={e => setPrenom(e.target.value)} 
                            placeholder="Votre prénom"
                        />
                    </div>
                    
                    <div className="mc-field">
                        <div className="mc-field-left">
                            <p className="mc-field-label">Nom</p>
                            <p className="mc-field-desc">Votre nom de famille</p>
                        </div>
                        <input 
                            className="mc-input" 
                            value={nom} 
                            onChange={e => setNom(e.target.value)} 
                            placeholder="Votre nom"
                        />
                    </div>
                    
                    <div className="mc-field">
                        <div className="mc-field-left">
                            <p className="mc-field-label">Adresse email</p>
                            <p className="mc-field-desc">Utilisée pour la connexion et les notifications</p>
                        </div>
                        <input 
                            className="mc-input" 
                            type="email" 
                            value={email} 
                            readOnly 
                        />
                    </div>
                    
                    <div className="mc-field">
                        <div className="mc-field-left">
                            <p className="mc-field-label">Date de naissance</p>
                            <p className="mc-field-desc">Pour attester de votre majorité</p>
                        </div>
                        <input 
                            className="mc-input" 
                            type="date" 
                            value={birthDate} 
                            onChange={e => setBirthDate(e.target.value)} 
                        />
                    </div>
                    
                    <div className="mc-field">
                        <div className="mc-field-left">
                            <p className="mc-field-label">Téléphone</p>
                            <p className="mc-field-desc">Pour les notifications importantes</p>
                        </div>
                        <input 
                            className="mc-input" 
                            type="tel" 
                            value={tel} 
                            onChange={e => setTel(e.target.value)} 
                            placeholder="Votre numéro de téléphone"
                        />
                    </div>
                    
                    <div className="mc-field">
                        <div className="mc-field-left">
                            <p className="mc-field-label">Adresse</p>
                            <p className="mc-field-desc">Votre adresse principale</p>
                        </div>
                        <input 
                            className="mc-input" 
                            value={adresse} 
                            onChange={e => setAdresse(e.target.value)} 
                            placeholder="Votre adresse"
                        />
                    </div>
                    
                    <div className="mc-field">
                        <div className="mc-field-left">
                            <p className="mc-field-label">Nom de l'entreprise</p>
                            <p className="mc-field-desc">Si vous gérez en tant que professionnel</p>
                        </div>
                        <input 
                            className="mc-input" 
                            value={companyName} 
                            onChange={e => setCompanyName(e.target.value)} 
                            placeholder="Nom de l'entreprise (optionnel)"
                        />
                    </div>

                    <div className="mc-actions">
                        <button 
                            className="mc-btn-cancel" 
                            onClick={handleCancel}
                            disabled={saving}
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="mc-btn-save"
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Onglets de navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-6">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('personal')}
                        className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
                            activeTab === 'personal' 
                                ? 'text-[#70AE48] border-b-2 border-[#70AE48] bg-green-50' 
                                : 'text-gray-600 hover:text-[#70AE48] hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <User className="w-4 h-4" />
                            Informations personnelles
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('professional')}
                        className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
                            activeTab === 'professional' 
                                ? 'text-[#70AE48] border-b-2 border-[#70AE48] bg-green-50' 
                                : 'text-gray-600 hover:text-[#70AE48] hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Informations professionnelles
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`flex-1 py-4 px-6 text-center font-medium transition-all duration-200 ${
                            activeTab === 'account' 
                                ? 'text-[#70AE48] border-b-2 border-[#70AE48] bg-green-50' 
                                : 'text-gray-600 hover:text-[#70AE48] hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Compte et sécurité
                        </div>
                    </button>
                </div>

                <div className="p-6">
                    {/* Informations personnelles */}
                    {activeTab === 'personal' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-xl border border-green-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="w-5 h-5 text-[#70AE48]" />
                                        Identité
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Prénom
                                            </label>
                                            <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                                <p className="text-gray-900 font-medium">{prenom || '—'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom
                                            </label>
                                            <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                                <p className="text-gray-900 font-medium">{nom || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-xl border border-green-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-[#70AE48]" />
                                        Informations de naissance
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Date de naissance
                                        </label>
                                        <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <p className="text-gray-900">{formatDate(birthDate)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-xl border border-green-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileSignature className="w-5 h-5 text-[#70AE48]" />
                                        Pièce d'identité
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Numéro d'identité
                                        </label>
                                        <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                            <p className="text-gray-900">{profile.user?.id_number || '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-gradient-to-r from-green-50 to-white p-4 rounded-xl border border-green-100">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Mail className="w-5 h-5 text-[#70AE48]" />
                                        Contact
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email
                                            </label>
                                            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <p className="text-gray-900 font-medium">{email || '—'}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Téléphone
                                            </label>
                                            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <p className="text-gray-900 font-medium">{tel || '—'}</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Adresse
                                            </label>
                                            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <p className="text-gray-900">{adresse || '—'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Informations professionnelles */}
                    {activeTab === 'professional' && (
                        <div className="animate-fade-in">
                            <div className="bg-gradient-to-r from-green-50 to-white p-6 rounded-xl border border-green-100 mb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-2">
                                        {isAgency ? (
                                            <Building2 className="w-5 h-5 text-[#70AE48]" />
                                        ) : (
                                            <Briefcase className="w-5 h-5 text-[#70AE48]" />
                                        )}
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {isAgency ? "Informations de l'agence" : 'Informations professionnelles'}
                                        </h3>
                                    </div>
                                    
                                    {isSimpleUser && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                            <Lock className="w-3 h-3" />
                                            Lecture seule
                                        </div>
                                    )}
                                </div>
                                
                                {isSimpleUser && (
                                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-[#70AE48] mt-0.5" />
                                            <div>
                                                <p className="font-medium text-[#70AE48]">
                                                    Informations professionnelles non modifiables
                                                </p>
                                                <p className="text-sm text-[#70AE48] mt-1">
                                                    En tant que particulier, vous ne pouvez pas modifier les informations professionnelles.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nom de l'entreprise
                                        </label>
                                        <div className={`p-3 border border-gray-200 rounded-xl ${isSimpleUser ? 'bg-gray-50' : 'bg-white'}`}>
                                            <p className="text-gray-900">{companyName || '—'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Adresse de facturation
                                        </label>
                                        <div className={`p-3 border border-gray-200 rounded-xl ${isSimpleUser ? 'bg-gray-50' : 'bg-white'}`}>
                                            <p className="text-gray-900">{profile.user?.address_billing || '—'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Numéro de licence
                                        </label>
                                        <div className={`p-3 border border-gray-200 rounded-xl ${isSimpleUser ? 'bg-gray-50' : 'bg-white'}`}>
                                            <p className="text-gray-900">{profile.user?.license_number || '—'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            IFU
                                        </label>
                                        <div className={`p-3 border border-gray-200 rounded-xl ${isSimpleUser ? 'bg-gray-50' : 'bg-white'}`}>
                                            <p className="text-gray-900">{profile.user?.ifu || '—'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            RCCM
                                        </label>
                                        <div className={`p-3 border border-gray-200 rounded-xl ${isSimpleUser ? 'bg-gray-50' : 'bg-white'}`}>
                                            <p className="text-gray-900">{profile.user?.rccm || '—'}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Numéro TVA
                                        </label>
                                        <div className={`p-3 border border-gray-200 rounded-xl ${isSimpleUser ? 'bg-gray-50' : 'bg-white'}`}>
                                            <p className="text-gray-900">{profile.user?.vat_number || '—'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-white rounded-xl border border-green-200">
                                    <div className="flex items-center gap-3">
                                        <Shield className="w-5 h-5 text-[#70AE48]" />
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Statut: {isAgency ? 'Agence Immobilière' : isProfessional ? 'Professionnel' : 'Particulier'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {isAgency 
                                                    ? 'Vous êtes enregistré en tant qu\'agence immobilière' 
                                                    : isProfessional
                                                        ? 'Vous êtes enregistré en tant que professionnel' 
                                                        : 'Vous êtes enregistré en tant que particulier'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Informations du compte */}
                    {activeTab === 'account' && (
                        <div className="animate-fade-in">
                            <div className="bg-gradient-to-r from-green-50 to-white p-6 rounded-xl border border-green-100">
                                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-[#70AE48]" />
                                    Informations du compte
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                                        <p className="text-sm text-gray-600 mb-2">Email</p>
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            <p className="text-gray-900 font-medium">{email || '—'}</p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                                        <p className="text-sm text-gray-600 mb-2">Email vérifié</p>
                                        <div className="flex items-center gap-3">
                                            {profile.user?.email_verified_at ? (
                                                <>
                                                    <div className="relative">
                                                        <CheckCircle className="w-5 h-5 text-[#70AE48]" />
                                                        <div className="absolute inset-0 bg-[#70AE48] rounded-full blur-sm animate-ping opacity-75"></div>
                                                    </div>
                                                    <span className="text-[#70AE48] font-medium">Vérifié</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="w-5 h-5 text-amber-500 animate-pulse" />
                                                    <span className="text-amber-600 font-medium">En attente</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                                        <p className="text-sm text-gray-600 mb-2">Date d'inscription</p>
                                        <p className="text-gray-900 font-medium">{formatDate(profile.user?.created_at)}</p>
                                    </div>

                                    <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                                        <p className="text-sm text-gray-600 mb-2">Dernière connexion</p>
                                        <p className="text-gray-900 font-medium">{formatDate(profile.user?.last_login_at)}</p>
                                    </div>

                                    <div className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
                                        <p className="text-sm text-gray-600 mb-2">Rôle</p>
                                        <p className="text-gray-900 font-medium capitalize">
                                            Propriétaire
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-white rounded-xl border border-green-200">
                                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                                        <FileSignature className="w-4 h-4 text-[#70AE48]" />
                                        Sécurité du compte
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        Pour des raisons de sécurité, certaines modifications nécessitent une vérification supplémentaire.
                                    </p>
                                    <button 
                                        className="mt-3 px-6 py-2 border border-green-200 text-[#70AE48] hover:bg-green-50 rounded-xl transition-all font-medium"
                                        onClick={() => notify('Fonctionnalité en développement', 'info')}
                                    >
                                        Modifier le mot de passe
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MonCompte;