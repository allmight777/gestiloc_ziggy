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
    const [formData, setFormData] = useState<any>({});
    const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'account'>('personal');

    // Charger les données
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            console.log('📁 Chargement du profil propriétaire...');
            
            const data = await landlordService.getSettings();
            console.log('Données reçues:', data);
            
            setProfile(data);
            setFormData({
                first_name: data.user?.first_name || '',
                last_name: data.user?.last_name || '',
                email: data.user?.email || '',
                phone: data.user?.phone || '',
                address: data.user?.address || '',
                company_name: data.user?.company_name || '',
                date_of_birth: data.user?.date_of_birth || '',
                id_number: data.user?.id_number || '',
                license_number: data.user?.license_number || '',
                ifu: data.user?.ifu || '',
                rccm: data.user?.rccm || '',
                vat_number: data.user?.vat_number || '',
                address_billing: data.user?.address_billing || '',
            });
            
            // Mettre à jour le localStorage
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { 
                ...savedUser, 
                first_name: data.user?.first_name,
                last_name: data.user?.last_name,
                phone: data.user?.phone,
                address: data.user?.address
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (err) {
            console.error('❌ Erreur lors du chargement du profil:', err);
            notify('Erreur lors du chargement du profil', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ✅ FONCTION CORRIGÉE - Traite TOUS les champs
    const handleSave = async () => {
        try {
            setSaving(true);
            console.log('💾 Sauvegarde du profil...');
            
            const profileData: any = {};
            
            // === INFORMATIONS PERSONNELLES ===
            if (formData.first_name !== profile?.user?.first_name) {
                profileData.first_name = formData.first_name;
            }
            if (formData.last_name !== profile?.user?.last_name) {
                profileData.last_name = formData.last_name;
            }
            if (formData.phone !== profile?.user?.phone) {
                profileData.phone = formData.phone;
            }
            if (formData.address !== profile?.user?.address) {
                profileData.address = formData.address === '' ? null : formData.address;
            }
            if (formData.date_of_birth !== profile?.user?.date_of_birth) {
                profileData.date_of_birth = formData.date_of_birth === '' ? null : formData.date_of_birth;
            }
            if (formData.id_number !== profile?.user?.id_number) {
                profileData.id_number = formData.id_number === '' ? null : formData.id_number;
            }
            
            // === INFORMATIONS PROFESSIONNELLES ===
            // Ces champs ne sont modifiables que pour les professionnels et agences
            const canEditProfessional = profile?.user?.is_professional || profile?.user?.co_owner_type === 'agency';
            
            if (canEditProfessional) {
                if (formData.company_name !== profile?.user?.company_name) {
                    profileData.company_name = formData.company_name === '' ? null : formData.company_name;
                }
                if (formData.license_number !== profile?.user?.license_number) {
                    profileData.license_number = formData.license_number === '' ? null : formData.license_number;
                }
                if (formData.ifu !== profile?.user?.ifu) {
                    profileData.ifu = formData.ifu === '' ? null : formData.ifu;
                }
                if (formData.rccm !== profile?.user?.rccm) {
                    profileData.rccm = formData.rccm === '' ? null : formData.rccm;
                }
                if (formData.vat_number !== profile?.user?.vat_number) {
                    profileData.vat_number = formData.vat_number === '' ? null : formData.vat_number;
                }
                if (formData.address_billing !== profile?.user?.address_billing) {
                    profileData.address_billing = formData.address_billing === '' ? null : formData.address_billing;
                }
            }
            
            // Vérifier si des modifications ont été faites
            if (Object.keys(profileData).length === 0) {
                setIsEditing(false);
                notify('Aucune modification détectée', 'info');
                setSaving(false);
                return;
            }
            
            console.log('📤 Données envoyées au serveur:', profileData);
            
            const response = await landlordService.updateProfile(profileData);
            
            console.log('✅ Profil sauvegardé:', response);
            
            // Mettre à jour le profil local avec toutes les modifications
            setProfile((prev: any) => ({
                ...prev,
                user: {
                    ...prev?.user,
                    ...profileData
                }
            }));
            
            // Mettre à jour le formData avec les nouvelles valeurs
            setFormData((prev: any) => ({
                ...prev,
                ...profileData
            }));
            
            // Mettre à jour le localStorage
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { 
                ...savedUser, 
                ...profileData
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
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
        // Réinitialiser avec les données du profil
        setFormData({
            first_name: profile?.user?.first_name || '',
            last_name: profile?.user?.last_name || '',
            email: profile?.user?.email || '',
            phone: profile?.user?.phone || '',
            address: profile?.user?.address || '',
            company_name: profile?.user?.company_name || '',
            date_of_birth: profile?.user?.date_of_birth || '',
            id_number: profile?.user?.id_number || '',
            license_number: profile?.user?.license_number || '',
            ifu: profile?.user?.ifu || '',
            rccm: profile?.user?.rccm || '',
            vat_number: profile?.user?.vat_number || '',
            address_billing: profile?.user?.address_billing || '',
        });
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
    const canEditProfessional = isProfessional || isAgency;

    if (loading) {
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
                <button 
                    onClick={fetchProfile} 
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-[#70AE48] to-[#8BC34A] hover:from-[#5d8f3a] hover:to-[#70AE48] text-white rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
                >
                    Réessayer
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in p-6 max-w-7xl mx-auto">
            {/* Header avec boutons d'action */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Mon compte
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Gérez vos informations personnelles et professionnelles
                    </p>
                </div>
                <div className="flex gap-3">
                    {!isEditing ? (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-[#70AE48] hover:bg-[#5d8f3a] text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
                        >
                            <Edit2 className="w-4 h-4" />
                            Modifier le profil
                        </button>
                    ) : (
                        <div className="flex gap-3 animate-slide-up">
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 font-medium"
                            >
                                <X className="w-4 h-4" />
                                Annuler
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#70AE48] to-[#8BC34A] hover:from-[#5d8f3a] hover:to-[#70AE48] text-white rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 font-medium"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Onglets de navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.first_name || ''}
                                                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                    placeholder="Votre prénom"
                                                />
                                            ) : (
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                                    <p className="text-gray-900 font-medium">{profile.user?.first_name || '—'}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.last_name || ''}
                                                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                    placeholder="Votre nom"
                                                />
                                            ) : (
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                                    <p className="text-gray-900 font-medium">{profile.user?.last_name || '—'}</p>
                                                </div>
                                            )}
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
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                value={formData.date_of_birth || ''}
                                                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <p className="text-gray-900">{formatDate(profile.user?.date_of_birth)}</p>
                                            </div>
                                        )}
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
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={formData.id_number || ''}
                                                onChange={(e) => handleInputChange('id_number', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                placeholder="Numéro de carte d'identité"
                                            />
                                        ) : (
                                            <div className="p-3 bg-white border border-gray-200 rounded-xl">
                                                <p className="text-gray-900">{profile.user?.id_number || '—'}</p>
                                            </div>
                                        )}
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
                                                <p className="text-gray-900 font-medium">{profile.user?.email || '—'}</p>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Téléphone
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="tel"
                                                    value={formData.phone || ''}
                                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                    placeholder="+229 XX XX XX XX"
                                                />
                                            ) : (
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                                                    <Phone className="w-4 h-4 text-gray-400" />
                                                    <p className="text-gray-900 font-medium">{profile.user?.phone || '—'}</p>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Adresse
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={formData.address || ''}
                                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                    placeholder="Votre adresse complète"
                                                />
                                            ) : (
                                                <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                    <p className="text-gray-900">{profile.user?.address || '—'}</p>
                                                </div>
                                            )}
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
                                    
                                    {!canEditProfessional && (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                            <Lock className="w-3 h-3" />
                                            Lecture seule
                                        </div>
                                    )}
                                </div>
                                
                                {!canEditProfessional && isEditing && (
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
                                        {isEditing && canEditProfessional ? (
                                            <input
                                                type="text"
                                                value={formData.company_name || ''}
                                                onChange={(e) => handleInputChange('company_name', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                placeholder="Nom de l'entreprise"
                                            />
                                        ) : (
                                            <div className={`p-3 border border-gray-200 rounded-xl ${!canEditProfessional && !isEditing ? 'bg-gray-50' : 'bg-white'}`}>
                                                <p className="text-gray-900">{profile.user?.company_name || '—'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Adresse de facturation
                                        </label>
                                        {isEditing && canEditProfessional ? (
                                            <input
                                                type="text"
                                                value={formData.address_billing || ''}
                                                onChange={(e) => handleInputChange('address_billing', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                placeholder="Adresse de facturation"
                                            />
                                        ) : (
                                            <div className={`p-3 border border-gray-200 rounded-xl ${!canEditProfessional && !isEditing ? 'bg-gray-50' : 'bg-white'}`}>
                                                <p className="text-gray-900">{profile.user?.address_billing || '—'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Numéro de licence
                                        </label>
                                        {isEditing && canEditProfessional ? (
                                            <input
                                                type="text"
                                                value={formData.license_number || ''}
                                                onChange={(e) => handleInputChange('license_number', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                placeholder="Numéro de licence"
                                            />
                                        ) : (
                                            <div className={`p-3 border border-gray-200 rounded-xl ${!canEditProfessional && !isEditing ? 'bg-gray-50' : 'bg-white'}`}>
                                                <p className="text-gray-900">{profile.user?.license_number || '—'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            IFU
                                        </label>
                                        {isEditing && canEditProfessional ? (
                                            <input
                                                type="text"
                                                value={formData.ifu || ''}
                                                onChange={(e) => handleInputChange('ifu', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                placeholder="Numéro IFU"
                                            />
                                        ) : (
                                            <div className={`p-3 border border-gray-200 rounded-xl ${!canEditProfessional && !isEditing ? 'bg-gray-50' : 'bg-white'}`}>
                                                <p className="text-gray-900">{profile.user?.ifu || '—'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            RCCM
                                        </label>
                                        {isEditing && canEditProfessional ? (
                                            <input
                                                type="text"
                                                value={formData.rccm || ''}
                                                onChange={(e) => handleInputChange('rccm', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                placeholder="Numéro RCCM"
                                            />
                                        ) : (
                                            <div className={`p-3 border border-gray-200 rounded-xl ${!canEditProfessional && !isEditing ? 'bg-gray-50' : 'bg-white'}`}>
                                                <p className="text-gray-900">{profile.user?.rccm || '—'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Numéro TVA
                                        </label>
                                        {isEditing && canEditProfessional ? (
                                            <input
                                                type="text"
                                                value={formData.vat_number || ''}
                                                onChange={(e) => handleInputChange('vat_number', e.target.value)}
                                                className="w-full px-4 py-2.5 bg-white text-gray-900 border border-green-300 rounded-xl focus:ring-2 focus:ring-[#70AE48] focus:border-[#70AE48] transition-all duration-200"
                                                placeholder="Numéro TVA"
                                            />
                                        ) : (
                                            <div className={`p-3 border border-gray-200 rounded-xl ${!canEditProfessional && !isEditing ? 'bg-gray-50' : 'bg-white'}`}>
                                                <p className="text-gray-900">{profile.user?.vat_number || '—'}</p>
                                            </div>
                                        )}
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
                                            <p className="text-gray-900 font-medium">{profile.user?.email || '—'}</p>
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

            {/* Message d'état en édition */}
            {isEditing && (
                <div className="fixed bottom-6 right-6 animate-slide-up z-50">
                    <div className="bg-gradient-to-r from-[#70AE48] to-[#8BC34A] text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3">
                        <Edit2 className="w-5 h-5 animate-pulse" />
                        <div>
                            <p className="font-medium text-white">Mode édition activé</p>
                            <p className="text-sm text-green-100">N'oubliez pas d'enregistrer vos modifications</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonCompte;