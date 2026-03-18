import React, { useState, useEffect } from 'react';
import { landlordService } from '@/services/api';

interface MonCompteProps {
    notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const MonCompte: React.FC<MonCompteProps> = ({ notify }) => {
    // Récupération initiale depuis le localStorage pour un affichage immédiat
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

    const [prenom, setPrenom] = useState(savedUser.first_name || '');
    const [nom, setNom] = useState(savedUser.last_name || '');
    const [email, setEmail] = useState(savedUser.email || '');
    const [tel, setTel] = useState(savedUser.phone || '');
    const [adresse, setAdresse] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

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
                    
                    // Mettre à jour le localStorage
                    const updatedUser = { ...savedUser, ...u };
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            } catch (err) {
                console.error('Erreur lors du chargement des paramètres:', err);
                // On garde les données du localStorage
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await landlordService.updateProfile({
                first_name: prenom,
                last_name: nom,
                phone: tel,
                address: adresse,
                company_name: companyName
            });
            
            // Mettre à jour le localStorage
            const updatedUser = { 
                ...savedUser, 
                first_name: prenom, 
                last_name: nom, 
                phone: tel
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            notify('Profil mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
            notify('Erreur lors de la mise à jour du profil', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Recharger les données depuis le localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setPrenom(user.first_name || '');
        setNom(user.last_name || '');
        setEmail(user.email || '');
        setTel(user.phone || '');
        setAdresse('');
        setCompanyName('');
        notify('Modifications annulées', 'info');
    };

    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '300px' 
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #f3f4f6',
                        borderTopColor: '#70AE48',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 1rem'
                    }}></div>
                    <p>Chargement de vos informations...</p>
                </div>
            </div>
        );
    }

    return (
        <>
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
                            {prenom ? prenom.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
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
                            disabled={isSaving}
                        >
                            Annuler
                        </button>
                        <button
                            className="mc-btn-save"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MonCompte;