import React, { useState } from 'react';
import api from '@/services/api';

interface InviteCoOwnerProps {
  notify: (msg: string, type: "success" | "info" | "error") => void;
}

export const InviteCoOwner: React.FC<InviteCoOwnerProps> = ({ notify }) => {
  const [selectedType, setSelectedType] = useState<'co_owner' | 'agency' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    company_name: '', ifu: '', rccm: '', vat_number: '', address_billing: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectType = (type: 'co_owner' | 'agency') => {
    setSelectedType(type); setShowTypeSelection(false); setCurrentStep(1);
  };

  const resetSelection = () => {
    setSelectedType(null); setShowTypeSelection(true);
    setFormData({ first_name: '', last_name: '', email: '', phone: '', company_name: '', ifu: '', rccm: '', vat_number: '', address_billing: '' });
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.first_name || !formData.last_name || !formData.email) {
        alert('Veuillez remplir tous les champs obligatoires (Prénom, Nom, Email)'); return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedType === 'agency' && (!formData.ifu || !formData.rccm)) {
        alert("L'IFU et le RCCM sont obligatoires pour une agence"); return;
      }
      setCurrentStep(3);
    }
  };

  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = {
        invitation_type: selectedType,
        first_name: formData.first_name, last_name: formData.last_name,
        email: formData.email, phone: formData.phone || undefined,
        company_name: formData.company_name || undefined, ifu: formData.ifu || undefined,
        rccm: formData.rccm || undefined, vat_number: formData.vat_number || undefined,
        address_billing: formData.address_billing || undefined,
      };
      const response = await api.post('/co-owners/invite', payload);
      if (response.data) {
        notify(selectedType === 'agency' ? 'Agence invitée avec succès !' : 'Co-propriétaire invité avec succès !', 'success');
        resetSelection();
      }
    } catch (error: any) {
      notify(error.response?.data?.message || "Erreur lors de l'envoi de l'invitation", 'error');
    } finally { setLoading(false); }
  };

  const escHtml = (str: string) => str ? String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';

  // ── CSS identique au Blade ──────────────────────────────────────
  const css = `
    .invite-container { max-width: 1000px; margin: 0 auto; padding: 2rem 1.5rem; }

    .header-wrapper { text-align: center; margin-bottom: 1.5rem; }
    .header-icon { width: 5rem; height: 5rem; background: linear-gradient(135deg, #f0f9e6, #ffffff); border-radius: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; border: 2px solid rgba(112,174,72,0.2); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .header-icon svg { width: 2rem; height: 2rem; color: #70AE48; }
    .header-wrapper h1 { font-size: 1.75rem; font-weight: 800; color: #111827; margin-bottom: 0.5rem; letter-spacing: -0.02em; }
    .header-wrapper p { color: #6b7280; font-size: 0.95rem; }

    .selection-grid { display: grid; grid-template-columns: 1fr; gap: 1.5rem; margin-bottom: 1rem; }
    @media (min-width: 768px) { .selection-grid { grid-template-columns: repeat(2, 1fr); } }

    .type-card { background: white; border-radius: 2rem; padding: 2rem; border: 2px solid #e5e7eb; cursor: pointer; transition: all 0.3s; }
    .type-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
    .type-card.selected-coowner { border-color: #70AE48; background: linear-gradient(135deg, white, #f0f9e6); box-shadow: 0 20px 25px -5px rgba(112,174,72,0.2); }
    .type-card.selected-agency  { border-color: #8b5cf6; background: linear-gradient(135deg, white, #f5f3ff); box-shadow: 0 20px 25px -5px rgba(139,92,246,0.2); }

    .card-icon { width: 4rem; height: 4rem; border-radius: 1.5rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 0.75rem; }
    .card-icon.coowner { background: #f0f9e6; color: #70AE48; }
    .card-icon.agency  { background: #f5f3ff; color: #8b5cf6; }
    .type-card h3 { font-size: 1.15rem; font-weight: 700; color: #111827; margin-bottom: 0.75rem; text-align: center; }
    .type-card > p { color: #6b7280; text-align: center; margin-bottom: 1.5rem; line-height: 1.5; }

    .feature-list { text-align: left; padding: 1rem 0 0; border-top: 1px solid #e5e7eb; }
    .feature-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; color: #4b5563; font-size: 0.938rem; }
    .feature-item svg { flex-shrink: 0; color: #10b981; }

    .choose-btn { width: 100%; margin-top: 1.5rem; padding: 0.75rem 1.5rem; border: 2px solid #d1d5db; border-radius: 1rem; background: white; color: #374151; font-weight: 600; font-size: 0.938rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
    .choose-btn:hover { border-color: #70AE48; color: #70AE48; background: #f0f9e6; }

    .form-card { background: white; border-radius: 2rem; border: 2px solid #e5e7eb; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); margin-top: 2rem; }
    .form-header { padding: 1.5rem 2rem; background: linear-gradient(135deg, #f9fafb, white); border-bottom: 2px solid #e5e7eb; display: flex; align-items: center; justify-content: space-between; }
    .form-header h2 { font-size: 1.1rem; font-weight: 700; background: linear-gradient(135deg, #70AE48, #8bc34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
    .change-type-btn { padding: 0.5rem 1rem; background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 2rem; color: #4b5563; font-size: 0.875rem; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 0.375rem; }
    .change-type-btn:hover { background: white; border-color: #70AE48; color: #70AE48; }

    .form-body { padding: 1.25rem; }
    .form-section { margin-bottom: 1rem; }
    .section-title { font-size: 0.95rem; font-weight: 600; color: #1f2937; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 2px solid rgba(112,174,72,0.2); display: flex; align-items: center; gap: 0.5rem; }
    .section-title svg { color: #70AE48; }

    .form-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; }
    @media (min-width: 768px) { .form-grid { grid-template-columns: repeat(2, 1fr); } }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-label { display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; font-weight: 600; color: #374151; }
    .required { color: #ef4444; font-size: 0.875rem; }

    .form-input { padding: 0.5rem 0.75rem; border: 2px solid #d1d5db; border-radius: 0.75rem; font-size: 0.95rem; background: white; width: 100%; font-family: inherit; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
    .form-input:focus { border-color: #70AE48; box-shadow: 0 0 0 4px rgba(112,174,72,0.08); }
    .form-input::placeholder { color: #9ca3af; }

    .info-box { background: linear-gradient(135deg, #f5f3ff, #ffffff); border: 2px solid #d8b4fe; border-radius: 1.5rem; padding: 1.25rem; margin-bottom: 2rem; display: flex; align-items: center; gap: 1rem; }
    .info-box svg { color: #8b5cf6; flex-shrink: 0; }
    .info-box p { color: #6b21a8; font-weight: 500; font-size: 0.938rem; margin: 0; }

    .progress-steps { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 1rem 0; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .step-circle { width: 2.5rem; height: 2.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.875rem; transition: all 0.3s; }
    .step-circle.active   { background: #70AE48; color: white; }
    .step-circle.completed{ background: #70AE48; color: white; }
    .step-circle.inactive { background: #e5e7eb; color: #6b7280; }
    .step-line { width: 4rem; height: 0.25rem; background: #e5e7eb; border-radius: 0.125rem; transition: all 0.3s; margin-bottom: 1.25rem; }
    .step-line.active { background: #70AE48; }
    .step-label { font-size: 0.75rem; color: #6b7280; }

    .confirm-box { padding: 1.5rem; border-radius: 1rem; margin-bottom: 1rem; border: 2px solid; }
    .confirm-box.coowner-confirm { background: #eff6ff; border-color: #bfdbfe; }
    .confirm-box.agency-confirm  { background: #faf5ff; border-color: #e9d5ff; }
    .confirm-row { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem; }
    .confirm-item { flex: 1; min-width: 180px; }
    .confirm-item .label { font-size: 0.8rem; color: #6b7280; }
    .confirm-item .value { font-weight: 600; color: #1f2937; font-size: 0.938rem; }

    .info-note { padding: 1rem 1.25rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 0.75rem; font-size: 0.875rem; color: #374151; display: flex; align-items: flex-start; gap: 0.75rem; margin-top: 1rem; }
    .info-note p { margin: 0; }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; margin-top: 1rem; border-top: 2px solid #e5e7eb; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.6rem 1.5rem; border-radius: 1rem; font-size: 0.938rem; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; font-family: inherit; }
    .btn-primary { background: #70AE48; color: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .btn-primary:hover:not(:disabled) { background: #5c8f3a; transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-secondary { background: white; border-color: #d1d5db; color: #374151; }
    .btn-secondary:hover { border-color: #70AE48; color: #70AE48; background: #f0f9e6; }

    @media (max-width: 640px) {
      .invite-container { padding: 1rem; }
      .header-wrapper h1 { font-size: 2rem; }
      .form-header { flex-direction: column; gap: 1rem; text-align: center; }
      .form-actions { flex-direction: column; }
      .form-actions .btn { width: 100%; }
      .step-label { display: none; }
      .step-line { width: 2rem; }
    }
  `;

  // ── Sélection du type ─────────────────────────────────────────
  if (showTypeSelection) {
    return (
      <>
        <style>{css}</style>
        <div className="invite-container">
          <div className="header-wrapper">
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1>Inviter un gestionnaire</h1>
            <p>Choisissez le type de gestionnaire que vous souhaitez inviter</p>
          </div>

          <div className="selection-grid">
            {/* Co-propriétaire */}
            <div className="type-card">
              <div className="card-icon coowner">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3>Co-propriétaire</h3>
              <p>Invitez un co-propriétaire à gérer vos biens ensemble. Peut être un particulier ou un professionnel.</p>
              <div className="feature-list">
                {['Gestion conjointe des biens', 'Permissions contrôlées', 'Particulier ou Professionnel'].map(f => (
                  <div key={f} className="feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="choose-btn" onClick={() => selectType('co_owner')}>
                Choisir
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>

            {/* Agence */}
            <div className="type-card">
              <div className="card-icon agency">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3>Agence Immobilière</h3>
              <p>Invitez une agence professionnelle pour gérer vos biens. Documents professionnels obligatoires.</p>
              <div className="feature-list">
                {['Gestion professionnelle', 'Documents légaux requis (IFU, RCCM)', 'Facturation professionnelle'].map(f => (
                  <div key={f} className="feature-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="choose-btn" onClick={() => selectType('agency')}>
                Choisir
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Formulaire ────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="invite-container">
        <div className="header-wrapper">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1>{selectedType === 'agency' ? 'Inviter une agence' : 'Inviter un co-propriétaire'}</h1>
          <p>{selectedType === 'agency' ? "Remplissez les informations de l'agence à inviter" : 'Remplissez les informations du co-propriétaire à inviter'}</p>
        </div>

        <div className="form-card">
          <div className="form-header">
            <h2>{selectedType === 'agency' ? 'Inviter une agence' : 'Inviter un co-propriétaire'}</h2>
            <button type="button" className="change-type-btn" onClick={resetSelection}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
              Changer de type
            </button>
          </div>

          <div className="form-body">
            <form onSubmit={handleSubmit}>
              {/* Progress */}
              <div className="progress-steps">
                {[1,2,3].map((s, i) => (
                  <React.Fragment key={s}>
                    <div className="step">
                      <div className={`step-circle ${currentStep > s ? 'completed' : currentStep === s ? 'active' : 'inactive'}`}>
                        {currentStep > s ? '✓' : s}
                      </div>
                      <span className="step-label">{s === 1 ? 'Infos de base' : s === 2 ? 'Infos complémentaires' : 'Confirmation'}</span>
                    </div>
                    {i < 2 && <div className={`step-line ${currentStep > s ? 'active' : ''}`} />}
                  </React.Fragment>
                ))}
              </div>

              {/* Étape 1 */}
              {currentStep === 1 && (
                <div className="form-section">
                  <div className="section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Informations de base
                  </div>
                  <div className="form-grid">
                    {[
                      { label: 'Prénom', name: 'first_name', type: 'text', placeholder: 'Prénom', req: true },
                      { label: 'Nom', name: 'last_name', type: 'text', placeholder: 'Nom', req: true },
                      { label: 'Email', name: 'email', type: 'email', placeholder: 'email@exemple.com', req: true },
                      { label: 'Téléphone', name: 'phone', type: 'tel', placeholder: '+229 00 00 00 00', req: false },
                    ].map(f => (
                      <div key={f.name} className="form-group">
                        <label className="form-label">{f.label} {f.req && <span className="required">*</span>}</label>
                        <input type={f.type} name={f.name} value={(formData as any)[f.name]} onChange={handleInputChange} className="form-input" placeholder={f.placeholder} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Étape 2 */}
              {currentStep === 2 && (
                <div className="form-section">
                  {selectedType === 'co_owner' ? (
                    <>
                      <div className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Informations complémentaires
                      </div>
                      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ margin: '0 auto 1rem', display: 'block' }}>
                          <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/>
                          <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                        <p style={{ color: '#4b5563' }}>Le co-propriétaire est un particulier. Aucune information supplémentaire requise.</p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem' }}>Vous pouvez passer directement à l'étape de confirmation</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"/></svg>
                        Informations de l'agence
                      </div>
                      <div className="info-box">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <p>Pour une agence, les documents légaux (IFU et RCCM) sont obligatoires</p>
                      </div>
                      <div className="form-grid">
                        {[
                          { label: "Nom de l'agence", name: 'company_name', placeholder: 'Immobilier Excellence', req: false },
                          { label: 'IFU', name: 'ifu', placeholder: '1234567890123', req: true },
                          { label: 'RCCM', name: 'rccm', placeholder: 'BJ-1234-5678-BJ-2023', req: true },
                          { label: 'Numéro TVA', name: 'vat_number', placeholder: 'BJ123456789', req: false },
                        ].map(f => (
                          <div key={f.name} className="form-group">
                            <label className="form-label">{f.label} {f.req && <span className="required">*</span>}</label>
                            <input type="text" name={f.name} value={(formData as any)[f.name]} onChange={handleInputChange} className="form-input" placeholder={f.placeholder} />
                          </div>
                        ))}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label">Adresse de facturation</label>
                          <input type="text" name="address_billing" value={formData.address_billing} onChange={handleInputChange} className="form-input" placeholder="123 Rue du Commerce, Cotonou" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Étape 3 */}
              {currentStep === 3 && (
                <div className="form-section">
                  <div className="section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Confirmation de l'invitation
                  </div>
                  <div className={`confirm-box ${selectedType === 'agency' ? 'agency-confirm' : 'coowner-confirm'}`}>
                    <div style={{ fontWeight: 600, color: selectedType === 'agency' ? '#7c3aed' : '#1d4ed8', marginBottom: '0.75rem' }}>
                      {selectedType === 'agency' ? 'Agence à inviter :' : 'Co-propriétaire à inviter :'}
                    </div>
                    <div className="confirm-row">
                      {[
                        { label: 'Nom complet', value: `${formData.first_name} ${formData.last_name}` },
                        { label: 'Email', value: formData.email },
                        ...(formData.phone ? [{ label: 'Téléphone', value: formData.phone }] : []),
                        { label: 'Type', value: selectedType === 'agency' ? 'Agence Immobilière' : 'Co-propriétaire Particulier' },
                      ].map(item => (
                        <div key={item.label} className="confirm-item">
                          <div className="label">{item.label}</div>
                          <div className="value">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {selectedType === 'agency' && (formData.company_name || formData.ifu || formData.rccm) && (
                      <div style={{ borderTop: '1px solid #e9d5ff', marginTop: '1rem', paddingTop: '1rem' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#4b5563' }}>Informations de l'agence :</div>
                        <div className="confirm-row">
                          {[
                            ...(formData.company_name ? [{ label: 'Agence', value: formData.company_name }] : []),
                            ...(formData.ifu  ? [{ label: 'IFU',  value: formData.ifu  }] : []),
                            ...(formData.rccm ? [{ label: 'RCCM', value: formData.rccm }] : []),
                          ].map(item => (
                            <div key={item.label} className="confirm-item">
                              <div className="label">{item.label}</div>
                              <div className="value">{item.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="info-note">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#70AE48" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <p>Un email d'invitation sera envoyé à <strong>{formData.email}</strong>. {selectedType === 'agency' ? "L'agence pourra créer son compte et commencer à gérer vos biens." : 'Le co-propriétaire pourra créer son compte et commencer à gérer vos biens.'}</p>
                  </div>
                </div>
              )}

              {/* Boutons */}
              <div className="form-actions">
                {currentStep > 1 && (
                  <button type="button" className="btn btn-secondary" onClick={prevStep}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                    Précédent
                  </button>
                )}
                {currentStep < 3 ? (
                  <button type="button" className="btn btn-primary" onClick={nextStep}>
                    {currentStep === 2 && selectedType === 'co_owner' ? 'Confirmer' : 'Suivant'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}><circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                        {selectedType === 'agency' ? "Inviter l'agence" : 'Inviter le co-propriétaire'}
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
};