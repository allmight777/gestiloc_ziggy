import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { maintenanceService } from "../../../services/api";

interface CreerInterventionProps {
  notify?: (msg: string, type: "success" | "info" | "error") => void;
  isEdit?: boolean;
  incidentId?: number;
}

interface Property {
  id: number;
  name?: string;
  address?: string;
  city?: string;
  full_address?: string;
  tenant_id?: number | null;
  tenant?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  } | null;
}

const CreerIntervention: React.FC<CreerInterventionProps> = ({ 
  notify, 
  isEdit = false, 
  incidentId 
}) => {
  const navigate = useNavigate();
  const params = useParams();
  
  // États du formulaire
  const [currentTab, setCurrentTab] = useState<number>(1);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedTenant, setSelectedTenant] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [status, setStatus] = useState<string>("open");
  const [description, setDescription] = useState<string>("");
  const [estimatedCost, setEstimatedCost] = useState<string>("");
  const [preferredDate, setPreferredDate] = useState<string>("");
  const [assignedProvider, setAssignedProvider] = useState<string>("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  
  // États pour les données du backend
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Déterminer l'ID de l'intervention
  const getIncidentId = (): number | null => {
    if (incidentId) return incidentId;
    if (params.id) return parseInt(params.id);
    return null;
  };

  const currentIncidentId = getIncidentId();

  // Récupérer les biens depuis le backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("🟢 Tentative de chargement des propriétés pour formulaire...");
        const response = await maintenanceService.getPropertiesForForm();
        
        console.log("🟢 Réponse brute de l'API:", response);
        
        if (response.success && response.data) {
          console.log("🟢 Données reçues:", response.data);
          setProperties(response.data);
        } else {
          console.warn("🟡 Pas de données dans la réponse", response);
          notify?.("Erreur lors du chargement des données", "error");
        }
      } catch (error) {
        console.error("🔴 Erreur lors de la récupération des biens:", error);
        notify?.("Erreur lors du chargement des biens", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [notify]);

  // Charger les données de l'intervention si en mode édition
  useEffect(() => {
    const fetchIncidentData = async () => {
      if (!isEdit || !currentIncidentId) return;
      
      setIsLoading(true);
      try {
        console.log(`🟢 Chargement de l'intervention ${currentIncidentId} pour édition...`);
        const incident = await maintenanceService.getIncident(currentIncidentId);
        
        console.log("🟢 Données de l'intervention reçues:", incident);
        
        // Remplir les champs avec les données existantes
        setSelectedProperty(incident.property_id?.toString() || incident.property?.id?.toString() || "");
        setSelectedTenant(incident.tenant_id?.toString() || incident.tenant?.id?.toString() || "");
        setTitle(incident.title || "");
        setCategory(incident.category || "");
        setPriority(incident.priority || "");
        setStatus(incident.status || "open");
        setDescription(incident.description || "");
        setEstimatedCost(incident.estimated_cost?.toString() || "");
        setAssignedProvider(incident.assigned_provider || "");
        
        // Gérer les photos existantes
        if (incident.photos && incident.photos.length > 0) {
          setExistingPhotos(incident.photos);
        }
        
        // Si une date préférée existe
        if (incident.preferred_date) {
          setPreferredDate(incident.preferred_date);
        }
        
      } catch (error) {
        console.error("🔴 Erreur lors du chargement de l'intervention:", error);
        notify?.("Erreur lors du chargement de l'intervention", "error");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isEdit) {
      fetchIncidentData();
    }
  }, [isEdit, currentIncidentId, notify]);

  // Mettre à jour le locataire automatiquement quand un bien est sélectionné
  const updateTenant = (propertyId: string) => {
    console.log("🔄 updateTenant appelé avec propertyId:", propertyId);
    
    const property = properties.find(p => p.id === parseInt(propertyId));
    console.log("🔄 Propriété trouvée:", property);
    
    if (property) {
      if (property.tenant_id && property.tenant) {
        setSelectedTenant(property.tenant.id.toString());
        console.log("✅ Locataire sélectionné automatiquement:", property.tenant);
      } else {
        setSelectedTenant("");
        console.log("❌ Aucun locataire associé à ce bien", property);
      }
    } else {
      console.warn("🟡 Propriété non trouvée pour ID:", propertyId);
    }
  };

  // Gérer les photos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingPhotos(prev => prev.filter((_, i) => i !== index));
    } else {
      setPhotos(prev => prev.filter((_, i) => i !== index));
      URL.revokeObjectURL(photoPreviews[index]);
      setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Validation de l'onglet actuel
  const validateCurrentTab = (): boolean => {
    let isValid = true;
    const newErrors: string[] = [];

    if (currentTab === 1) {
      if (!selectedProperty) {
        newErrors.push("Veuillez sélectionner un bien.");
        isValid = false;
      }
      if (!selectedTenant) {
        newErrors.push("Veuillez sélectionner un locataire.");
        isValid = false;
      }
    } else if (currentTab === 2) {
      if (!title) {
        newErrors.push("Veuillez saisir un titre pour l'intervention.");
        isValid = false;
      }
      if (!category) {
        newErrors.push("Veuillez sélectionner une catégorie.");
        isValid = false;
      }
      if (!priority) {
        newErrors.push("Veuillez sélectionner une priorité.");
        isValid = false;
      }
      if (!description) {
        newErrors.push("Veuillez saisir une description.");
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const switchTab = (tabNumber: number) => {
    if (tabNumber > currentTab) {
      if (!validateCurrentTab()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    setCurrentTab(tabNumber);
  };

  const handleSubmit = async () => {
    if (!validateCurrentTab()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const interventionData: any = {
        property_id: parseInt(selectedProperty),
        tenant_id: parseInt(selectedTenant),
        title: title,
        category: category,
        priority: priority,
        status: status,
        description: description,
        assigned_provider: assignedProvider || undefined,
      };

      if (estimatedCost && parseFloat(estimatedCost) > 0) {
        interventionData.estimated_cost = parseFloat(estimatedCost);
      }
      
      if (preferredDate) {
        interventionData.preferred_date = preferredDate;
      }

      console.log(`📤 ${isEdit ? 'Mise à jour' : 'Création'} de l'intervention:`, interventionData);

      if (isEdit && currentIncidentId) {
        // Mode édition - utiliser update
        await maintenanceService.update(currentIncidentId, interventionData);
        notify?.("Intervention mise à jour avec succès!", "success");
      } else {
        // Mode création
        await maintenanceService.createIncident(interventionData);
        notify?.("Intervention créée avec succès!", "success");
      }
      
      navigate("/proprietaire/incidents");
    } catch (error: any) {
      console.error(`🔴 Erreur lors de la ${isEdit ? 'mise à jour' : 'création'} de l'intervention:`, error);
      
      if (error.response?.data?.errors) {
        const backendErrors = Object.values(error.response.data.errors).flat();
        setErrors(backendErrors as string[]);
      } else if (error.response?.data?.message) {
        setErrors([error.response.data.message]);
      } else {
        setErrors([error.message || `Erreur lors de la ${isEdit ? 'mise à jour' : 'création'} de l'intervention.`]);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Messages pour les priorités
  const priorityMessages: Record<string, string> = {
    'low': '🟢 Réponse sous 7 jours • Impact minimal sur le locataire',
    'medium': '🟡 Réponse sous 3 jours • Gênant mais pas urgent',
    'high': '🟠 Réponse sous 24h • Problème important affectant le confort',
    'emergency': '🔴 Intervention immédiate • Danger ou dégâts en cours'
  };

  // Obtenir le nom complet du locataire
  const getTenantFullName = (property: Property): string => {
    if (property.tenant) {
      return `${property.tenant.first_name} ${property.tenant.last_name}`;
    }
    return "Aucun locataire";
  };

  if (isLoading) {
    return (
      <div style={{
        maxWidth: "1200px",
        margin: "3rem auto",
        padding: "2rem",
        textAlign: "center",
        fontFamily: "'Manrope', sans-serif"
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;800;900&family=Manrope:wght@400;500;600;700;800;950&display=swap');

        :root {
          --primary-green: #70AE48;
          --primary-light: #8BC34A;
          --primary-dark: #5d8f3a;
          --secondary-sky: #38bdf8;
          --secondary-cyan: #06b6d4;
          --accent-teal: #14b8a6;
          --success-green: #10b981;
          --warning-amber: #f59e0b;
          --error-red: #ef4444;
          --gray-50: #f9fafb;
          --gray-100: #f3f4f6;
          --gray-200: #e5e7eb;
          --gray-300: #d1d5db;
          --gray-400: #9ca3af;
          --gray-500: #6b7280;
          --gray-600: #4b5563;
          --gray-700: #374151;
          --gray-800: #1f2937;
          --gradient-primary: linear-gradient(135deg, #70AE48 0%, #8BC34A 100%);
          --gradient-secondary: linear-gradient(135deg, #38bdf8 0%, #14b8a6 100%);
          --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          --shadow-green: 0 10px 40px rgba(112, 174, 72, 0.2);
          --border-radius: 16px;
          --border-radius-lg: 24px;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Animations */
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes slideUp {
          from {
              opacity: 0;
              transform: translateY(30px);
          }
          to {
              opacity: 1;
              transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
          opacity: 0;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        .animate-hover:hover {
          transform: translateY(-2px);
          transition: var(--transition);
        }

        /* Styles des onglets */
        .tab-btn.active {
          transform: translateY(-3px);
        }

        .tab-btn.active .tab-number {
          background: var(--gradient-primary);
          color: white;
          box-shadow: var(--shadow-green);
        }

        .tab-btn.active .tab-label {
          color: var(--primary-green);
          font-weight: 600;
          font-size: 1.1rem;
        }

        .tab-btn.active + .tab-connector::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--gradient-primary);
        }

        .form-control:focus {
          outline: none;
          border-color: var(--primary-green);
          box-shadow: 0 0 0 4px rgba(112, 174, 72, 0.15);
        }

        .btn-next:hover,
        .btn-submit:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-green);
        }

        .btn-next:hover {
          transform: translateX(3px);
        }

        .btn-submit::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: 0.5s;
        }

        .btn-submit:hover::after {
          left: 100%;
        }

        .file-upload-area.drag-over {
          border-color: var(--success-green);
          background: rgba(16, 185, 129, 0.1);
        }

        .file-preview:hover {
          transform: translateY(-3px);
          border-color: var(--primary-green);
          box-shadow: var(--shadow-md);
        }

        .file-preview:hover .remove-btn {
          opacity: 1;
        }

        .remove-btn:hover {
          background: #dc2626;
        }

        .step.active {
          color: var(--primary-green);
          font-weight: 600;
          font-size: 1.1rem;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        .priority-low {
          color: var(--success-green);
          background: rgba(16, 185, 129, 0.1);
        }
        .priority-medium {
          color: var(--warning-amber);
          background: rgba(245, 158, 11, 0.1);
        }
        .priority-high {
          color: #f97316;
          background: rgba(249, 115, 22, 0.1);
        }
        .priority-emergency {
          color: var(--error-red);
          background: rgba(239, 68, 68, 0.1);
        }
      `}</style>

      <div style={{
        maxWidth: "1200px",
        margin: "3rem auto",
        padding: "0 2rem",
        fontFamily: "'Manrope', sans-serif"
      }}>
    
        {/* Form Card */}
        <div style={{
          background: "white",
          borderRadius: "var(--border-radius-lg)",
          border: "1px solid var(--gray-200)",
          padding: "3rem",
          boxShadow: "var(--shadow-xl)",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "var(--gradient-primary)"
          }}></div>

          {/* Titre */}
          <h1 style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--gray-800)",
            marginBottom: "2rem",
            fontFamily: "'Merriweather', serif"
          }}>
            {isEdit ? 'Modifier l\'intervention' : 'Nouvelle intervention'}
          </h1>

          {/* Affichage des erreurs */}
          {errors.length > 0 && (
            <div style={{
              borderRadius: "var(--border-radius)",
              padding: "1.5rem",
              marginBottom: "2.5rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "1.2rem",
              border: "2px solid var(--error-red)",
              background: "linear-gradient(to right, rgba(254, 242, 242, 0.9), rgba(254, 226, 226, 0.9))"
            }}>
              <div style={{ width: "28px", height: "28px", color: "var(--error-red)", flexShrink: 0 }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  display: "block",
                  color: "var(--gray-800)",
                  marginBottom: "0.5rem",
                  fontSize: "1.1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>Erreurs de validation</strong>
                <ul style={{
                  color: "var(--gray-700)",
                  margin: 0,
                  fontSize: "1rem",
                  paddingLeft: "1.5rem",
                  marginTop: "0.5rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Navigation par onglets */}
          <div style={{ marginBottom: "3rem" }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative"
            }}>
              <button 
                type="button" 
                className="tab-btn"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.9rem",
                  padding: "1rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "var(--transition)",
                  minWidth: "100px",
                  zIndex: 2,
                  transform: currentTab === 1 ? "translateY(-3px)" : "none"
                }}
                onClick={() => switchTab(1)}
              >
                <span className="tab-number" style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: currentTab === 1 ? "var(--gradient-primary)" : "var(--gray-200)",
                  color: currentTab === 1 ? "white" : "var(--gray-500)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  transition: "var(--transition)",
                  boxShadow: currentTab === 1 ? "var(--shadow-green)" : "none"
                }}>1</span>
                <span className="tab-label" style={{
                  fontSize: "1rem",
                  color: currentTab === 1 ? "var(--primary-green)" : "var(--gray-500)",
                  transition: "var(--transition)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontWeight: currentTab === 1 ? 600 : 400
                }}>Bien et Locataire</span>
              </button>
              <div className="tab-connector" style={{
                flex: 1,
                height: "4px",
                background: "var(--gray-200)",
                margin: "0 0.5rem",
                position: "relative",
                overflow: "hidden"
              }}>
                {currentTab > 1 && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "var(--gradient-primary)"
                  }}></div>
                )}
              </div>
              <button 
                type="button" 
                className="tab-btn"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.9rem",
                  padding: "1rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "var(--transition)",
                  minWidth: "100px",
                  zIndex: 2,
                  transform: currentTab === 2 ? "translateY(-3px)" : "none"
                }}
                onClick={() => switchTab(2)}
              >
                <span className="tab-number" style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: currentTab === 2 ? "var(--gradient-primary)" : "var(--gray-200)",
                  color: currentTab === 2 ? "white" : "var(--gray-500)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  transition: "var(--transition)",
                  boxShadow: currentTab === 2 ? "var(--shadow-green)" : "none"
                }}>2</span>
                <span className="tab-label" style={{
                  fontSize: "1rem",
                  color: currentTab === 2 ? "var(--primary-green)" : "var(--gray-500)",
                  transition: "var(--transition)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontWeight: currentTab === 2 ? 600 : 400
                }}>Détails</span>
              </button>
              <div className="tab-connector" style={{
                flex: 1,
                height: "4px",
                background: "var(--gray-200)",
                margin: "0 0.5rem",
                position: "relative",
                overflow: "hidden"
              }}>
                {currentTab > 2 && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "var(--gradient-primary)"
                  }}></div>
                )}
              </div>
              <button 
                type="button" 
                className="tab-btn"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.9rem",
                  padding: "1rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "var(--transition)",
                  minWidth: "100px",
                  zIndex: 2,
                  transform: currentTab === 3 ? "translateY(-3px)" : "none"
                }}
                onClick={() => switchTab(3)}
              >
                <span className="tab-number" style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: currentTab === 3 ? "var(--gradient-primary)" : "var(--gray-200)",
                  color: currentTab === 3 ? "white" : "var(--gray-500)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  transition: "var(--transition)",
                  boxShadow: currentTab === 3 ? "var(--shadow-green)" : "none"
                }}>3</span>
                <span className="tab-label" style={{
                  fontSize: "1rem",
                  color: currentTab === 3 ? "var(--primary-green)" : "var(--gray-500)",
                  transition: "var(--transition)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontWeight: currentTab === 3 ? 600 : 400
                }}>Informations</span>
              </button>
              <div className="tab-connector" style={{
                flex: 1,
                height: "4px",
                background: "var(--gray-200)",
                margin: "0 0.5rem",
                position: "relative",
                overflow: "hidden"
              }}>
                {currentTab > 3 && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "var(--gradient-primary)"
                  }}></div>
                )}
              </div>
              <button 
                type="button" 
                className="tab-btn"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.9rem",
                  padding: "1rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  transition: "var(--transition)",
                  minWidth: "100px",
                  zIndex: 2,
                  transform: currentTab === 4 ? "translateY(-3px)" : "none"
                }}
                onClick={() => switchTab(4)}
              >
                <span className="tab-number" style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: currentTab === 4 ? "var(--gradient-primary)" : "var(--gray-200)",
                  color: currentTab === 4 ? "white" : "var(--gray-500)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1.2rem",
                  transition: "var(--transition)",
                  boxShadow: currentTab === 4 ? "var(--shadow-green)" : "none"
                }}>4</span>
                <span className="tab-label" style={{
                  fontSize: "1rem",
                  color: currentTab === 4 ? "var(--primary-green)" : "var(--gray-500)",
                  transition: "var(--transition)",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  fontWeight: currentTab === 4 ? 600 : 400
                }}>Photos</span>
              </button>
            </div>
          </div>

          {/* Onglet 1: Bien et Locataire */}
          <div style={{ display: currentTab === 1 ? 'block' : 'none' }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2.5rem",
              marginBottom: "2.5rem"
            }}>
              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--gray-700)",
                  marginBottom: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                    <path d="M3 10h18M5 6h14M5 18h14M8 14h8" />
                    <rect x="2" y="2" width="20" height="20" rx="2" />
                  </svg>
                  Bien concerné <span style={{ color: "var(--error-red)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select 
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                      border: "2px solid var(--gray-300)",
                      borderRadius: "var(--border-radius)",
                      fontSize: "1.1rem",
                      color: "var(--gray-800)",
                      background: "white",
                      transition: "var(--transition)",
                      appearance: "none",
                      cursor: "pointer",
                      lineHeight: 1.5,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                    value={selectedProperty}
                    onChange={(e) => {
                      setSelectedProperty(e.target.value);
                      updateTenant(e.target.value);
                    }}
                  >
                    <option value="">Sélectionnez un bien</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.full_address || `${prop.name || ''} - ${prop.address || ''}, ${prop.city || ''}`}
                        {prop.tenant ? ` (${prop.tenant.first_name} ${prop.tenant.last_name})` : ''}
                      </option>
                    ))}
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                    position: "absolute",
                    right: "1.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none"
                  }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "0.95rem",
                  color: "var(--gray-500)",
                  marginTop: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  Sélectionnez le bien où se situe le problème
                </div>
              </div>

              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--gray-700)",
                  marginBottom: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Locataire concerné <span style={{ color: "var(--error-red)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select 
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                      border: "2px solid var(--gray-300)",
                      borderRadius: "var(--border-radius)",
                      fontSize: "1.1rem",
                      color: "var(--gray-800)",
                      background: "white",
                      transition: "var(--transition)",
                      appearance: "none",
                      cursor: "pointer",
                      lineHeight: 1.5,
                      fontFamily: "'Manrope', sans-serif",
                      opacity: !selectedProperty ? 0.6 : 1
                    }}
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    disabled={!selectedProperty}
                  >
                    <option value="">Sélectionnez d'abord un bien</option>
                    {selectedProperty && properties.find(p => p.id === parseInt(selectedProperty))?.tenant && (
                      <option value={properties.find(p => p.id === parseInt(selectedProperty))?.tenant?.id}>
                        👤 {properties.find(p => p.id === parseInt(selectedProperty))?.tenant?.first_name} {properties.find(p => p.id === parseInt(selectedProperty))?.tenant?.last_name}
                      </option>
                    )}
                    {selectedProperty && !properties.find(p => p.id === parseInt(selectedProperty))?.tenant && (
                      <option value="" disabled>Aucun locataire associé à ce bien</option>
                    )}
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                    position: "absolute",
                    right: "1.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none"
                  }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "0.95rem",
                  color: "var(--gray-500)",
                  marginTop: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  Le locataire sera informé de l'intervention
                </div>
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "2.5rem",
              paddingTop: "2rem",
              borderTop: "2px solid var(--gray-200)"
            }}>
              <div></div>
              <button 
                type="button" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 2rem",
                  border: "none",
                  borderRadius: "var(--border-radius)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  background: "var(--primary-green)",
                  color: "white",
                  border: "2px solid var(--primary-green)",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onClick={() => switchTab(2)}
              >
                Suivant
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Onglet 2: Détails de l'intervention */}
          <div style={{ display: currentTab === 2 ? 'block' : 'none' }}>
            <div style={{ marginBottom: "2.5rem" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--gray-700)",
                marginBottom: "1rem",
                fontFamily: "'Manrope', sans-serif"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                Titre de l'intervention <span style={{ color: "var(--error-red)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                  position: "absolute",
                  left: "1.2rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 1
                }}>
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                </svg>
                <input 
                  type="text"
                  style={{
                    width: "100%",
                    padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                    border: "2px solid var(--gray-300)",
                    borderRadius: "var(--border-radius)",
                    fontSize: "1.1rem",
                    color: "var(--gray-800)",
                    background: "white",
                    transition: "var(--transition)",
                    lineHeight: 1.5,
                    fontFamily: "'Manrope', sans-serif",
                    boxSizing: "border-box"
                  }}
                  placeholder="Ex: Fuite d'eau salle de bain"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2.5rem",
              marginBottom: "2.5rem"
            }}>
              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--gray-700)",
                  marginBottom: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                    <circle cx="12" cy="12" r="2" />
                    <path d="M4.5 5.5L6 7M2 12h2M4.5 18.5L6 17M20 12h2M17.5 5.5L18 7" />
                  </svg>
                  Catégorie <span style={{ color: "var(--error-red)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select 
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                      border: "2px solid var(--gray-300)",
                      borderRadius: "var(--border-radius)",
                      fontSize: "1.1rem",
                      color: "var(--gray-800)",
                      background: "white",
                      transition: "var(--transition)",
                      appearance: "none",
                      cursor: "pointer",
                      lineHeight: 1.5,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Choisissez une catégorie</option>
                    <option value="plumbing">Plomberie</option>
                    <option value="electricity">Électricité</option>
                    <option value="heating">Chauffage</option>
                    <option value="other">Autre</option>
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                    position: "absolute",
                    right: "1.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none"
                  }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>

              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--gray-700)",
                  marginBottom: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                    <path d="M12 2v4M12 22v-4M4 12H2M8 12H6M18 12h-2M22 12h-2M19.07 4.93l-2.83 2.83M4.93 19.07l2.83-2.83M19.07 19.07l-2.83-2.83M4.93 4.93l2.83 2.83" />
                  </svg>
                  Priorité <span style={{ color: "var(--error-red)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select 
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                      border: "2px solid var(--gray-300)",
                      borderRadius: "var(--border-radius)",
                      fontSize: "1.1rem",
                      color: "var(--gray-800)",
                      background: "white",
                      transition: "var(--transition)",
                      appearance: "none",
                      cursor: "pointer",
                      lineHeight: 1.5,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="">Choisissez une priorité</option>
                    <option value="low">Faible</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Élevée</option>
                    <option value="emergency">Urgence</option>
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                    position: "absolute",
                    right: "1.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none"
                  }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
                {priority && (
                  <div style={{
                    fontSize: "0.95rem",
                    padding: "0.9rem 1.2rem",
                    borderRadius: "8px",
                    marginTop: "1rem",
                    display: "block",
                    lineHeight: 1.5,
                    fontFamily: "'Manrope', sans-serif",
                    color: priority === 'low' ? "var(--success-green)" : 
                           priority === 'medium' ? "var(--warning-amber)" : 
                           priority === 'high' ? "#f97316" : "var(--error-red)",
                    background: priority === 'low' ? "rgba(16,185,129,0.1)" : 
                                priority === 'medium' ? "rgba(245,158,11,0.1)" : 
                                priority === 'high' ? "rgba(249,115,22,0.1)" : "rgba(239,68,68,0.1)"
                  }}>
                    {priorityMessages[priority]}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2.5rem",
              marginBottom: "2.5rem"
            }}>
              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--gray-700)",
                  marginBottom: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Statut <span style={{ color: "var(--error-red)" }}>*</span>
                </label>
                <div style={{ position: "relative" }}>
                  <select 
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                      border: "2px solid var(--gray-300)",
                      borderRadius: "var(--border-radius)",
                      fontSize: "1.1rem",
                      color: "var(--gray-800)",
                      background: "white",
                      transition: "var(--transition)",
                      appearance: "none",
                      cursor: "pointer",
                      lineHeight: 1.5,
                      fontFamily: "'Manrope', sans-serif"
                    }}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="open">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="resolved">Résolu</option>
                    <option value="cancelled">Annulé</option>
                  </select>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                    position: "absolute",
                    right: "1.5rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none"
                  }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>

              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--gray-700)",
                  marginBottom: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Prestataire assigné
                </label>
                <div style={{ position: "relative" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                    position: "absolute",
                    left: "1.2rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1
                  }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <input 
                    type="text"
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                      border: "2px solid var(--gray-300)",
                      borderRadius: "var(--border-radius)",
                      fontSize: "1.1rem",
                      color: "var(--gray-800)",
                      background: "white",
                      transition: "var(--transition)",
                      lineHeight: 1.5,
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: "border-box"
                    }}
                    placeholder="Nom du prestataire"
                    value={assignedProvider}
                    onChange={(e) => setAssignedProvider(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "2.5rem" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--gray-700)",
                marginBottom: "1rem",
                fontFamily: "'Manrope', sans-serif"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Description détaillée <span style={{ color: "var(--error-red)" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <textarea
                  style={{
                    width: "100%",
                    padding: "1.2rem",
                    border: "2px solid var(--gray-300)",
                    borderRadius: "var(--border-radius)",
                    fontSize: "1.1rem",
                    color: "var(--gray-800)",
                    background: "white",
                    transition: "var(--transition)",
                    resize: "vertical",
                    minHeight: "180px",
                    fontFamily: "'Manrope', sans-serif",
                    lineHeight: 1.6,
                    boxSizing: "border-box"
                  }}
                  rows={5}
                  placeholder="Décrivez le problème en détail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div style={{
                  position: "absolute",
                  bottom: "1rem",
                  right: "1rem",
                  fontSize: "0.9rem",
                  color: "var(--gray-400)",
                  background: "white",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "6px",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <span>{description.length}</span> / 1000
                </div>
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "0.95rem",
                color: "var(--gray-500)",
                marginTop: "1rem",
                fontFamily: "'Manrope', sans-serif"
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6M9 16h6" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z" />
                </svg>
                Soyez précis pour une meilleure prise en charge
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "2.5rem",
              paddingTop: "2rem",
              borderTop: "2px solid var(--gray-200)"
            }}>
              <button 
                type="button" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 2rem",
                  border: "none",
                  borderRadius: "var(--border-radius)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  background: "var(--gray-100)",
                  color: "var(--gray-600)",
                  border: "2px solid var(--gray-300)",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onClick={() => switchTab(1)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Précédent
              </button>
              <button 
                type="button" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 2rem",
                  border: "none",
                  borderRadius: "var(--border-radius)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  background: "var(--primary-green)",
                  color: "white",
                  border: "2px solid var(--primary-green)",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onClick={() => switchTab(3)}
              >
                Suivant
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Onglet 3: Informations complémentaires */}
          <div style={{ display: currentTab === 3 ? 'block' : 'none' }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "2.5rem",
              marginBottom: "2.5rem"
            }}>
              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--gray-700)",
                  marginBottom: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  Coût estimé (FCFA)
                </label>
                <div style={{ position: "relative" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                    position: "absolute",
                    left: "1.2rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1
                  }}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" />
                    <line x1="15" y1="9" x2="15.01" y2="9" />
                  </svg>
                  <input 
                    type="text" inputMode="numeric" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                      border: "2px solid var(--gray-300)",
                      borderRadius: "var(--border-radius)",
                      fontSize: "1.1rem",
                      color: "var(--gray-800)",
                      background: "white",
                      transition: "var(--transition)",
                      lineHeight: 1.5,
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: "border-box"
                    }}
                    placeholder="0"
                    min="0"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "2.5rem" }}>
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "1.2rem",
                  fontWeight: 600,
                  color: "var(--gray-700)",
                  marginBottom: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  Date souhaitée
                </label>
                <div style={{ position: "relative" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gray-400)" strokeWidth="2" style={{
                    position: "absolute",
                    left: "1.2rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 1
                  }}>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                  </svg>
                  <input 
                    type="date"
                    style={{
                      width: "100%",
                      padding: "1.2rem 1.5rem 1.2rem 3.5rem",
                      border: "2px solid var(--gray-300)",
                      borderRadius: "var(--border-radius)",
                      fontSize: "1.1rem",
                      color: "var(--gray-800)",
                      background: "white",
                      transition: "var(--transition)",
                      lineHeight: 1.5,
                      fontFamily: "'Manrope', sans-serif",
                      boxSizing: "border-box"
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                  />
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  fontSize: "0.95rem",
                  color: "var(--gray-500)",
                  marginTop: "1rem",
                  fontFamily: "'Manrope', sans-serif"
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Laissez vide si aucune préférence
                </div>
              </div>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "2.5rem",
              paddingTop: "2rem",
              borderTop: "2px solid var(--gray-200)"
            }}>
              <button 
                type="button" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 2rem",
                  border: "none",
                  borderRadius: "var(--border-radius)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  background: "var(--gray-100)",
                  color: "var(--gray-600)",
                  border: "2px solid var(--gray-300)",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onClick={() => switchTab(2)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Précédent
              </button>
              <button 
                type="button" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 2rem",
                  border: "none",
                  borderRadius: "var(--border-radius)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  background: "var(--primary-green)",
                  color: "white",
                  border: "2px solid var(--primary-green)",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onClick={() => switchTab(4)}
              >
                Suivant
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Onglet 4: Photos */}
          <div style={{ display: currentTab === 4 ? 'block' : 'none' }}>
            <div style={{ marginBottom: "2.5rem" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "1.2rem",
                fontWeight: 600,
                color: "var(--gray-700)",
                marginBottom: "1rem",
                fontFamily: "'Manrope', sans-serif"
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-green)" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" />
                  <circle cx="18" cy="6" r="1" />
                  <circle cx="9" cy="9" r="4" />
                </svg>
                Photos {isEdit ? '(ajouter des photos)' : '(optionnel)'}
              </label>

              {/* Photos existantes (mode édition) */}
              {isEdit && existingPhotos.length > 0 && (
                <div style={{ marginBottom: "2rem" }}>
                  <h4 style={{ fontSize: "1rem", color: "var(--gray-600)", marginBottom: "1rem" }}>
                    Photos existantes
                  </h4>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                    gap: "1.2rem"
                  }}>
                    {existingPhotos.map((photo, index) => {
                      const photoUrl = photo.startsWith('http') 
                        ? photo 
                        : `https://imona.app/storage/${photo.replace(/^\//, '')}`;
                      return (
                        <div key={index} style={{
                          position: "relative",
                          borderRadius: "12px",
                          overflow: "hidden",
                          border: "2px solid var(--gray-200)",
                          transition: "var(--transition)"
                        }}>
                          <img src={photoUrl} alt={`Photo existante ${index}`} style={{
                            width: "100%",
                            height: "120px",
                            objectFit: "cover",
                            display: "block"
                          }} />
                          <button 
                            style={{
                              position: "absolute",
                              top: "0.5rem",
                              right: "0.5rem",
                              width: "28px",
                              height: "28px",
                              background: "var(--error-red)",
                              color: "white",
                              border: "none",
                              borderRadius: "50%",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "14px",
                              opacity: 0,
                              transition: "var(--transition)"
                            }}
                            onClick={() => removePhoto(index, true)}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Upload de nouvelles photos */}
              <div 
                style={{
                  border: "3px dashed var(--gray-300)",
                  borderRadius: "var(--border-radius-lg)",
                  background: "var(--gray-50)",
                  padding: "3rem",
                  textAlign: "center",
                  transition: "var(--transition)",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden"
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "var(--success-green)";
                  e.currentTarget.style.background = "rgba(16,185,129,0.1)";
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--gray-300)";
                  e.currentTarget.style.background = "var(--gray-50)";
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = "var(--gray-300)";
                  e.currentTarget.style.background = "var(--gray-50)";
                  
                  const files = Array.from(e.dataTransfer.files);
                  const imageFiles = files.filter(file => file.type.startsWith('image/'));
                  
                  setPhotos(prev => [...prev, ...imageFiles]);
                  
                  const newPreviews = imageFiles.map(file => URL.createObjectURL(file));
                  setPhotoPreviews(prev => [...prev, ...newPreviews]);
                }}
              >
                <input 
                  type="file"
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer",
                    top: 0,
                    left: 0
                  }}
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div style={{ pointerEvents: "none" }}>
                  <div style={{
                    width: "64px",
                    height: "64px",
                    background: "var(--gradient-primary)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 1.5rem",
                    color: "white"
                  }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p style={{
                      fontSize: "1.3rem",
                      fontWeight: 600,
                      color: "var(--gray-800)",
                      margin: "0 0 0.6rem 0",
                      fontFamily: "'Manrope', sans-serif"
                    }}>Glissez-déposez vos images ici</p>
                    <p style={{
                      fontSize: "1.1rem",
                      color: "var(--gray-500)",
                      margin: "0 0 1.5rem 0",
                      fontFamily: "'Manrope', sans-serif"
                    }}>ou cliquez pour parcourir</p>
                  </div>
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.9rem",
                    fontSize: "0.95rem",
                    color: "var(--gray-400)",
                    padding: "0.9rem 1.8rem",
                    background: "white",
                    borderRadius: "30px",
                    border: "2px solid var(--gray-200)",
                    fontFamily: "'Manrope', sans-serif"
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    JPG, PNG, WebP • Max 5Mo
                  </div>
                </div>
              </div>
              
              {/* Nouvelles photos preview */}
              {photoPreviews.length > 0 && (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                  gap: "1.2rem",
                  marginTop: "2rem"
                }}>
                  {photoPreviews.map((preview, index) => (
                    <div key={index} style={{
                      position: "relative",
                      borderRadius: "12px",
                      overflow: "hidden",
                      border: "2px solid var(--gray-200)",
                      transition: "var(--transition)"
                    }}>
                      <img src={preview} alt={`Preview ${index}`} style={{
                        width: "100%",
                        height: "120px",
                        objectFit: "cover",
                        display: "block"
                      }} />
                      <button 
                        style={{
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem",
                          width: "28px",
                          height: "28px",
                          background: "var(--error-red)",
                          color: "white",
                          border: "none",
                          borderRadius: "50%",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "14px",
                          opacity: 0,
                          transition: "var(--transition)"
                        }}
                        onClick={() => removePhoto(index, false)}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "2.5rem",
              paddingTop: "2rem",
              borderTop: "2px solid var(--gray-200)"
            }}>
              <button 
                type="button" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem 2rem",
                  border: "none",
                  borderRadius: "var(--border-radius)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  background: "var(--gray-100)",
                  color: "var(--gray-600)",
                  border: "2px solid var(--gray-300)",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onClick={() => switchTab(3)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Précédent
              </button>
              <button 
                type="button" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1.2rem 2.5rem",
                  background: "var(--gradient-primary)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--border-radius)",
                  fontWeight: 600,
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  position: "relative",
                  overflow: "hidden",
                  fontFamily: "'Manrope', sans-serif"
                }}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {isSubmitting 
                  ? (isEdit ? "Mise à jour..." : "Création...") 
                  : (isEdit ? "Mettre à jour l'intervention" : "Créer l'intervention")
                }
                {isSubmitting && (
                  <span style={{ display: "inline-flex", marginLeft: "0.5rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v2" />
                      <path d="M12 12v2" />
                      <path d="M12 18v2" />
                    </svg>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Barre de progression */}
          <div style={{
            marginTop: "3rem",
            paddingTop: "2.5rem",
            borderTop: "2px solid var(--gray-200)"
          }}>
            <div style={{
              height: "10px",
              background: "var(--gray-200)",
              borderRadius: "5px",
              overflow: "hidden",
              marginBottom: "1.2rem"
            }}>
              <div style={{
                height: "100%",
                background: "var(--gradient-primary)",
                width: `${(currentTab / 4) * 100}%`,
                transition: "width 0.3s ease"
              }}></div>
            </div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "1rem",
              color: "var(--gray-500)",
              fontFamily: "'Manrope', sans-serif"
            }}>
              <span className="step" style={currentTab >= 1 ? { color: "var(--primary-green)", fontWeight: 600, fontSize: "1.1rem" } : {}}>Bien</span>
              <span className="step" style={currentTab >= 2 ? { color: "var(--primary-green)", fontWeight: 600, fontSize: "1.1rem" } : {}}>Détails</span>
              <span className="step" style={currentTab >= 3 ? { color: "var(--primary-green)", fontWeight: 600, fontSize: "1.1rem" } : {}}>Infos</span>
              <span className="step" style={currentTab >= 4 ? { color: "var(--primary-green)", fontWeight: 600, fontSize: "1.1rem" } : {}}>Photos</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreerIntervention;