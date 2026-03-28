import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Calendar, DollarSign, FileText, Check, X, AlertTriangle, ArrowLeft } from 'lucide-react'; // Ajout de ArrowLeft
import { apiService } from '@/services/api';

interface EmitInvoiceProps {
  notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Lease {
  id: number;
  property: {
    id: number;
    name?: string;
    address: string;
    city?: string;
  };
  tenant: {
    id: number;
    user?: {
      name: string;
      email: string;
    };
  };
  rent_amount: number;
  charges_amount?: number;
}

const EmitInvoice: React.FC<EmitInvoiceProps> = ({ notify }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
  const [invoiceType, setInvoiceType] = useState<string>('rent');
  const [dueDate, setDueDate] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('virement');
  const [description, setDescription] = useState<string>('');
  const [createPaymentLink, setCreatePaymentLink] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLeases, setIsLoadingLeases] = useState(true);
  // Ajout des erreurs
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Refs pour les champs de validation
  const leaseSelectRef = useRef<HTMLSelectElement>(null);
  const typeSelectRef = useRef<HTMLSelectElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const paymentMethodRef = useRef<HTMLSelectElement>(null);

  // Dates par défaut
  const today = new Date();
  const defaultDueDate = new Date();
  defaultDueDate.setDate(today.getDate() + 5);
  
  const defaultPeriodStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const defaultPeriodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  useEffect(() => {
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
    setPeriodStart(defaultPeriodStart.toISOString().split('T')[0]);
    setPeriodEnd(defaultPeriodEnd.toISOString().split('T')[0]);
  }, []);

  // Charger les locations
  useEffect(() => {
    const loadLeases = async () => {
      try {
        setIsLoadingLeases(true);
        const leasesData = await apiService.getLeases();
        setLeases(leasesData || []);
      } catch (error) {
        console.error('Erreur lors du chargement des locations:', error);
        notify('Erreur lors du chargement des locations', 'error');
      } finally {
        setIsLoadingLeases(false);
      }
    };

    loadLeases();
  }, [notify]);

  // Mettre à jour le montant quand le type change
  useEffect(() => {
    if (invoiceType === 'rent' && selectedLeaseId) {
      const lease = leases.find(l => l.id.toString() === selectedLeaseId);
      if (lease) {
        setAmount((lease.rent_amount + (lease.charges_amount || 0)).toString());
      }
    }
  }, [invoiceType, selectedLeaseId, leases]);

  // Fonction de validation avec messages d'erreur
  const validateStep = (step: number): boolean => {
    const newErrors: {[key: string]: string} = {};
    let isValid = true;

    if (step === 1) {
      if (!selectedLeaseId) {
        newErrors.lease_id = 'Veuillez sélectionner une location';
        isValid = false;
      }
      if (!invoiceType) {
        newErrors.type = 'Veuillez sélectionner un type';
        isValid = false;
      }
      if (!dueDate) {
        newErrors.due_date = 'Veuillez sélectionner une échéance';
        isValid = false;
      }
    } else if (step === 2) {
      if (!amount || parseFloat(amount) <= 0) {
        newErrors.amount = 'Veuillez entrer un montant valide';
        isValid = false;
      }
      if (!paymentMethod) {
        newErrors.payment_method = 'Veuillez sélectionner un moyen de paiement';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    // Validation avant de passer à l'étape suivante
    if (!validateStep(currentStep)) {
      return;
    }
    
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(1) || !validateStep(2)) {
      return;
    }

    setIsLoading(true);

    try {
      const invoiceData = {
        lease_id: parseInt(selectedLeaseId),
        type: invoiceType,
        due_date: dueDate,
        period_start: periodStart,
        period_end: periodEnd,
        amount_total: parseFloat(amount),
        payment_method: paymentMethod,
        description: description || undefined,
        create_payment_link: createPaymentLink,
      };

      await apiService.createInvoice(invoiceData);

      notify('Facture créée avec succès !', 'success');

      setTimeout(() => {
        navigate('/proprietaire/factures');
      }, 1500);

    } catch (error: any) {
      console.error('Erreur lors de la création de la facture:', error);
      notify(error.response?.data?.message || 'Erreur lors de la création de la facture', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-container">
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .create-container {
          padding: 1rem 2rem 2rem 2rem;
          max-width: 700px;
          margin: 0 auto;
          background: #f8f9fa;
          min-height: 100vh;
        }

        .header-section {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .header-section h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .header-section p {
          color: #757575;
          font-size: 0.9rem;
        }

        /* Progress Steps */
        .progress-steps {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .step-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.9rem;
          background: #e0e0e0;
          color: #9e9e9e;
          transition: all 0.3s;
        }

        .step-circle.active {
          background: #70AE48;
          color: white;
          box-shadow: 0 4px 12px rgba(112, 174, 72, 0.3);
        }

        .step-circle.completed {
          background: #4caf50;
          color: white;
        }

        .step-line {
          width: 60px;
          height: 2px;
          background: #e0e0e0;
          transition: all 0.3s;
        }

        .step-line.completed {
          background: #4caf50;
        }

        /* Form Card */
        .form-card {
          background: white;
          border-radius: 1rem;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #e8e8e8;
          padding: 2rem;
          min-height: 400px;
        }

        .step-content {
          display: none;
        }

        .step-content.active {
          display: block;
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .step-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .step-title svg {
          color: #70AE48;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .form-label .required {
          color: #f44336;
        }

        .form-label .hint {
          font-weight: 400;
          color: #9e9e9e;
          font-size: 0.8rem;
          margin-left: 0.5rem;
        }

        .form-select, .form-input {
          width: 100%;
          padding: 0.875rem 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 0.5rem;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: #fafafa;
          color: #424242;
          font-family: inherit;
        }

        .form-select:focus, .form-input:focus, textarea.form-input:focus {
          outline: none;
          border-color: #70AE48;
          background: white;
          box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
        }

        .form-select.error, .form-input.error {
          border-color: #f44336;
          background: #fff5f5;
        }

        .error-message {
          color: #f44336;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        textarea.form-input {
          resize: vertical;
          min-height: 100px;
          font-family: inherit;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .input-group {
          position: relative;
        }

        .input-prefix {
          position: absolute;
          right: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9e9e9e;
          font-size: 0.9rem;
          font-weight: 500;
          pointer-events: none;
        }

        .form-input.with-prefix {
          padding-right: 5rem;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f5f5f5;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checkbox-wrapper:hover {
          background: #eeeeee;
        }

        .checkbox-wrapper input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
          accent-color: #70AE48;
        }

        .checkbox-text {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .checkbox-label {
          font-size: 0.95rem;
          color: #1a1a1a;
          font-weight: 500;
        }

        .checkbox-hint {
          font-size: 0.8rem;
          color: #757575;
        }

        .alert {
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .alert-warning {
          background: #fff3e0;
          border-left: 4px solid #ff9800;
          color: #e65100;
        }

        .alert-warning a {
          color: #70AE48;
          text-decoration: underline;
          font-weight: 500;
        }

        /* Form Actions */
        .form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #f0f0f0;
        }

        .form-actions-left {
          display: flex;
          align-items: center;
        }

        .btn {
          padding: 0.875rem 1.75rem;
          border-radius: 0.75rem;
          font-weight: 500;
          font-size: 0.95rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          font-family: inherit;
        }

        .btn-primary {
          background: #70AE48;
          color: white;
          box-shadow: 0 4px 12px rgba(112, 174, 72, 0.3);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(112, 174, 72, 0.4);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #616161;
          border: 1px solid #e0e0e0;
        }

        .btn-secondary:hover {
          background: #f5f5f5;
        }

        .btn-ghost {
          background: transparent;
          color: #757575;
          padding: 0.875rem 1rem;
        }

        .btn-ghost:hover {
          color: #70AE48;
        }

        @media (max-width: 768px) {
          .progress-steps {
            gap: 0.25rem;
          }

          .step-circle {
            width: 35px;
            height: 35px;
            font-size: 0.85rem;
          }

          .step-line {
            width: 40px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-wrap: wrap;
          }
        }
      `}</style>

      <div className="header-section">
        <h1>Créer une facture</h1>
        <p>Suivez les étapes pour créer votre facture</p>
      </div>

      {/* Progress Steps */}
      <div className="progress-steps">
        <div className="step">
          <div className={`step-circle ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`} id="step-indicator-1">
            {currentStep > 1 ? <Check size={16} /> : '1'}
          </div>
        </div>
        <div className={`step-line ${currentStep > 1 ? 'completed' : ''}`} id="line-1"></div>
        <div className="step">
          <div className={`step-circle ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`} id="step-indicator-2">
            {currentStep > 2 ? <Check size={16} /> : '2'}
          </div>
        </div>
        <div className={`step-line ${currentStep > 2 ? 'completed' : ''}`} id="line-2"></div>
        <div className="step">
          <div className={`step-circle ${currentStep === 3 ? 'active' : ''}`} id="step-indicator-3">3</div>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit} id="invoice-form">
          {/* Step 1: Location et Type */}
          <div className={`step-content ${currentStep === 1 ? 'active' : ''}`} id="step-1">
            <h3 className="step-title">
              <Home size={20} />
              Informations de base
            </h3>

            <div className="form-group">
              <label className="form-label">
                Location <span className="required">*</span>
              </label>
              {isLoadingLeases ? (
                <div>Chargement des locations...</div>
              ) : leases.length === 0 ? (
                <div className="alert alert-warning">
                  <AlertTriangle size={20} />
                  <div>
                    <strong>Aucune location active</strong><br />
                    <span style={{ fontSize: '0.9rem' }}>
                      Vous devez d'abord <a href="/proprietaire/nouvelle-location">créer une location</a>.
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <select
                    ref={leaseSelectRef}
                    name="lease_id"
                    className={`form-select ${errors.lease_id ? 'error' : ''}`}
                    value={selectedLeaseId}
                    onChange={(e) => {
                      setSelectedLeaseId(e.target.value);
                      // Clear error when user selects
                      if (errors.lease_id) {
                        setErrors(prev => ({ ...prev, lease_id: '' }));
                      }
                    }}
                    required
                    id="lease-select"
                  >
                    <option value="">Sélectionnez une location</option>
                    {leases.map((lease) => (
                      <option key={lease.id} value={lease.id}>
                        {lease.property?.name || lease.property?.address} - {lease.tenant?.user?.name || 'Locataire'} ({lease.rent_amount.toLocaleString()} FCFA)
                      </option>
                    ))}
                  </select>
                  {errors.lease_id && (
                    <div className="error-message">
                      <AlertTriangle size={14} />
                      {errors.lease_id}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Type <span className="required">*</span>
                </label>
                <select
                  ref={typeSelectRef}
                  name="type"
                  className={`form-select ${errors.type ? 'error' : ''}`}
                  value={invoiceType}
                  onChange={(e) => {
                    setInvoiceType(e.target.value);
                    if (errors.type) {
                      setErrors(prev => ({ ...prev, type: '' }));
                    }
                  }}
                  required
                  id="type-select"
                >
                  <option value="rent">Loyer</option>
                  <option value="deposit">Dépôt</option>
                  <option value="charge">Charge</option>
                  <option value="repair">Réparation</option>
                </select>
                {errors.type && (
                  <div className="error-message">
                    <AlertTriangle size={14} />
                    {errors.type}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Échéance <span className="required">*</span>
                </label>
                <input
                  ref={dueDateRef}
                  type="date"
                  name="due_date"
                  className={`form-input ${errors.due_date ? 'error' : ''}`}
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    if (errors.due_date) {
                      setErrors(prev => ({ ...prev, due_date: '' }));
                    }
                  }}
                  required
                  id="due-date"
                />
                {errors.due_date && (
                  <div className="error-message">
                    <AlertTriangle size={14} />
                    {errors.due_date}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Montant et Paiement */}
          <div className={`step-content ${currentStep === 2 ? 'active' : ''}`} id="step-2">
            <h3 className="step-title">
              <DollarSign size={20} />
              Montant et paiement
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Période début <span className="hint">(optionnel)</span>
                </label>
                <input
                  type="date"
                  name="period_start"
                  className="form-input"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Période fin <span className="hint">(optionnel)</span>
                </label>
                <input
                  type="date"
                  name="period_end"
                  className="form-input"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Montant total <span className="required">*</span>
              </label>
              <div className="input-group">
                <input
                  ref={amountRef}
                  name="amount_total"
                  className={`form-input with-prefix ${errors.amount ? 'error' : ''}`}
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) {
                      setErrors(prev => ({ ...prev, amount: '' }));
                    }
                  }}
                  placeholder="50000"
                  required
                  id="amount-input"
                />
                <span className="input-prefix">FCFA</span>
              </div>
              {errors.amount && (
                <div className="error-message">
                  <AlertTriangle size={14} />
                  {errors.amount}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Moyen de paiement <span className="required">*</span>
              </label>
              <select
                ref={paymentMethodRef}
                name="payment_method"
                className={`form-select ${errors.payment_method ? 'error' : ''}`}
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  if (errors.payment_method) {
                    setErrors(prev => ({ ...prev, payment_method: '' }));
                  }
                }}
                required
                id="payment-method"
              >
                <option value="virement">Virement bancaire</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="card">Carte bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="especes">Espèces</option>
                <option value="fedapay">Fedapay</option>
              </select>
              {errors.payment_method && (
                <div className="error-message">
                  <AlertTriangle size={14} />
                  {errors.payment_method}
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Finalisation */}
          <div className={`step-content ${currentStep === 3 ? 'active' : ''}`} id="step-3">
            <h3 className="step-title">
              <FileText size={20} />
              Finalisation
            </h3>

            <div className="form-group">
              <label className="form-label">
                Description <span className="hint">(optionnel)</span>
              </label>
              <textarea
                name="description"
                className="form-input"
                rows={4}
                placeholder="Ajoutez des détails supplémentaires..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  name="create_payment_link"
                  checked={createPaymentLink}
                  onChange={(e) => setCreatePaymentLink(e.target.checked)}
                />
                <div className="checkbox-text">
                  <span className="checkbox-label">🔗 Créer un lien de paiement</span>
                  <span className="checkbox-hint">Le locataire recevra un email avec un lien pour payer</span>
                </div>
              </label>
            </div>
          </div>

          {/* Form Actions - MODIFIÉ : Bouton Annuler à gauche sur étape 1 */}
          <div className="form-actions">
            <div className="form-actions-left">
              {currentStep === 1 ? (
                // Étape 1 : Bouton Annuler à gauche
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/proprietaire/factures')}
                  id="cancel-btn"
                >
                  Annuler
                </button>
              ) : (
                // Étapes 2 et 3 : Bouton Précédent à gauche
                <button type="button" className="btn btn-ghost" onClick={handlePrev} id="prev-btn">
                  <ArrowLeft size={18} />
                  Précédent
                </button>
              )}
            </div>

            <div>
              {currentStep < 3 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext} id="next-btn">
                  Suivant
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                  id="submit-btn"
                >
                  <Check size={18} />
                  {isLoading ? 'Création...' : 'Créer la facture'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmitInvoice;