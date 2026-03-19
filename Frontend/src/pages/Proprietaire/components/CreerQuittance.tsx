import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, Calendar, DollarSign, FileText, Check, X, AlertTriangle, Building, User, Mail, Info, CreditCard, FilePlus } from 'lucide-react';
import { apiService, rentReceiptService } from '@/services/api';

interface CreerQuittanceProps {
  notify: (msg: string, type: 'success' | 'info' | 'error') => void;
}

interface Lease {
  id: number;
  property: {
    id: number;
    name: string;
    address: string;
    city?: string;
  };
  tenant: {
    id: number;
    first_name?: string;
    last_name?: string;
    user?: {
      name: string;
      email: string;
    };
  };
  rent_amount: number;
  charges_amount?: number;
}

const CreerQuittance: React.FC<CreerQuittanceProps> = ({ notify }) => {
  const navigate = useNavigate();
  const [leases, setLeases] = useState<Lease[]>([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [paidMonth, setPaidMonth] = useState<string>('');
  const [issuedDate, setIssuedDate] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [sendEmail, setSendEmail] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingLeases, setIsLoadingLeases] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  // Dates par défaut
  const today = new Date();
  const defaultIssuedDate = today.toISOString().split('T')[0];
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  useEffect(() => {
    setIssuedDate(defaultIssuedDate);
    setPaidMonth(defaultMonth);
  }, []);

  // Charger les baux
  useEffect(() => {
    const fetchLeases = async () => {
      try {
        setIsLoadingLeases(true);
        // Utiliser la méthode pour récupérer les baux pour le formulaire
        const data = await rentReceiptService.getLeasesForForm?.() || await apiService.getLeases();
        setLeases(data || []);
      } catch (error) {
        console.error('Erreur chargement baux:', error);
        notify('Erreur lors du chargement des baux', 'error');
      } finally {
        setIsLoadingLeases(false);
      }
    };

    fetchLeases();
  }, [notify]);

  // Mettre à jour les infos du bail sélectionné
  useEffect(() => {
    if (selectedLeaseId) {
      const lease = leases.find(l => l.id.toString() === selectedLeaseId);
      setSelectedLease(lease || null);
      
      if (lease) {
        // Pré-remplir le montant avec le loyer
        const totalAmount = (parseFloat(lease.rent_amount) + parseFloat(lease.charges_amount || 0));
        setAmountPaid(totalAmount.toString());
      }
    } else {
      setSelectedLease(null);
      setAmountPaid('');
    }
  }, [selectedLeaseId, leases]);

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!selectedLeaseId) {
      newErrors.push('Veuillez sélectionner un bail');
    }
    if (!paidMonth) {
      newErrors.push('Veuillez sélectionner le mois payé');
    }
    if (!issuedDate) {
      newErrors.push('Veuillez renseigner la date d\'émission');
    }
    if (!amountPaid || parseFloat(amountPaid) <= 0) {
      newErrors.push('Veuillez renseigner un montant valide');
    }

    setErrors(newErrors);
    
    if (newErrors.length > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors([]);

    try {
      const receiptData = {
        lease_id: parseInt(selectedLeaseId),
        type: 'independent',
        paid_month: paidMonth,
        issued_date: issuedDate,
        amount_paid: parseFloat(amountPaid),
        notes: notes || undefined,
        send_email: sendEmail,
      };

      await rentReceiptService.createIndependent(receiptData);

      notify('Quittance créée avec succès !', 'success');

      setTimeout(() => {
        navigate('/proprietaire/quittances');
      }, 1500);

    } catch (error: any) {
      console.error('Erreur création quittance:', error);
      
      if (error.response?.data?.errors) {
        const backendErrors = Object.values(error.response.data.errors).flat();
        setErrors(backendErrors as string[]);
      } else {
        setErrors([error.response?.data?.message || 'Erreur lors de la création de la quittance']);
      }
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  const getTenantName = (lease: Lease): string => {
    if (lease.tenant) {
      if (lease.tenant.user?.name) return lease.tenant.user.name;
      if (lease.tenant.first_name || lease.tenant.last_name) {
        return `${lease.tenant.first_name || ''} ${lease.tenant.last_name || ''}`.trim();
      }
    }
    return 'Locataire inconnu';
  };

  return (
    <div className="content-body">
      <style>{`
        :root {
          --gradA: #70AE48;
          --gradB: #8BC34A;
          --indigo: #70AE48;
          --violet: #8BC34A;
          --emerald: #10b981;
          --yellow: #f59e0b;
          --red: #ef4444;
          --ink: #0f172a;
          --muted: #64748b;
          --muted2: #94a3b8;
          --line: rgba(15,23,42,.10);
          --line2: rgba(15,23,42,.08);
          --shadow: 0 22px 70px rgba(0,0,0,.18);
        }

        .content-body {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .top-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .alert-box {
          border-radius: 14px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
          border: 1px solid;
          font-weight: 850;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .alert-success {
          background: rgba(112, 174, 72, 0.1);
          border-color: rgba(112, 174, 72, 0.3);
          color: #2e5e1e;
        }

        .alert-error {
          background: rgba(254,242,242,.92);
          border-color: rgba(248,113,113,.30);
          color: #991b1b;
        }

        .error-list {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-top: 0.5rem;
          color: #991b1b;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .error-list li {
          margin-bottom: 0.25rem;
        }

        .button {
          padding: 0.9rem 1.35rem;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: inherit;
          white-space: nowrap;
          text-decoration: none;
        }

        .button-primary {
          background: #70AE48;
          color: #fff;
          box-shadow: 0 4px 12px rgba(112, 174, 72, 0.3);
        }

        .button-primary:hover:not(:disabled) {
          background: #5d8f3a;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(112, 174, 72, 0.4);
        }

        .button-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .button-secondary {
          background: white;
          color: #70AE48;
          border: 2px solid rgba(112, 174, 72, 0.3);
        }

        .button-secondary:hover {
          background: rgba(112, 174, 72, 0.05);
          border-color: #70AE48;
        }

        .button-back {
          background: white;
          color: #6B7280;
          border: 2px solid #E5E7EB;
        }

        .button-back:hover {
          background: #F9FAFB;
          color: #70AE48;
          border-color: #70AE48;
        }

        .form-container {
          background: white;
          border: 1px solid #E5E7EB;
          border-radius: 20px;
          padding: 2rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 700;
          color: #1F2937;
          font-size: 0.9rem;
        }

        .form-control {
          width: 100%;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          border: 2px solid #E5E7EB;
          background: white;
          font-size: 0.95rem;
          font-weight: 500;
          color: #1F2937;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .form-control:focus {
          outline: none;
          border-color: #70AE48;
          box-shadow: 0 0 0 3px rgba(112, 174, 72, 0.1);
        }

        .form-control.is-invalid {
          border-color: var(--red);
        }

        .invalid-feedback {
          color: var(--red);
          font-size: 0.8rem;
          font-weight: 600;
          margin-top: 0.25rem;
        }

        .form-text {
          color: #9CA3AF;
          font-size: 0.8rem;
          font-weight: 500;
          margin-top: 0.25rem;
        }

        .info-card {
          background: rgba(112, 174, 72, 0.05);
          border: 2px solid rgba(112, 174, 72, 0.2);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .info-card h6 {
          color: #70AE48;
          font-weight: 700;
          margin-bottom: 1rem;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-card p {
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #1F2937;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .info-card p:last-child {
          margin-bottom: 0;
        }

        .info-card span {
          color: #6B7280;
          font-weight: 500;
          margin-left: 0.25rem;
        }

        .form-check {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.5rem 0;
          padding: 1rem;
          background: rgba(112, 174, 72, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(112, 174, 72, 0.2);
        }

        .form-check-input {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          border: 2px solid #70AE48;
          cursor: pointer;
          appearance: none;
          position: relative;
        }

        .form-check-input:checked {
          background-color: #70AE48;
          border-color: #70AE48;
        }

        .form-check-input:checked::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 2px;
        }

        .form-check-label {
          font-weight: 600;
          color: #1F2937;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .form-check-label svg {
          color: #70AE48;
          margin-right: 0.5rem;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          border: 2px dashed #E5E7EB;
          border-radius: 20px;
          background: white;
        }

        .empty-state-icon {
          margin: 0 auto 1rem;
          width: 64px;
          height: 64px;
          color: #9CA3AF;
        }

        .empty-state-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #4B5563;
          margin-bottom: 0.5rem;
        }

        .empty-state-text {
          color: #9CA3AF;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        .badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 850;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .badge-paid {
          background: rgba(34,197,94,.15);
          color: #166534;
          border: 1px solid rgba(34,197,94,.25);
        }

        .badge-pending {
          background: rgba(245,158,11,.15);
          color: #92400e;
          border: 1px solid rgba(245,158,11,.25);
        }

        .badge-overdue {
          background: rgba(239,68,68,.15);
          color: #991b1b;
          border: 1px solid rgba(239,68,68,.25);
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .content-body {
            padding: 1rem;
          }

          .form-container {
            padding: 1.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }

          .form-actions {
            flex-direction: column;
          }

          .button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="top-actions">
        <button className="button button-back" onClick={() => navigate('/proprietaire/quittances')}>
          <ArrowLeft size={16} />
          Retour à la liste
        </button>
      </div>

      {/* Affichage des erreurs */}
      {errors.length > 0 && (
        <div className="alert-box alert-error">
          <AlertTriangle size={20} />
          <div style={{ flex: 1 }}>
            <strong>Erreurs de validation</strong>
            <ul className="error-list">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {isLoadingLeases ? (
        <div className="empty-state">
          <div className="animate-spin" style={{ width: 64, height: 64, border: '4px solid #E5E7EB', borderTopColor: '#70AE48', borderRadius: '50%', margin: '0 auto 1rem' }}></div>
          <p className="empty-state-text">Chargement des baux...</p>
        </div>
      ) : leases.length === 0 ? (
        <div className="empty-state">
          <Building size={64} className="empty-state-icon" />
          <h3 className="empty-state-title">Aucun bail disponible</h3>
          <p className="empty-state-text">Vous devez avoir au moins un bail actif pour créer une quittance.</p>
          <button className="button button-primary" onClick={() => navigate('/proprietaire/nouvelle-location')}>
            <Plus size={16} />
            Gérer les baux
          </button>
        </div>
      ) : (
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Sélection du bail */}
              <div className="form-group">
                <label htmlFor="lease_id" className="form-label">
                  Sélectionner le bail *
                </label>
                <select
                  id="lease_id"
                  name="lease_id"
                  className="form-control"
                  value={selectedLeaseId}
                  onChange={(e) => setSelectedLeaseId(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un bail --</option>
                  {leases.map((lease) => (
                    <option
                      key={lease.id}
                      value={lease.id}
                      data-property={lease.property?.name}
                      data-tenant={getTenantName(lease)}
                      data-rent={lease.rent_amount}
                    >
                      {lease.property?.name || 'Bien'} - {getTenantName(lease)}
                    </option>
                  ))}
                </select>
                <div className="form-text">Choisissez le bail pour lequel créer la quittance</div>
              </div>

              {/* Informations du bail */}
              <div className="form-group">
                <div className="info-card">
                  <h6>
                    <Info size={18} />
                    Informations du bail
                  </h6>
                  <div id="lease-info">
                    <p>
                      <Home size={16} />
                      <strong>Bien:</strong> <span id="property-name">{selectedLease?.property?.name || '-'}</span>
                    </p>
                    <p>
                      <User size={16} />
                      <strong>Locataire:</strong> <span id="tenant-name">{selectedLease ? getTenantName(selectedLease) : '-'}</span>
                    </p>
                    <p>
                      <CreditCard size={16} />
                      <strong>Loyer mensuel:</strong> <span id="rent-amount">
                        {selectedLease ? (parseFloat(selectedLease.rent_amount) + parseFloat(selectedLease.charges_amount || 0)).toLocaleString() : '-'}
                      </span> FCFA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-grid">
              {/* Mois payé */}
              <div className="form-group">
                <label htmlFor="paid_month" className="form-label">
                  Mois payé *
                </label>
                <input
                  type="month"
                  id="paid_month"
                  name="paid_month"
                  className="form-control"
                  value={paidMonth}
                  onChange={(e) => setPaidMonth(e.target.value)}
                  required
                />
                <div className="form-text">Mois correspondant au loyer payé</div>
              </div>

              {/* Date d'émission */}
              <div className="form-group">
                <label htmlFor="issued_date" className="form-label">
                  Date d'émission *
                </label>
                <input
                  type="date"
                  id="issued_date"
                  name="issued_date"
                  className="form-control"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  required
                />
                <div className="form-text">Date à laquelle la quittance est émise</div>
              </div>

              {/* Montant payé */}
              <div className="form-group">
                <label htmlFor="amount_paid" className="form-label">
                  Montant payé (FCFA) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  id="amount_paid"
                  name="amount_paid"
                  className="form-control"
                  placeholder="0.00"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  required
                />
                <div className="form-text">Montant effectivement payé par le locataire</div>
              </div>
            </div>

            {/* Notes */}
            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notes (optionnel)
              </label>
              <textarea
                id="notes"
                name="notes"
                className="form-control"
                rows={3}
                placeholder="Notes complémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <div className="form-text">Informations complémentaires sur ce paiement</div>
            </div>

            {/* Option email */}
            <div className="form-check">
              <input
                type="checkbox"
                id="send_email"
                name="send_email"
                className="form-check-input"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              <label htmlFor="send_email" className="form-check-label">
                <Mail size={16} />
                Envoyer automatiquement la quittance par email au locataire
              </label>
            </div>

            {/* Boutons */}
            <div className="form-actions">
              <button type="submit" className="button button-primary" disabled={isLoading}>
                <FilePlus size={16} />
                {isLoading ? 'Création...' : 'Créer la quittance'}
              </button>
              <button type="button" className="button button-secondary" onClick={() => navigate('/proprietaire/quittances')}>
                <X size={16} />
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreerQuittance;