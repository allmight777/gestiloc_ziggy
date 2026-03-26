import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

// Types pour les données
interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  rent_amount?: number;
  charges_amount?: number;
  caution?: number;
  status?: string;
}

interface Tenant {
  id: number;
  first_name: string;
  last_name: string;
  user?: {
    email: string;
  };
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
    status?: number;
  };
  message?: string;
}

const NouvelleLocation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // États pour les listes déroulantes
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  
  // États du formulaire
  const [bien, setBien] = useState("");
  const [locataire, setLocataire] = useState("");
  const [typeBail, setTypeBail] = useState("nu");
  const [tacitRenewal, setTacitRenewal] = useState(true); // NOUVEAU : case à cocher
  const [loyer, setLoyer] = useState("");
  const [charges, setCharges] = useState("");
  const [depot, setDepot] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dureeMois, setDureeMois] = useState("12");
  const [dateFin, setDateFin] = useState("");
  const [dateFinDisplay, setDateFinDisplay] = useState("");
  const [jourPaiement, setJourPaiement] = useState("5");
  const [periodicite, setPeriodicite] = useState("monthly");
  const [modePaiement, setModePaiement] = useState("Espèce");
  const [autoRenew, setAutoRenew] = useState(true);
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger les données au montage
  useEffect(() => {
    fetchProperties();
    fetchTenants();
    setDateDebut(new Date().toISOString().split('T')[0]);
  }, []);

  // Calculer la date de fin quand la durée change
  useEffect(() => {
    calculateEndDate();
  }, [dateDebut, dureeMois]);

  // Mettre à jour les champs quand un bien est sélectionné
  useEffect(() => {
    if (bien) {
      const selectedProperty = properties.find(p => p.id.toString() === bien);
      if (selectedProperty) {
        setLoyer(selectedProperty.rent_amount?.toString() || "");
        setCharges(selectedProperty.charges_amount?.toString() || "");
        setDepot(selectedProperty.caution?.toString() || "");
      }
    }
  }, [bien, properties]);

  const fetchProperties = async () => {
    try {
      setLoadingData(true);
      const response = await api.get('/landlord/properties/available');
      setProperties(response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des biens:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const response = await api.get('/landlord/tenants');
      setTenants(response.data || []);
    } catch (error) {
      console.error("Erreur lors du chargement des locataires:", error);
    }
  };

  const calculateEndDate = () => {
    if (dateDebut && dureeMois) {
      const startDate = new Date(dateDebut);
      const months = parseInt(dureeMois) || 0;

      if (months > 0) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + months);

        const day = String(endDate.getDate()).padStart(2, '0');
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const year = endDate.getFullYear();

        setDateFinDisplay(`${day}/${month}/${year}`);
        setDateFin(`${year}-${month}-${day}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    if (!bien || !locataire) {
      alert("Veuillez sélectionner un bien et un locataire");
      return;
    }

    setLoading(true);

    try {
      const formData = {
        property_id: parseInt(bien),
        tenant_id: parseInt(locataire),
        lease_type: typeBail,
        start_date: dateDebut,
        duration_months: parseInt(dureeMois),
        end_date: dateFin,
        rent_amount: parseFloat(loyer),
        charges_amount: charges ? parseFloat(charges) : 0,
        guarantee_amount: depot ? parseFloat(depot) : 0,
        billing_day: parseInt(jourPaiement),
        payment_frequency: periodicite,
        payment_mode: modePaiement,
        special_conditions: details,
        tacit_renewal: tacitRenewal // NOUVEAU CHAMP
      };

      await api.post('/landlord/leases', formData);
      
      navigate("/proprietaire/baux");
    } catch (error: any) {
      console.error("Erreur lors de la création du bail:", error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      
      const errorMsg = error.response?.data?.message || "Une erreur est survenue lors de la création du bail";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const BOLD_FONT = "'Merriweather', Georgia, serif";
  const SMALL_FONT = "'Manrope', sans-serif";

  const styles: Record<string, React.CSSProperties> = {
    page: {
      fontFamily: SMALL_FONT,
      background: "#ffffff",
      minHeight: "100vh",
      padding: "0",
    },
    topBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "18px 32px",
      marginBottom: "8px",
    },
    backBtn: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: "white",
      border: "1.5px solid #d1d5db",
      borderRadius: "8px",
      padding: "9px 18px",
      fontSize: "15px",
      color: "#374151",
      cursor: "pointer",
      fontWeight: 500,
      fontFamily: SMALL_FONT,
      transition: "all 0.15s",
    },
    topActions: {
      display: "flex",
      gap: "12px",
    },
    cancelBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background: "white",
      border: "1.5px solid #ef4444",
      borderRadius: "8px",
      padding: "9px 20px",
      fontSize: "15px",
      color: "#ef4444",
      cursor: "pointer",
      fontWeight: 600,
      fontFamily: SMALL_FONT,
      transition: "all 0.15s",
    },
    createBtn: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      background: "#16a34a",
      border: "none",
      borderRadius: "8px",
      padding: "9px 22px",
      fontSize: "15px",
      color: "white",
      cursor: "pointer",
      fontWeight: 600,
      fontFamily: SMALL_FONT,
      transition: "all 0.15s",
      boxShadow: "0 2px 8px rgba(22,163,74,0.25)",
    },
    createBtnDisabled: {
      opacity: 0.7,
      cursor: "not-allowed",
    },
    headerSection: {
      padding: "0 32px 20px",
    },
    title: {
      fontSize: "26px",
      fontWeight: 800,
      color: "#111827",
      margin: "0 0 4px 0",
      fontFamily: BOLD_FONT,
      letterSpacing: "-0.3px",
    },
    subtitle: {
      fontSize: "17px",
      color: "#6b7280",
      margin: 0,
      fontFamily: SMALL_FONT,
    },
    card: {
      background: "white",
      borderRadius: "16px",
      border: "1px solid #e5e7eb",
      padding: "32px",
      margin: "0 32px 32px",
      boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
    },
    cardTitle: {
      fontSize: "19px",
      fontWeight: 700,
      color: "#111827",
      marginBottom: "28px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      fontFamily: BOLD_FONT,
    },
    grid2: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "28px 40px",
      marginBottom: "28px",
    },
    fieldGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    label: {
      fontSize: "15px",
      fontWeight: 600,
      color: "#374151",
      fontFamily: SMALL_FONT,
    },
    requiredStar: {
      color: "#dc2626",
      marginLeft: "2px",
    },
    select: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1.5px solid #d1d5db",
      fontSize: "15px",
      color: "#111827",
      background: "white",
      appearance: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 12px center",
      cursor: "pointer",
      boxSizing: "border-box",
      outline: "none",
      fontFamily: SMALL_FONT,
    },
    input: {
      width: "100%",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1.5px solid #d1d5db",
      fontSize: "15px",
      color: "#111827",
      background: "white",
      boxSizing: "border-box",
      outline: "none",
      transition: "border-color 0.15s",
      fontFamily: SMALL_FONT,
    },
    inputReadOnly: {
      background: "#f9fafb",
      cursor: "not-allowed",
    },
    radioGroup: {
      display: "flex",
      gap: "20px",
      alignItems: "center",
      marginTop: "4px",
    },
    radioLabel: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "15px",
      color: "#374151",
      cursor: "pointer",
      fontWeight: 500,
      fontFamily: SMALL_FONT,
    },
    textarea: {
      width: "100%",
      padding: "12px 14px",
      borderRadius: "8px",
      border: "1.5px solid #d1d5db",
      fontSize: "15px",
      color: "#111827",
      background: "white",
      boxSizing: "border-box",
      outline: "none",
      resize: "vertical",
      minHeight: "110px",
      fontFamily: SMALL_FONT,
      transition: "border-color 0.15s",
    },
    helpText: {
      fontSize: "13px",
      color: "#9ca3af",
      marginTop: "4px",
      display: "flex",
      alignItems: "center",
      gap: "4px",
      fontFamily: SMALL_FONT,
    },
    emptyState: {
      background: "#fef3c7",
      border: "1px solid #f59e0b",
      borderRadius: "8px",
      padding: "1rem",
      textAlign: "center" as const,
    },
    emptyStateLink: {
      display: "inline-block",
      padding: "6px 12px",
      background: "#10b981",
      color: "white",
      borderRadius: "6px",
      textDecoration: "none",
      fontSize: "0.85rem",
    },
    bottomActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      marginTop: "24px",
      paddingTop: "20px",
      borderTop: "1px solid #f3f4f6",
    },
    fullWidth: {
      gridColumn: "1 / -1",
    },
    errorText: {
      fontSize: "13px",
      color: "#dc2626",
      marginTop: "4px",
    },
    checkboxRow: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
      marginTop: "8px",
      marginBottom: "16px",
    },
    checkboxLabel: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "15px",
      color: "#374151",
      cursor: "pointer",
      fontWeight: 500,
      fontFamily: SMALL_FONT,
    },
    checkbox: {
      width: "18px",
      height: "18px",
      accentColor: "#16a34a",
      cursor: "pointer",
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;800;900&family=Manrope:wght@400;500;600&display=swap');
        
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>
      <div style={styles.page}>
        {/* Top Action Bar */}
        <div style={styles.topBar}>
          <button
           
            onClick={() => navigate("/proprietaire/dashboard")}
          >
           
          </button>
          <div style={styles.topActions}>
            <button
              style={styles.cancelBtn}
              onClick={() => navigate("/proprietaire/biens")}
            >
              ✕ Annuler
            </button>
            <button
              type="submit"
              form="lease-form"
              style={{...styles.createBtn, ...(loading ? styles.createBtnDisabled : {})}}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" fill="none" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeOpacity="1" fill="none" />
                  </svg>
                  Création en cours...
                </>
              ) : (
                "Créer le contrat"
              )}
            </button>
          </div>
        </div>

        {/* Header */}
        <div style={styles.headerSection}>
          <h1 style={styles.title}>Nouveau contrat de location</h1>
          <p style={styles.subtitle}>Créez un nouveau contrat entre un bien et un locataire</p>
        </div>

        {/* Main Card */}
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span>🏠</span> Informations de location
          </div>

          <form id="lease-form" onSubmit={handleSubmit}>
            <div style={styles.grid2}>
              {/* Bien à louer */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Bien à louer <span style={styles.requiredStar}>*</span>
                </label>
                {loadingData ? (
                  <div style={{ textAlign: "center", padding: "20px" }}>
                    <div style={{ animation: "spin 1s linear infinite", width: "20px", height: "20px", border: "2px solid #f3f4f6", borderTopColor: "#16a34a", borderRadius: "50%", margin: "0 auto" }} />
                  </div>
                ) : properties.length === 0 ? (
                  <div style={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <p>Aucun bien disponible</p>
                    <a href="/proprietaire/biens/ajouter" style={styles.emptyStateLink}>
                      Créer un bien
                    </a>
                  </div>
                ) : (
                  <select
                    style={{...styles.select, ...(errors.property_id ? { borderColor: "#dc2626" } : {})}}
                    value={bien}
                    onChange={e => setBien(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner un bien</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name || 'Sans nom'} - {p.address || 'Sans adresse'} {p.city ? `- ${p.city}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {errors.property_id && <div style={styles.errorText}>{errors.property_id}</div>}
              </div>

              {/* Locataire */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Locataire <span style={styles.requiredStar}>*</span>
                </label>
                {tenants.length === 0 ? (
                  <div style={styles.emptyState}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="1.5">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <p>Aucun locataire disponible</p>
                    <a href="/proprietaire/locataires/creer" style={styles.emptyStateLink}>
                      Créer un locataire
                    </a>
                  </div>
                ) : (
                  <select
                    style={{...styles.select, ...(errors.tenant_id ? { borderColor: "#dc2626" } : {})}}
                    value={locataire}
                    onChange={e => setLocataire(e.target.value)}
                    required
                  >
                    <option value="">Sélectionner un locataire</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.first_name} {t.last_name} {t.user?.email ? `(${t.user.email})` : ''}
                      </option>
                    ))}
                  </select>
                )}
                {errors.tenant_id && <div style={styles.errorText}>{errors.tenant_id}</div>}
              </div>
            </div>

            {/* Type de bail - seul champ restant (statut retiré) */}
            <div style={styles.grid2}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Type de bail <span style={styles.requiredStar}>*</span>
                </label>
                <div style={styles.radioGroup}>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="typeBail"
                      value="nu"
                      checked={typeBail === "nu"}
                      onChange={() => setTypeBail("nu")}
                      style={{ accentColor: "#16a34a" }}
                    />
                    Bail nu
                  </label>
                  <label style={styles.radioLabel}>
                    <input
                      type="radio"
                      name="typeBail"
                      value="meuble"
                      checked={typeBail === "meuble"}
                      onChange={() => setTypeBail("meuble")}
                      style={{ accentColor: "#16a34a" }}
                    />
                    Bail meublé
                  </label>
                </div>
                {errors.lease_type && <div style={styles.errorText}>{errors.lease_type}</div>}
              </div>

              {/* Champ vide pour garder la grille */}
              <div></div>
            </div>

            <div style={styles.grid2}>
              {/* Loyer mensuel */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Loyer mensuel (FCFA) <span style={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text" inputMode="numeric"
                  style={{...styles.input, ...(errors.rent_amount ? { borderColor: "#dc2626" } : {})}}
                  placeholder="40.000"
                  value={loyer}
                  onChange={e => setLoyer(e.target.value)}
                  required
                />
                {errors.rent_amount && <div style={styles.errorText}>{errors.rent_amount}</div>}
              </div>

              {/* Charges */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Charges mensuelles (FCFA)
                </label>
                <input
                  type="text" inputMode="numeric"
                  style={styles.input}
                  placeholder="5.000"
                  value={charges}
                  onChange={e => setCharges(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.grid2}>
              {/* Dépôt de garantie */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Dépôt de garantie (FCFA)
                </label>
                <input
                  type="text" inputMode="numeric"
                  style={styles.input}
                  placeholder="20.000"
                  value={depot}
                  onChange={e => setDepot(e.target.value)}
                />
              </div>

              {/* Date de début */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Date de début du bail <span style={styles.requiredStar}>*</span>
                </label>
                <input
                  type="date"
                  style={{...styles.input, ...(errors.start_date ? { borderColor: "#dc2626" } : {})}}
                  value={dateDebut}
                  onChange={e => setDateDebut(e.target.value)}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.start_date && <div style={styles.errorText}>{errors.start_date}</div>}
              </div>
            </div>

            <div style={styles.grid2}>
              {/* Durée du bail */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Durée du bail (en mois) <span style={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text" inputMode="numeric"
                  style={{...styles.input, ...(errors.duration_months ? { borderColor: "#dc2626" } : {})}}
                  placeholder="12"
                  value={dureeMois}
                  onChange={e => setDureeMois(e.target.value)}
                  required
                />
                {errors.duration_months && <div style={styles.errorText}>{errors.duration_months}</div>}
              </div>

              {/* Date de fin estimée */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Date de fin estimée
                </label>
                <input
                  type="text"
                  style={{...styles.input, ...styles.inputReadOnly}}
                  value={dateFinDisplay}
                  readOnly
                  placeholder="Sélectionnez une durée"
                />
              </div>
            </div>

            {/* NOUVELLE CASE À COCHER : Reconduire le bail automatiquement */}
            <div style={styles.fullWidth}>
              <div style={styles.checkboxRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    style={styles.checkbox}
                    checked={tacitRenewal}
                    onChange={(e) => setTacitRenewal(e.target.checked)}
                  />
                  Reconduire le bail automatiquement
                </label>
              </div>
              <div style={styles.helpText}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Le bail sera reconduit pour la même durée
              </div>
            </div>

            <div style={styles.grid2}>
              {/* Jour de paiement */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Jour de paiement <span style={styles.requiredStar}>*</span>
                </label>
                <select
                  style={{...styles.select, ...(errors.billing_day ? { borderColor: "#dc2626" } : {})}}
                  value={jourPaiement}
                  onChange={e => setJourPaiement(e.target.value)}
                  required
                >
                  <option value="">Sélectionner</option>
                  {Array.from({ length: 28 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
                {errors.billing_day && <div style={styles.errorText}>{errors.billing_day}</div>}
              </div>

              {/* Périodicité */}
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Périodicité <span style={styles.requiredStar}>*</span>
                </label>
                <select
                  style={{...styles.select, ...(errors.payment_frequency ? { borderColor: "#dc2626" } : {})}}
                  value={periodicite}
                  onChange={e => setPeriodicite(e.target.value)}
                  required
                >
                  <option value="monthly">Mensuel</option>
                  <option value="quarterly">Trimestriel</option>
                  <option value="annually">Annuel</option>
                </select>
                {errors.payment_frequency && <div style={styles.errorText}>{errors.payment_frequency}</div>}
              </div>
            </div>

            {/* Mode de paiement */}
            <div style={{...styles.fieldGroup, ...styles.fullWidth, marginTop: "28px"}}>
              <label style={styles.label}>
                Mode de paiement
              </label>
              <select
                style={styles.select}
                value={modePaiement}
                onChange={e => setModePaiement(e.target.value)}
              >
                <option>Espèce</option>
                <option>Virement</option>
                <option>Chèque</option>
                <option>Mobile Money</option>
              </select>
            </div>

            {/* Reconduction automatique */}
            <div style={{...styles.fieldGroup, ...styles.fullWidth, marginTop: "28px"}}>
              <label style={styles.radioLabel}>
                <input
                  type="checkbox"
                  checked={autoRenew}
                  onChange={e => setAutoRenew(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: "#16a34a" }}
                />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Reconduire le bail automatiquement</span>
              </label>
              <div style={{...styles.helpText, marginLeft: '26px'}}>
                À la fin du bail, celui-ci sera reconduit pour la même durée sans intervention manuelle.
              </div>
            </div>

            {/* Conditions particulières */}
            <div style={{...styles.fieldGroup, ...styles.fullWidth, marginTop: "28px"}}>
              <label style={styles.label}>
                Détails / conditions particulières
              </label>
              <textarea
                style={styles.textarea}
                placeholder="Ex: Charges comprises, interdictions de fumer etc."
                value={details}
                onChange={e => setDetails(e.target.value)}
              />
              <div style={styles.helpText}>
                Ces informations seront ajoutées aux conditions générales du bail
              </div>
            </div>

            {/* Bottom actions */}
            <div style={styles.bottomActions}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => navigate("/proprietaire/biens")}
              >
                ✕ Annuler
              </button>
              <button
                type="submit"
                style={{...styles.createBtn, ...(loading ? styles.createBtnDisabled : {})}}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" fill="none" />
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeOpacity="1" fill="none" />
                    </svg>
                    Création en cours...
                  </>
                ) : (
                  "Créer le contrat"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default NouvelleLocation;