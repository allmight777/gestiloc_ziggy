import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";

const AjouterLocataire = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("infos");
  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<Record<string, string[]>>({});

  // États du formulaire
  const [formData, setFormData] = useState({
    tenant_type: "particulier",
    first_name: "",
    last_name: "",
    birth_date: "",
    birth_place: "",
    marital_status: "single",
    phone: "",
    email: "",
    address: "",
    city: "",
    country: "France",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_email: "",
    notes: "",
    profession: "",
    employer: "",
    annual_income: "",
    monthly_income: "",
    contract_type: "",
    has_guarantor: false,
    guarantor_name: "",
    guarantor_phone: "",
    guarantor_email: "",
    guarantor_birth_date: "",
    guarantor_birth_place: "",
    guarantor_profession: "",
    guarantor_income: "",
    guarantor_monthly_income: "",
    guarantor_address: "",
    document_type: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Effacer les erreurs API quand l'utilisateur modifie le champ
    if (apiErrors[name]) {
      setApiErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFileName("");
    const input = document.getElementById('documentFile') as HTMLInputElement;
    if (input) input.value = '';
  };

  const toggleGuarantor = () => {
    setHasGuarantor(!hasGuarantor);
    setFormData(prev => ({ ...prev, has_guarantor: !hasGuarantor }));
  };

  const showTab = (tabName: string) => {
    setActiveTab(tabName);
  };

  const validateAndGo = (current: string, next: string) => {
    setActiveTab(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiErrors({});

    try {
      // Préparer les données pour l'API - correspond à InviteTenantRequest
      const payload: any = {
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        birth_date: formData.birth_date,
        birth_place: formData.birth_place,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        marital_status: formData.marital_status,
        emergency_contact_name: formData.emergency_contact_name || undefined,
        emergency_contact_phone: formData.emergency_contact_phone || undefined,
        emergency_contact_email: formData.emergency_contact_email || undefined,
        profession: formData.profession,
        employer: formData.employer || undefined,
        contract_type: formData.contract_type || undefined,
        monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : undefined,
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : undefined,
        has_guarantor: hasGuarantor,
      };

      // Ajouter les infos du garant si nécessaire
      if (hasGuarantor) {
        payload.guarantor_name = formData.guarantor_name;
        payload.guarantor_phone = formData.guarantor_phone;
        payload.guarantor_email = formData.guarantor_email;
        payload.guarantor_profession = formData.guarantor_profession;
        payload.guarantor_address = formData.guarantor_address;
        payload.guarantor_birth_date = formData.guarantor_birth_date;
        payload.guarantor_birth_place = formData.guarantor_birth_place;
        
        if (formData.guarantor_income) {
          payload.guarantor_annual_income = parseFloat(formData.guarantor_income);
        }
        if (formData.guarantor_monthly_income) {
          payload.guarantor_monthly_income = parseFloat(formData.guarantor_monthly_income);
        }
      }

      console.log("Envoi des données:", payload);

      // Appel API pour inviter le locataire
      const response = await api.post('/tenants/invite', payload);

      console.log("Réponse API:", response.data);

      // Si un fichier est sélectionné, on l'uploadera après la création du locataire
      if (selectedFile && response.data.tenant?.id) {
        const formDataFile = new FormData();
        formDataFile.append('documents[]', selectedFile);
        
        await api.post(`/tenants/${response.data.tenant.id}/documents`, formDataFile, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      // ✅ SOLUTION SIMPLE : Utiliser sessionStorage pour passer le message
      sessionStorage.setItem('tenant_success', 'Locataire invité avec succès ! Un email a été envoyé.');
      
      // ✅ Redirection vers la page de liste
      window.location.href = "/proprietaire/tenants";

    } catch (error: any) {
      console.error("Erreur lors de l'envoi:", error);
      
      if (error.response?.data?.errors) {
        // Afficher les erreurs de validation
        setApiErrors(error.response.data.errors);
        
        // Afficher un message d'erreur général
        const errorMessages = Object.values(error.response.data.errors).flat();
        alert("Erreur de validation:\n" + errorMessages.join("\n"));
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Une erreur est survenue lors de l'envoi du formulaire");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const confirmCancel = () => {
    if (window.confirm('Êtes-vous sûr de vouloir annuler ? Les modifications seront perdues.')) {
      window.location.href = "/proprietaire/tenants";
    }
  };

  // Fonction pour afficher les erreurs API d'un champ
  const getFieldError = (fieldName: string) => {
    return apiErrors[fieldName] ? apiErrors[fieldName][0] : null;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&display=swap');

        :root {
          --gradA: #70AE48;
          --gradB: #8BC34A;
          --indigo: #70AE48;
          --violet: #8BC34A;
          --emerald: #10b981;
          --ink: #0f172a;
          --muted: #64748b;
          --muted2: #94a3b8;
          --line: rgba(15,23,42,.10);
          --line2: rgba(15,23,42,.08);
          --shadow: 0 22px 70px rgba(0,0,0,.18);
        }

        * {
          box-sizing: border-box;
        }

        .form-container {
          min-height: 100vh;
          background: #ffffff;
          padding: 2rem;
          position: relative;
          font-family: 'Manrope', sans-serif;
        }

        .form-container::before {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(900px 520px at 12% -8%, rgba(112, 174, 72, .16) 0%, rgba(112, 174, 72, 0) 62%),
            radial-gradient(900px 520px at 92% 8%, rgba(139, 195, 74, .14) 0%, rgba(139, 195, 74, 0) 64%),
            radial-gradient(700px 420px at 40% 110%, rgba(16,185,129,.10) 0%, rgba(16,185,129,0) 60%);
          pointer-events: none;
          z-index: -2;
        }

        .form-card {
          max-width: 1200px;
          margin: 0 auto;
          background: rgba(255,255,255,.92);
          border-radius: 22px;
          box-shadow: var(--shadow);
          overflow: hidden;
          border: 1px solid rgba(112, 174, 72, .18);
          position: relative;
          backdrop-filter: blur(10px);
        }

        .form-body {
          padding: 2rem;
          position: relative;
          z-index: 1;
        }

        .top-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .top-actions-right {
          display: flex;
          gap: .75rem;
          flex-wrap: wrap;
        }

        .button {
          padding: 0.7rem 1.2rem;
          border-radius: 12px;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-family: 'Manrope', sans-serif;
          white-space: nowrap;
          text-decoration: none;
        }

        .button-primary {
          background: #70AE48;
          color: #fff;
          box-shadow: 0 10px 20px rgba(112, 174, 72, .22);
        }

        .button-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 25px rgba(112, 174, 72, .28);
        }

        .button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-secondary {
          background: rgba(255,255,255,.92);
          color: #70AE48;
          border: 2px solid rgba(112, 174, 72, .20);
        }

        .button-secondary:hover {
          background: rgba(112, 174, 72, .06);
        }

        .button-danger {
          background: rgba(255,255,255,.92);
          color: #e11d48;
          border: 2px solid rgba(225,29,72,.18);
        }

        .button-danger:hover {
          background: rgba(225,29,72,.06);
        }

        .tab-nav {
          display: flex;
          gap: 1rem;
          border-bottom: 2px solid rgba(148,163,184,.35);
          margin-bottom: 1.5rem;
          overflow-x: auto;
          padding-bottom: .1rem;
        }

        .tab-button {
          padding: 0.7rem 0;
          border: none;
          background: transparent;
          font-size: 0.85rem;
          font-weight: 800;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          color: #64748b;
          white-space: nowrap;
          transition: color .15s ease, border-color .15s ease;
          font-family: 'Manrope', sans-serif;
        }

        .tab-button.active {
          color: #70AE48;
          border-color: #70AE48;
        }

        .section {
          margin-bottom: 2rem;
          background: rgba(255,255,255,.72);
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px solid rgba(17,24,39,.08);
          box-shadow: 0 8px 25px rgba(17,24,39,.05);
          backdrop-filter: blur(10px);
        }

        .section-title {
          font-size: 1rem;
          font-weight: 900;
          color: var(--ink);
          margin: 0 0 1rem 0;
          padding-bottom: 0.7rem;
          border-bottom: 2px solid rgba(112, 174, 72, .25);
        }

        .form-grid {
          display: grid;
          gap: 1rem;
        }

        .form-grid-2 {
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .form-grid-3 {
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .form-label {
          font-size: 0.75rem;
          font-weight: 800;
          color: #334155;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-family: 'Manrope', sans-serif;
        }

        .required {
          color: #e11d48;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.6rem 0.9rem;
          border: 2px solid rgba(148,163,184,.35);
          border-radius: 10px;
          font-size: 0.85rem;
          color: var(--ink);
          background: rgba(255,255,255,.92);
          transition: all 0.2s ease;
          font-family: 'Manrope', sans-serif;
          font-weight: 600;
          outline: none;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #70AE48;
          box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.14);
        }

        .form-input.error, .form-select.error, .form-textarea.error {
          border-color: #e11d48;
          background-color: rgba(225, 29, 72, 0.05);
        }

        select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.9rem center;
          padding-right: 2.2rem;
        }

        .form-input-icon {
          position: relative;
        }

        .form-input-icon .form-input {
          padding-left: 2.5rem;
        }

        .icon-wrapper {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--muted);
          z-index: 10;
        }

        .bottom-actions {
          display: flex;
          justify-content: flex-end;
          gap: .75rem;
          padding-top: 1.2rem;
          margin-top: 0.5rem;
          border-top: 2px solid rgba(148,163,184,.3);
          flex-wrap: wrap;
        }

        .field-error {
          display: flex;
          gap: 6px;
          align-items: flex-start;
          color: #be123c;
          font-weight: 800;
          font-size: .7rem;
          line-height: 1.2;
          margin-top: 2px;
        }

        .input-error {
          border-color: rgba(225,29,72,.72) !important;
          box-shadow: 0 0 0 3px rgba(225,29,72,.10) !important;
        }

        .switch-item {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          margin-bottom: 1rem;
        }

        .switch {
          width: 45px;
          height: 24px;
          background: rgba(148,163,184,.35);
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .switch.active {
          background: #70AE48;
        }

        .switch-thumb {
          width: 18px;
          height: 18px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .switch.active .switch-thumb {
          transform: translateX(21px);
        }

        .switch-label {
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--ink);
          cursor: pointer;
        }

        .helper-text {
          color: var(--muted);
          font-size: 0.75rem;
          font-weight: 600;
          margin-top: 0.2rem;
        }

        .file-upload-wrapper {
          position: relative;
          width: 100%;
        }

        .file-upload-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
          z-index: 10;
        }

        .file-upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          border: 2px dashed rgba(148,163,184,.5);
          border-radius: 12px;
          background: rgba(255,255,255,.5);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          gap: 0.4rem;
          color: var(--muted);
        }

        .file-upload-label:hover {
          border-color: #70AE48;
          background: rgba(112, 174, 72, .05);
        }

        .file-upload-label span {
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--ink);
        }

        .file-upload-label small {
          font-size: 0.7rem;
        }

        .file-preview {
          margin-top: 0.8rem;
          padding: 0.8rem;
          background: rgba(112, 174, 72, 0.1);
          border: 1px solid rgba(112, 174, 72, 0.3);
          border-radius: 10px;
        }

        .file-preview-content {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: #2e5e1e;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .file-remove {
          margin-left: auto;
          background: rgba(225,29,72,.1);
          border: none;
          color: #e11d48;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .file-remove:hover {
          background: rgba(225,29,72,.2);
        }

        .icon-16 {
          width: 14px;
          height: 14px;
        }

        .api-error-banner {
          background: #fee2e2;
          border: 1px solid #f87171;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
          color: #b91c1c;
          font-size: 0.9rem;
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="form-container">
        <div className="form-card">
          <div className="form-body">
            {/* Top actions */}
            <div className="top-actions">
              <a href="#" className="button button-secondary" onClick={(e) => { e.preventDefault(); window.location.href = "/proprietaire/tenants"; }}>
                <svg className="icon-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Retour à la liste
              </a>
              <div className="top-actions-right">
                <button className="button button-danger" type="button" onClick={confirmCancel} disabled={isLoading}>
                  <svg className="icon-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Annuler
                </button>
                <button className="button button-primary" type="submit" form="tenantForm" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg className="icon-16 loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" fill="none" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeOpacity="1" fill="none" />
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <svg className="icon-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                        <polyline points="17 21 17 13 7 13 7 21"/>
                        <polyline points="7 3 7 8 15 8"/>
                      </svg>
                      Enregistrer le locataire
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Affichage des erreurs API générales */}
            {Object.keys(apiErrors).length > 0 && (
              <div className="api-error-banner">
                <strong>Erreurs de validation :</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
                  {Object.entries(apiErrors).map(([field, messages]) => (
                    <li key={field}>
                      <strong>{field}:</strong> {messages.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tab navigation - sans icônes */}
            <div className="tab-nav">
              <button type="button" className={`tab-button ${activeTab === 'infos' ? 'active' : ''}`} onClick={() => showTab('infos')}>
                Informations & Coordonnées
              </button>
              <button type="button" className={`tab-button ${activeTab === 'pro' ? 'active' : ''}`} onClick={() => showTab('pro')}>
                Situation professionnelle
              </button>
              <button type="button" className={`tab-button ${activeTab === 'garant' ? 'active' : ''}`} onClick={() => showTab('garant')}>
                Garant
              </button>
              <button type="button" className={`tab-button ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => showTab('documents')}>
                Documents
              </button>
            </div>

            <form id="tenantForm" onSubmit={handleSubmit} encType="multipart/form-data">
              {/* Tab 1: Informations personnelles */}
              {activeTab === 'infos' && (
                <div className="section">
                  <h2 className="section-title">Informations personnelles</h2>

                  <div className="form-grid form-grid-2">
                    {/* Type de locataire - full width */}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">
                        Type de locataire <span className="required">*</span>
                      </label>
                      <select 
                        className={`form-input ${apiErrors.tenant_type ? 'error' : ''}`} 
                        name="tenant_type" 
                        value={formData.tenant_type} 
                        onChange={handleChange} 
                        required
                      >
                        <option value="">Sélectionner le type</option>
                        <option value="particulier">Particulier</option>
                        <option value="etudiant">Étudiant</option>
                        <option value="salarie">Salarié</option>
                        <option value="independant">Indépendant</option>
                        <option value="retraite">Retraité</option>
                        <option value="entreprise">Entreprise</option>
                        <option value="association">Association</option>
                      </select>
                      {getFieldError('tenant_type') && (
                        <div className="field-error">{getFieldError('tenant_type')}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Prénom <span className="required">*</span>
                      </label>
                      <input 
                        className={`form-input ${apiErrors.first_name ? 'error' : ''}`} 
                        type="text" 
                        name="first_name" 
                        value={formData.first_name} 
                        onChange={handleChange} 
                        placeholder="Jean" 
                        required 
                      />
                      {getFieldError('first_name') && (
                        <div className="field-error">{getFieldError('first_name')}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Nom <span className="required">*</span>
                      </label>
                      <input 
                        className={`form-input ${apiErrors.last_name ? 'error' : ''}`} 
                        type="text" 
                        name="last_name" 
                        value={formData.last_name} 
                        onChange={handleChange} 
                        placeholder="Dupont" 
                        required 
                      />
                      {getFieldError('last_name') && (
                        <div className="field-error">{getFieldError('last_name')}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Date de naissance <span className="required">*</span>
                      </label>
                      <div className="form-input-icon">
                        <div className="icon-wrapper">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                        <input 
                          className={`form-input ${apiErrors.birth_date ? 'error' : ''}`} 
                          type="date" 
                          name="birth_date" 
                          value={formData.birth_date} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      {getFieldError('birth_date') && (
                        <div className="field-error">{getFieldError('birth_date')}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">
                        Lieu de naissance <span className="required">*</span>
                      </label>
                      <input 
                        className={`form-input ${apiErrors.birth_place ? 'error' : ''}`} 
                        type="text" 
                        name="birth_place" 
                        value={formData.birth_place} 
                        onChange={handleChange} 
                        placeholder="Ville, Pays" 
                        required 
                      />
                      {getFieldError('birth_place') && (
                        <div className="field-error">{getFieldError('birth_place')}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Situation familiale</label>
                      <select className="form-input" name="marital_status" value={formData.marital_status} onChange={handleChange}>
                        <option value="single">Célibataire</option>
                        <option value="married">Marié(e)</option>
                        <option value="divorced">Divorcé(e)</option>
                        <option value="widowed">Veuf/Veuve</option>
                        <option value="pacs">PACS</option>
                        <option value="concubinage">Concubinage</option>
                      </select>
                    </div>
                  </div>

                  {/* Coordonnées intégrées */}
                  <div style={{ marginTop: '1.2rem' }}>
                    <h3 className="form-label" style={{ marginBottom: '0.6rem', fontSize: '1rem', color: '#70AE48' }}>
                      Coordonnées
                    </h3>
                    <div className="form-grid form-grid-2">
                      <div className="form-group">
                        <label className="form-label">
                          Email <span className="required">*</span>
                        </label>
                        <div className="form-input-icon">
                          <div className="icon-wrapper">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                              <polyline points="22,6 12,13 2,6"/>
                            </svg>
                          </div>
                          <input 
                            className={`form-input ${apiErrors.email ? 'error' : ''}`} 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            placeholder="jean.dupont@exemple.com" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Téléphone <span className="required">*</span>
                        </label>
                        <div className="form-input-icon">
                          <div className="icon-wrapper">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                          </div>
                          <input 
                            className={`form-input ${apiErrors.phone ? 'error' : ''}`} 
                            type="tel" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            placeholder="06 12 34 56 78" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">
                          Adresse <span className="required">*</span>
                        </label>
                        <div className="form-input-icon">
                          <div className="icon-wrapper">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                          </div>
                          <input 
                            className={`form-input ${apiErrors.address ? 'error' : ''}`} 
                            type="text" 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            placeholder="123 Rue de la Paix" 
                            required 
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Ville <span className="required">*</span>
                        </label>
                        <input className="form-input" type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Paris" required />
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          Pays <span className="required">*</span>
                        </label>
                        <input className="form-input" type="text" name="country" value={formData.country} onChange={handleChange} placeholder="France" required />
                      </div>
                    </div>
                  </div>

                  {/* Contact d'urgence */}
                  <div style={{ marginTop: '1.2rem' }}>
                    <h3 className="form-label" style={{ marginBottom: '0.6rem', fontSize: '1rem', color: '#70AE48' }}>
                      Contact d'urgence
                    </h3>
                    <div className="form-grid form-grid-3">
                      <div className="form-group">
                        <label className="form-label">Nom et prénom</label>
                        <input className="form-input" type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} placeholder="Nom et prénom" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Téléphone</label>
                        <div className="form-input-icon">
                          <div className="icon-wrapper">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
                            </svg>
                          </div>
                          <input className="form-input" type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} placeholder="06 12 34 56 78" />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email</label>
                        <div className="form-input-icon">
                          <div className="icon-wrapper">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                              <polyline points="22,6 12,13 2,6"/>
                            </svg>
                          </div>
                          <input className="form-input" type="email" name="emergency_contact_email" value={formData.emergency_contact_email} onChange={handleChange} placeholder="email@exemple.com" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ marginTop: '1.2rem' }}>
                    <label className="form-label">Notes et commentaires</label>
                    <textarea className="form-textarea" name="notes" value={formData.notes} onChange={handleChange} placeholder="Informations complémentaires sur le locataire..." rows={2} />
                  </div>

                  <div className="bottom-actions">
                    <button type="button" className="button button-primary" onClick={() => validateAndGo('infos', 'pro')}>
                      Suivant : Profession
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Situation professionnelle */}
              {activeTab === 'pro' && (
                <div className="section">
                  <h2 className="section-title">Situation professionnelle</h2>

                  <div className="form-grid form-grid-2">
                    <div className="form-group">
                      <label className="form-label">
                        Profession <span className="required">*</span>
                      </label>
                      <input 
                        className={`form-input ${apiErrors.profession ? 'error' : ''}`} 
                        type="text" 
                        name="profession" 
                        value={formData.profession} 
                        onChange={handleChange} 
                        placeholder="Ex: Développeur web" 
                        required 
                      />
                      {getFieldError('profession') && (
                        <div className="field-error">{getFieldError('profession')}</div>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Employeur</label>
                      <input className="form-input" type="text" name="employer" value={formData.employer} onChange={handleChange} placeholder="Nom de l'entreprise" />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Revenu annuel (FCFA)</label>
                      <div className="form-input-icon">
                        <div className="icon-wrapper">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                            <path d="M12 6v2M12 16v2"/>
                          </svg>
                        </div>
                        <input className="form-input" type="number" name="annual_income" value={formData.annual_income} onChange={handleChange} placeholder="45000" min="0" step="0.01" />
                      </div>
                      <p className="helper-text">Optionnel</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Revenu mensuel (FCFA)</label>
                      <div className="form-input-icon">
                        <div className="icon-wrapper">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                            <path d="M12 6v2M12 16v2"/>
                          </svg>
                        </div>
                        <input className="form-input" type="number" name="monthly_income" value={formData.monthly_income} onChange={handleChange} placeholder="3750" min="0" step="0.01" />
                      </div>
                      <p className="helper-text">Optionnel</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Type de contrat</label>
                      <select className="form-input" name="contract_type" value={formData.contract_type} onChange={handleChange}>
                        <option value="">Sélectionner un type de contrat</option>
                        <option value="cdi">CDI</option>
                        <option value="cdd">CDD</option>
                        <option value="interim">Intérim</option>
                        <option value="independant">Indépendant</option>
                        <option value="etudiant">Étudiant</option>
                        <option value="retraite">Retraité</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div className="bottom-actions">
                    <button type="button" className="button button-secondary" onClick={() => showTab('contact')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                      </svg>
                      Précédent
                    </button>
                    <button type="button" className="button button-primary" onClick={() => validateAndGo('pro', 'garant')}>
                      Suivant : Garant
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 4: Garant */}
              {activeTab === 'garant' && (
                <div className="section">
                  <h2 className="section-title">Garant</h2>

                  <div className="switch-item">
                    <div className={`switch ${hasGuarantor ? 'active' : ''}`} onClick={toggleGuarantor}>
                      <div className="switch-thumb"></div>
                    </div>
                    <span className="switch-label">Le locataire a-t-il un garant ?</span>
                  </div>

                  {hasGuarantor && (
                    <div>
                      <div style={{ background: 'rgba(112, 174, 72, 0.08)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(112, 174, 72, 0.18)', marginBottom: '1rem' }}>
                        <h3 className="form-label" style={{ marginBottom: '0.8rem', fontSize: '0.8rem' }}>
                          Informations du garant
                        </h3>

                        <div className="form-grid form-grid-2">
                          <div className="form-group">
                            <label className="form-label">
                              Nom et prénom <span className="required">*</span>
                            </label>
                            <input 
                              className={`form-input ${apiErrors.guarantor_name ? 'error' : ''}`} 
                              type="text" 
                              name="guarantor_name" 
                              value={formData.guarantor_name} 
                              onChange={handleChange} 
                              placeholder="Nom et prénom du garant" 
                            />
                            {getFieldError('guarantor_name') && (
                              <div className="field-error">{getFieldError('guarantor_name')}</div>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Téléphone <span className="required">*</span>
                            </label>
                            <div className="form-input-icon">
                              <div className="icon-wrapper">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z"/>
                                </svg>
                              </div>
                              <input 
                                className={`form-input ${apiErrors.guarantor_phone ? 'error' : ''}`} 
                                type="tel" 
                                name="guarantor_phone" 
                                value={formData.guarantor_phone} 
                                onChange={handleChange} 
                                placeholder="06 12 34 56 78" 
                              />
                            </div>
                            {getFieldError('guarantor_phone') && (
                              <div className="field-error">{getFieldError('guarantor_phone')}</div>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Email <span className="required">*</span>
                            </label>
                            <div className="form-input-icon">
                              <div className="icon-wrapper">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                  <polyline points="22,6 12,13 2,6"/>
                                </svg>
                              </div>
                              <input 
                                className={`form-input ${apiErrors.guarantor_email ? 'error' : ''}`} 
                                type="email" 
                                name="guarantor_email" 
                                value={formData.guarantor_email} 
                                onChange={handleChange} 
                                placeholder="garant@exemple.com" 
                              />
                            </div>
                            {getFieldError('guarantor_email') && (
                              <div className="field-error">{getFieldError('guarantor_email')}</div>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Date de naissance <span className="required">*</span>
                            </label>
                            <div className="form-input-icon">
                              <div className="icon-wrapper">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                  <line x1="16" y1="2" x2="16" y2="6"/>
                                  <line x1="8" y1="2" x2="8" y2="6"/>
                                  <line x1="3" y1="10" x2="21" y2="10"/>
                                </svg>
                              </div>
                              <input 
                                className={`form-input ${apiErrors.guarantor_birth_date ? 'error' : ''}`} 
                                type="date" 
                                name="guarantor_birth_date" 
                                value={formData.guarantor_birth_date} 
                                onChange={handleChange} 
                              />
                            </div>
                            {getFieldError('guarantor_birth_date') && (
                              <div className="field-error">{getFieldError('guarantor_birth_date')}</div>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Lieu de naissance <span className="required">*</span>
                            </label>
                            <input 
                              className={`form-input ${apiErrors.guarantor_birth_place ? 'error' : ''}`} 
                              type="text" 
                              name="guarantor_birth_place" 
                              value={formData.guarantor_birth_place} 
                              onChange={handleChange} 
                              placeholder="Ville, Pays" 
                            />
                            {getFieldError('guarantor_birth_place') && (
                              <div className="field-error">{getFieldError('guarantor_birth_place')}</div>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Profession <span className="required">*</span>
                            </label>
                            <input 
                              className={`form-input ${apiErrors.guarantor_profession ? 'error' : ''}`} 
                              type="text" 
                              name="guarantor_profession" 
                              value={formData.guarantor_profession} 
                              onChange={handleChange} 
                              placeholder="Profession du garant" 
                            />
                            {getFieldError('guarantor_profession') && (
                              <div className="field-error">{getFieldError('guarantor_profession')}</div>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Revenu annuel (FCFA) <span className="required">*</span>
                            </label>
                            <div className="form-input-icon">
                              <div className="icon-wrapper">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                                  <path d="M12 6v2M12 16v2"/>
                                </svg>
                              </div>
                              <input 
                                className={`form-input ${apiErrors.guarantor_annual_income ? 'error' : ''}`} 
                                type="number" 
                                name="guarantor_income" 
                                value={formData.guarantor_income} 
                                onChange={handleChange} 
                                placeholder="60000" 
                                min="0" 
                                step="0.01" 
                              />
                            </div>
                            {getFieldError('guarantor_annual_income') && (
                              <div className="field-error">{getFieldError('guarantor_annual_income')}</div>
                            )}
                          </div>

                          <div className="form-group">
                            <label className="form-label">
                              Revenu mensuel (FCFA) <span className="required">*</span>
                            </label>
                            <div className="form-input-icon">
                              <div className="icon-wrapper">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                                  <path d="M12 6v2M12 16v2"/>
                                </svg>
                              </div>
                              <input 
                                className={`form-input ${apiErrors.guarantor_monthly_income ? 'error' : ''}`} 
                                type="number" 
                                name="guarantor_monthly_income" 
                                value={formData.guarantor_monthly_income} 
                                onChange={handleChange} 
                                placeholder="5000" 
                                min="0" 
                                step="0.01" 
                              />
                            </div>
                            {getFieldError('guarantor_monthly_income') && (
                              <div className="field-error">{getFieldError('guarantor_monthly_income')}</div>
                            )}
                          </div>

                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="form-label">
                              Adresse <span className="required">*</span>
                            </label>
                            <input 
                              className={`form-input ${apiErrors.guarantor_address ? 'error' : ''}`} 
                              type="text" 
                              name="guarantor_address" 
                              value={formData.guarantor_address} 
                              onChange={handleChange} 
                              placeholder="Adresse complète du garant" 
                            />
                            {getFieldError('guarantor_address') && (
                              <div className="field-error">{getFieldError('guarantor_address')}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bottom-actions">
                    <button type="button" className="button button-secondary" onClick={() => showTab('pro')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                      </svg>
                      Précédent
                    </button>
                    <button type="button" className="button button-primary" onClick={() => showTab('documents')}>
                      Suivant : Documents
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 5: Documents */}
              {activeTab === 'documents' && (
                <div className="section">
                  <h2 className="section-title">Documents</h2>

                  <div className="form-grid form-grid-2">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label">
                        Type de pièce d'identité
                      </label>
                      <select className="form-input" name="document_type" value={formData.document_type} onChange={handleChange} id="documentType">
                        <option value="">Sélectionner un type de document</option>
                        <option value="cni">Carte Nationale d'Identité (CNI)</option>
                        <option value="passeport">Passeport</option>
                        <option value="titre_sejour">Titre de séjour</option>
                        <option value="permis_conduire">Permis de conduire</option>
                        <option value="carte_electeur">Carte d'électeur</option>
                        <option value="carte_mutuelle">Carte de mutuelle</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    {formData.document_type && (
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">
                          Télécharger le document
                        </label>
                        <div className="file-upload-wrapper">
                          <input type="file" name="document_file" id="documentFile" className="file-upload-input" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} />
                          <label htmlFor="documentFile" className="file-upload-label">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="17 8 12 3 7 8"/>
                              <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <span>Cliquez pour sélectionner un fichier</span>
                            <small>Formats acceptés : JPG, PNG, PDF (max 5Mo)</small>
                          </label>
                          {selectedFile && (
                            <div className="file-preview">
                              <div className="file-preview-content">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                                  <polyline points="13 2 13 9 20 9"/>
                                </svg>
                                <span>{fileName}</span>
                                <button type="button" className="file-remove" onClick={removeFile}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bottom-actions">
                    <button type="button" className="button button-secondary" onClick={() => showTab('garant')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 5l-7 7 7 7"/>
                      </svg>
                      Précédent
                    </button>

                    <button type="button" className="button button-secondary" onClick={() => showTab('infos')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                      </svg>
                      Retour au début
                    </button>

                    <button type="submit" className="button button-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <svg className="icon-16 loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" fill="none" />
                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeOpacity="1" fill="none" />
                          </svg>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                          </svg>
                          Enregistrer le locataire
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AjouterLocataire;