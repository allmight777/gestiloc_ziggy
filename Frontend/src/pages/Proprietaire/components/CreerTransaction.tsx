import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { propertyService, Property, leaseService, Lease, accountingService } from "../../../services/api";

interface CreerTransactionProps {
  notify?: (msg: string, type: "success" | "info" | "error") => void;
}

const CreerTransaction: React.FC<CreerTransactionProps> = ({ notify }) => {
  const navigate = useNavigate();
  
  // Estados del formulario
  const [transactionType, setTransactionType] = useState<string>("REVENU");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedLease, setSelectedLease] = useState<string>("");
  const [category, setCategory] = useState<string>("Loyer");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("virement");
  const [reference, setReference] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  
  // Estados para los datos del backend
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Récupérer les biens et baux depuis le backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const propsResponse = await propertyService.listProperties();
        if (propsResponse.data) {
          setProperties(propsResponse.data);
        }
        
        const leasesResponse = await leaseService.listLeases();
        setLeases(leasesResponse);
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        notify?.("Erreur lors du chargement des données", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [notify]);

  // Filtrer les baux par propriété sélectionnée
  const propertyLeases = selectedProperty 
    ? leases.filter(l => l.property_id === parseInt(selectedProperty) && l.status === 'active')
    : [];

  const BOLD_FONT = "'Merriweather', Georgia, serif";
  const SMALL_FONT = "'Manrope', sans-serif";

  // Style global
  const styles: Record<string, React.CSSProperties> = {
    page: {
      fontFamily: SMALL_FONT,
      background: "#f8fafc",
      minHeight: "100vh",
      padding: "2rem",
    },
    contentCard: {
      maxWidth: "1500px",
      margin: "0 auto",
      background: "rgba(255, 255, 255, 0.92)",
      borderRadius: "22px",
      boxShadow: "0 22px 70px rgba(0, 0, 0, 0.18)",
      overflow: "hidden",
      border: "1px solid rgba(112, 174, 72, 0.18)",
      position: "relative" as const,
      backdropFilter: "blur(10px)",
    },
    contentBody: {
      padding: "2.5rem",
      position: "relative" as const,
      zIndex: 1,
    },
    topActions: {
      marginBottom: "2rem",
    },
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "0.9rem 1.35rem",
      borderRadius: "14px",
      fontWeight: 950,
      fontSize: "0.9rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "2px solid rgba(112, 174, 72, 0.20)",
      background: "rgba(255, 255, 255, 0.92)",
      color: "#70AE48",
      textDecoration: "none",
      fontFamily: SMALL_FONT,
    },
    formCard: {
      background: "white",
      borderRadius: "18px",
      padding: "2rem",
      border: "2px solid rgba(112, 174, 72, 0.15)",
      boxShadow: "0 12px 40px rgba(0, 0, 0, 0.08)",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "2rem",
      marginBottom: "2rem",
    },
    formColumn: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "1.5rem",
    },
    formGroup: {
      marginBottom: "0",
    },
    formLabel: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.9rem",
      fontWeight: 950,
      color: "#0f172a",
      marginBottom: "0.5rem",
    },
    formControl: {
      width: "100%",
      padding: "0.9rem 1rem",
      borderRadius: "12px",
      border: "2px solid rgba(148, 163, 184, 0.25)",
      fontSize: "0.95rem",
      transition: "all 0.2s ease",
      background: "rgba(255, 255, 255, 0.92)",
      fontFamily: SMALL_FONT,
      boxSizing: "border-box" as const,
    },
    formSelect: {
      width: "100%",
      padding: "0.9rem 1rem",
      paddingRight: "2.5rem",
      borderRadius: "12px",
      border: "2px solid rgba(148, 163, 184, 0.25)",
      fontSize: "0.95rem",
      transition: "all 0.2s ease",
      background: "white",
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2370AE48' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 1rem center",
      backgroundSize: "16px",
      appearance: "none" as const,
      cursor: "pointer",
      fontFamily: SMALL_FONT,
      boxSizing: "border-box" as const,
    },
    formTextarea: {
      width: "100%",
      padding: "0.9rem 1rem",
      borderRadius: "12px",
      border: "2px solid rgba(148, 163, 184, 0.25)",
      fontSize: "0.95rem",
      transition: "all 0.2s ease",
      background: "rgba(255, 255, 255, 0.92)",
      fontFamily: SMALL_FONT,
      minHeight: "120px",
      resize: "vertical" as const,
      boxSizing: "border-box" as const,
    },
    inputWithIcon: {
      position: "relative" as const,
      display: "flex",
      alignItems: "center",
    },
    inputSuffix: {
      position: "absolute" as const,
      right: "1rem",
      fontWeight: 850,
      color: "#64748b",
      fontSize: "0.9rem",
    },
    infoCard: {
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "14px",
      border: "2px solid rgba(112, 174, 72, 0.15)",
      overflow: "hidden",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.05)",
    },
    infoHeader: {
      background: "linear-gradient(135deg, rgba(112, 174, 72, 0.10) 0%, rgba(139, 195, 74, 0.08) 100%)",
      padding: "1rem 1.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      borderBottom: "1px solid rgba(112, 174, 72, 0.15)",
    },
    infoHeaderTitle: {
      fontSize: "0.95rem",
      fontWeight: 950,
      color: "#70AE48",
      margin: 0,
    },
    infoContent: {
      padding: "1.25rem",
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: "1rem",
    },
    infoItem: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.25rem",
    },
    infoLabel: {
      fontSize: "0.75rem",
      fontWeight: 850,
      color: "#64748b",
      textTransform: "uppercase" as const,
      letterSpacing: "0.02em",
    },
    infoValue: {
      fontSize: "0.9rem",
      fontWeight: 750,
      color: "#0f172a",
    },
    infoValueHighlight: {
      color: "#70AE48",
      fontWeight: 850,
    },
    summaryCard: {
      background: "rgba(255, 255, 255, 0.95)",
      borderRadius: "14px",
      border: "2px solid rgba(112, 174, 72, 0.15)",
      overflow: "hidden",
      boxShadow: "0 8px 25px rgba(0, 0, 0, 0.05)",
    },
    summaryHeader: {
      background: "linear-gradient(135deg, rgba(112, 174, 72, 0.10) 0%, rgba(139, 195, 74, 0.08) 100%)",
      padding: "1rem 1.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      borderBottom: "1px solid rgba(112, 174, 72, 0.15)",
    },
    summaryHeaderTitle: {
      fontSize: "0.95rem",
      fontWeight: 950,
      color: "#70AE48",
      margin: 0,
    },
    summaryContent: {
      padding: "1.25rem",
    },
    summaryItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 0",
    },
    summaryLabel: {
      fontSize: "0.9rem",
      fontWeight: 850,
      color: "#64748b",
    },
    summaryValue: {
      fontSize: "0.95rem",
      fontWeight: 850,
      color: "#0f172a",
    },
    summaryDivider: {
      height: "1px",
      background: "rgba(148, 163, 184, 0.20)",
      margin: "0.5rem 0",
    },
    summaryTotal: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0.75rem 0",
    },
    summaryTotalLabel: {
      fontSize: "1rem",
      color: "#70AE48",
      fontWeight: 850,
    },
    summaryTotalValue: {
      fontSize: "1.1rem",
      color: "#70AE48",
      fontWeight: 950,
    },
    amountGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1rem",
      background: "rgba(112, 174, 72, 0.05)",
      padding: "1rem",
      borderRadius: "12px",
      border: "1px solid rgba(112, 174, 72, 0.12)",
    },
    amountItem: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.25rem",
    },
    amountLabel: {
      fontSize: "0.8rem",
      fontWeight: 850,
      color: "#64748b",
    },
    amountValue: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    currency: {
      fontSize: "0.9rem",
      fontWeight: 850,
      color: "#64748b",
      minWidth: "40px",
    },
    formActions: {
      display: "flex",
      gap: "1rem",
      marginTop: "2rem",
      paddingTop: "1.5rem",
      borderTop: "1px solid rgba(148, 163, 184, 0.15)",
    },
    buttonPrimary: {
      padding: "0.9rem 1.35rem",
      borderRadius: "14px",
      fontWeight: 950,
      fontSize: "0.9rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      background: "linear-gradient(135deg, #70AE48 0%, #8BC34A 100%)",
      color: "#fff",
      boxShadow: "0 14px 30px rgba(112, 174, 72, 0.22)",
      fontFamily: SMALL_FONT,
    },
    buttonSecondary: {
      padding: "0.9rem 1.35rem",
      borderRadius: "14px",
      fontWeight: 950,
      fontSize: "0.9rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: "2px solid rgba(112, 174, 72, 0.20)",
      background: "rgba(255, 255, 255, 0.92)",
      color: "#70AE48",
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      textDecoration: "none",
      fontFamily: SMALL_FONT,
    },
    alertBox: {
      borderRadius: "14px",
      padding: "1.25rem",
      marginBottom: "1.5rem",
      border: "1px solid",
      fontWeight: 850,
      display: "flex",
      alignItems: "flex-start",
      gap: "10px",
    },
    alertError: {
      background: "rgba(254, 242, 242, 0.92)",
      borderColor: "rgba(248, 113, 113, 0.30)",
      color: "#991b1b",
    },
    required: {
      color: "#ef4444",
      marginLeft: "2px",
    },
  };

  const selectedLeaseData = leases.find(l => l.id === parseInt(selectedLease));
  const selectedPropertyData = properties.find(p => p.id === parseInt(selectedProperty));

  // Calcul des montants
  const amountValue = parseFloat(amount) || 0;
  const feeRate = 0.05;
  const fee = amountValue * feeRate;
  const net = amountValue - fee;

  // Formatage des nombres
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return formatNumber(num) + ' FCFA';
  };

  const handleSubmit = async () => {
    const validationErrors: string[] = [];

    if (!selectedLease) validationErrors.push("Veuillez sélectionner un bail.");
    if (!amount || amountValue <= 0) validationErrors.push("Veuillez saisir un montant valide.");
    if (!paymentMethod) validationErrors.push("Veuillez sélectionner une méthode de paiement.");
    if (!paymentDate) validationErrors.push("Veuillez sélectionner une date.");

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrors([]);

    try {
      const transactionData = {
        type: transactionType,
        property_id: parseInt(selectedProperty),
        lease_id: parseInt(selectedLease),
        category: category,
        description: description || null,
        amount: amountValue,
        date: paymentDate,
        payment_method: paymentMethod,
        reference: reference || null,
        notes: notes || null,
      };

      console.log("Payload envoyé au backend:", transactionData);

      await accountingService.createTransaction(transactionData);
      
      notify?.("Transaction créée avec succès!", "success");
      navigate("/proprietaire/comptabilite");
    } catch (error: any) {
      console.error("Erreur lors de la création de la transaction:", error);
      if (error.response?.data?.errors) {
        const backendErrors = Object.values(error.response.data.errors).flat();
        setErrors(backendErrors as string[]);
      } else {
        setErrors([error.message || "Erreur lors de la création de la transaction."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ ...styles.page, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #eef2ee', borderTopColor: '#70AE48', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#6b7280' }}>Chargement...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;800;900&family=Manrope:wght@400;500;600;700;800;950&display=swap');
        .form-control:focus {
          outline: none;
          border-color: #70AE48 !important;
          box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.15) !important;
        }
        .button-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 18px 34px rgba(112, 174, 72, 0.28) !important;
        }
        .button-secondary:hover {
          background: rgba(112, 174, 72, 0.06) !important;
        }
        @keyframes highlight {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
        .summary-total-value {
          animation: highlight 0.5s ease;
        }
      `}</style>
      
      <div style={styles.page}>
        <div style={styles.contentCard}>
          <div style={styles.contentBody}>
            
            {/* Affichage des erreurs */}
            {errors.length > 0 && (
              <div style={{ ...styles.alertBox, ...styles.alertError }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                  <strong>Erreurs de validation</strong>
                  <ul style={{ marginTop: '8px', paddingLeft: '1rem', fontWeight: 650, fontSize: '0.9rem' }}>
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} style={styles.formCard} id="paymentForm">
              
              {/* Top Actions - Bouton retour */}
              <div style={styles.topActions}>
                <button 
                  type="button"
                  style={styles.backButton}
                  onClick={() => navigate("/proprietaire/comptabilite")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Retour à la liste
                </button>
              </div>

              {/* Grille principale */}
              <div style={styles.formGrid}>
                
                {/* Colonne gauche */}
                <div style={styles.formColumn}>
                  
                  {/* Sélection du bail */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                      Bail concerné *
                    </label>
                    <select 
                      style={styles.formSelect}
                      value={selectedLease}
                      onChange={(e) => {
                        setSelectedLease(e.target.value);
                        const lease = leases.find(l => l.id === parseInt(e.target.value));
                        if (lease) {
                          setSelectedProperty(lease.property_id.toString());
                          // Suggérer le montant du loyer
                          if (lease.rent_amount && !amount) {
                            setAmount(lease.rent_amount.toString());
                          }
                        }
                      }}
                      required
                    >
                      <option value="">Sélectionnez un bail</option>
                      {leases.map(lease => {
                        const property = properties.find(p => p.id === lease.property_id);
                        return (
                          <option 
                            key={lease.id} 
                            value={lease.id}
                          >
                            {property?.name || 'Bien'} - {lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'Locataire'}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Montant total */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                      </svg>
                      Montant total (FCFA) *
                    </label>
                    <div style={styles.inputWithIcon}>
                      <input 
                        type="text" inputMode="numeric" className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        style={styles.formControl}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0.01" 
                        step="0.01"
                        required
                        placeholder="0,00"
                      />
                      <span style={styles.inputSuffix}>FCFA</span>
                    </div>
                  </div>

                  {/* Calcul automatique */}
                  <div style={styles.amountGrid}>
                    <div style={styles.amountItem}>
                      <span style={styles.amountLabel}>Frais (5%)</span>
                      <div style={styles.amountValue}>
                        <input 
                          type="text" 
                          style={{ ...styles.formControl, background: '#f8fafc' }} 
                          readOnly 
                          value={formatNumber(fee)}
                        />
                        <span style={styles.currency}>FCFA</span>
                      </div>
                    </div>
                    <div style={styles.amountItem}>
                      <span style={styles.amountLabel}>Montant net</span>
                      <div style={styles.amountValue}>
                        <input 
                          type="text" 
                          style={{ ...styles.formControl, background: '#f8fafc', fontWeight: 850 }} 
                          readOnly 
                          value={formatNumber(net)}
                        />
                        <span style={styles.currency}>FCFA</span>
                      </div>
                    </div>
                  </div>

                  {/* Date de paiement - CORRIGÉ */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Date du paiement *
                    </label>
                    <input 
                      type="date" 
                      style={styles.formControl}
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                    />
                  </div>

                  {/* Méthode de paiement */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                        <path d="M22 10H2"></path>
                        <path d="M7 15h.01"></path>
                        <path d="M11 15h2"></path>
                      </svg>
                      Méthode de paiement *
                    </label>
                    <select 
                      style={styles.formSelect}
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      required
                    >
                      <option value="">Sélectionnez une méthode</option>
                      <option value="virement">Virement bancaire</option>
                      <option value="especes">Espèces</option>
                      <option value="cheque">Chèque</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="card">Carte bancaire</option>
                    </select>
                  </div>
                </div>

                {/* Colonne droite */}
                <div style={styles.formColumn}>
                  
                  {/* Notes additionnelles */}
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Notes additionnelles
                    </label>
                    <textarea
                      style={styles.formTextarea}
                      placeholder="Ajoutez des informations supplémentaires sur ce paiement..."
                      rows={5}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Informations du bail */}
                  {selectedLeaseData && (
                    <div style={styles.infoCard}>
                      <div style={styles.infoHeader}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"></circle>
                          <line x1="12" y1="16" x2="12" y2="12"></line>
                          <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <h3 style={styles.infoHeaderTitle}>Informations du bail</h3>
                      </div>
                      <div style={styles.infoContent}>
                        <div style={styles.infoGrid}>
                          <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Bien</span>
                            <span style={styles.infoValue}>
                              {selectedPropertyData?.name || selectedPropertyData?.address || '-'}
                            </span>
                          </div>
                          <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Locataire</span>
                            <span style={styles.infoValue}>
                              {selectedLeaseData.tenant ? 
                                `${selectedLeaseData.tenant.first_name || ''} ${selectedLeaseData.tenant.last_name || ''}`.trim() || 'N/A' 
                                : '-'}
                            </span>
                          </div>
                          <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Loyer mensuel</span>
                            <span style={{ ...styles.infoValue, ...styles.infoValueHighlight }}>
                              {selectedLeaseData.rent_amount ? formatCurrency(parseFloat(selectedLeaseData.rent_amount.toString())) : '-'}
                            </span>
                          </div>
                          <div style={styles.infoItem}>
                            <span style={styles.infoLabel}>Solde restant</span>
                            <span style={styles.infoValue}>À calculer</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Récapitulatif */}
                  <div style={styles.summaryCard}>
                    <div style={styles.summaryHeader}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                        <line x1="8" y1="6" x2="16" y2="6"></line>
                        <line x1="8" y1="10" x2="16" y2="10"></line>
                        <line x1="8" y1="14" x2="12" y2="14"></line>
                      </svg>
                      <h3 style={styles.summaryHeaderTitle}>Récapitulatif</h3>
                    </div>
                    <div style={styles.summaryContent}>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Montant total</span>
                        <span style={styles.summaryValue}>{formatCurrency(amountValue)}</span>
                      </div>
                      <div style={styles.summaryItem}>
                        <span style={styles.summaryLabel}>Frais de gestion</span>
                        <span style={styles.summaryValue}>{formatCurrency(fee)}</span>
                      </div>
                      <div style={styles.summaryDivider}></div>
                      <div style={styles.summaryTotal}>
                        <span style={styles.summaryTotalLabel}>Montant net</span>
                        <span style={styles.summaryTotalValue} className="summary-total-value">{formatCurrency(net)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div style={styles.formActions}>
                <button 
                  type="submit"
                  style={styles.buttonPrimary}
                  disabled={isSubmitting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer le paiement"}
                </button>
                <button 
                  type="button"
                  style={styles.buttonSecondary}
                  onClick={() => navigate("/proprietaire/comptabilite")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreerTransaction;