import React, { useState, useEffect } from 'react';
import { Plus, Search, Loader2, Receipt, MapPin, Download, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { invoiceService } from '@/services/api';

interface FactureData {
    id: string;
    type: string;
    typeBadge: string;
    typeBadgeClass: string;
    titre: string;
    lieu: string;
    propertyName: string;
    propertyId: number;
    tenantName: string;
    date: string;
    invoiceNumber: string;
    amount: number;
    amountFormatted: string;
    dateBas: string;
    createdAt: string;
}

interface Property {
    id: number;
    name: string;
    address: string;
}

interface Stats {
    totalDocs: number;
    countThisMonth: number;
    totalAmount: number;
    overdue: number;
}

const FacturesDocs: React.FC<{ notify: (msg: string, type: 'success' | 'info' | 'error') => void }> = ({ notify }) => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [propertyFilter, setPropertyFilter] = useState<string>('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [factureList, setFactureList] = useState<FactureData[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats>({
        totalDocs: 0,
        countThisMonth: 0,
        totalAmount: 0,
        overdue: 0
    });
    const [properties, setProperties] = useState<Property[]>([]);

    const filters = [
        { label: 'Tous', value: '' },
        { label: 'Facture', value: 'rent' },
        { label: 'Travaux', value: 'repair' },
        { label: 'Assurances', value: 'deposit' },
        { label: 'Diagnostics', value: 'charge' },
        { label: 'Autres', value: 'other' }
    ];

    const getTypeBadgeClass = (type: string): string => {
        const classes: Record<string, string> = {
            'rent': 'badge-rent',
            'deposit': 'badge-deposit',
            'charge': 'badge-charge',
            'repair': 'badge-repair'
        };
        return classes[type] || 'badge-other';
    };

    const getTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            'rent': 'Facture Travaux',
            'deposit': 'Assurance GLI',
            'charge': 'Diagnostic Amiante',
            'repair': 'Facture Travaux'
        };
        return labels[type] || type;
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await invoiceService.listInvoices();
            
            let data = [];
            if (response && response.data) {
                data = response.data;
            } else if (Array.isArray(response)) {
                data = response;
            }
            
            let totalAmount = 0;
            let countThisMonth = 0;
            let overdue = 0;
            const now = new Date();

            // Map pour stocker les propriétés uniques
            const uniqueProperties = new Map<number, Property>();

            const mapped = data.map((f: any) => {
                const amount = parseFloat(f.amount_total || 0);
                const dueDate = new Date(f.due_date);
                
                // Calcul des stats
                if (f.type !== 'rent') totalAmount += amount;
                
                const createdAt = new Date(f.created_at);
                if (createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()) {
                    countThisMonth++;
                }
                
                if (dueDate < now && f.status !== 'paid') {
                    overdue++;
                }

                // Extraire les propriétés uniques des factures
                if (f.lease?.property) {
                    const prop = f.lease.property;
                    if (!uniqueProperties.has(prop.id)) {
                        uniqueProperties.set(prop.id, {
                            id: prop.id,
                            name: prop.name || prop.address || `Bien ${prop.id}`,
                            address: prop.address || ''
                        });
                    }
                }

                return {
                    id: String(f.id),
                    type: f.type || 'other',
                    typeBadge: getTypeLabel(f.type),
                    typeBadgeClass: getTypeBadgeClass(f.type),
                    titre: f.description || (f.invoice_number || `FACT-${f.id}`),
                    lieu: f.lease?.property?.name || 'N/A',
                    propertyName: f.lease?.property?.name || 'N/A',
                    propertyId: f.lease?.property?.id,
                    tenantName: f.lease?.tenant?.user?.name || 'N/A',
                    date: new Date(f.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
                    invoiceNumber: f.invoice_number || `FACT-${f.id}`,
                    amount: amount,
                    amountFormatted: amount.toLocaleString('fr-FR') + ' FCFA',
                    dateBas: new Date(f.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
                    createdAt: f.created_at
                };
            });

            setFactureList(mapped);
            setStats({
                totalDocs: mapped.length,
                countThisMonth: countThisMonth,
                totalAmount: totalAmount,
                overdue: overdue
            });
            
            // Mettre à jour les propriétés avec les valeurs uniques extraites
            setProperties(Array.from(uniqueProperties.values()));
            
        } catch (error) {
            console.error('Erreur factures:', error);
            notify('Erreur lors du chargement des factures', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fonction de téléchargement PDF
    const handleDownloadPdf = async (id: string, invoiceNumber: string) => {
        setDownloadingId(id);
        try {
            const blob = await invoiceService.downloadInvoicePdf(id);
            
            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `facture_${invoiceNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Nettoyer
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            notify('Facture téléchargée avec succès', 'success');
        } catch (error) {
            console.error('Erreur téléchargement PDF:', error);
            notify('Erreur lors du téléchargement de la facture', 'error');
        } finally {
            setDownloadingId(null);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filtrer les factures
    const filtered = factureList.filter(f => {
        // Filtre par type (tabs)
        if (activeFilter && f.type !== activeFilter) return false;
        
        // Filtre par type (select)
        if (typeFilter && f.type !== typeFilter) return false;
        
        // Filtre par propriété (par ID)
        if (propertyFilter && f.propertyId !== parseInt(propertyFilter)) return false;
        
        // Recherche textuelle
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return f.titre.toLowerCase().includes(search) ||
                   f.lieu.toLowerCase().includes(search) ||
                   f.invoiceNumber.toLowerCase().includes(search) ||
                   f.tenantName.toLowerCase().includes(search);
        }
        
        return true;
    });

    return (
        <div className="invoices-container">
            <style>{`
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                .invoices-container {
                    padding: 2rem;
                    max-width: 1400px;
                    margin: 0 auto;
                    background: #f8f9fa;
                    min-height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }

                .header-content h1 {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 0.5rem;
                }

                .header-description {
                    color: #1a1a1a;
                    font-size: 0.85rem;
                    line-height: 1.5;
                    max-width: 600px;
                    font-weight: 400; /* Normal */
                }

                .header-description strong {
                    font-weight: 600; /* Un peu plus gras mais pas trop */
                }

                .add-document-btn {
                    background: #70AE48;
                    color: white;
                    padding: 0.8rem 1.6rem;
                    border-radius: 2rem;
                    font-weight: 500;
                    font-size: 0.85rem;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    text-decoration: none;
                    transition: all 0.3s;
                    box-shadow: 0 4px 12px rgba(112, 174, 72, 0.3);
                    border: none;
                    cursor: pointer;
                }

                .add-document-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(112, 174, 72, 0.4);
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .stat-card {
                    background: white;
                    padding: 1.2rem;
                    border-radius: 0.75rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e8e8e8;
                }

                .stat-label {
                    font-size: 0.7rem; /* Augmenté de 0.65rem à 0.7rem */
                    color: #9e9e9e;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                }

                .stat-value {
                    font-size: 1.5rem; /* Augmenté de 1.3rem à 1.5rem */
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 0.25rem;
                }

                .stat-value.orange {
                    color: #ff9800;
                }

                .stat-value.red {
                    color: #f44336;
                }

                .filter-tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                }

                .filter-tab {
                    padding: 0.6rem 1.5rem; /* Augmenté de 0.5rem 1.4rem */
                    border-radius: 2rem;
                    border: none;
                    background: #e0e0e0;
                    color: #616161;
                    font-weight: 500;
                    font-size: 0.85rem; /* Augmenté de 0.8rem à 0.85rem */
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .filter-tab.active {
                    background: #70AE48;
                    color: white;
                    box-shadow: 0 2px 8px rgba(112, 174, 72, 0.3);
                }

                .filter-tab:hover:not(.active) {
                    background: #d0d0d0;
                }

                .filter-section {
                    background: white;
                    padding: 1.2rem;
                    border-radius: 0.75rem;
                    margin-bottom: 2rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e8e8e8;
                }

                .filter-title {
                    font-size: 0.85rem; /* Augmenté de 0.8rem à 0.85rem */
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-bottom: 1rem;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .filter-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.8rem;
                    margin-bottom: 0.8rem;
                }

                .filter-input {
                    width: 100%;
                    padding: 0.7rem 0.9rem; /* Augmenté de 0.6rem 0.8rem */
                    border: 1px solid #e0e0e0;
                    border-radius: 0.5rem;
                    font-size: 0.85rem; /* Augmenté de 0.8rem à 0.85rem */
                    color: #424242;
                    background: #fafafa;
                    transition: all 0.3s;
                }

                .filter-input:focus {
                    outline: none;
                    border-color: #70AE48;
                    background: white;
                }

                .search-input-wrapper {
                    position: relative;
                    grid-column: 1 / -1;
                }

                .search-input-wrapper svg {
                    position: absolute;
                    left: 0.9rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9e9e9e;
                    width: 18px; /* Augmenté de 16px à 18px */
                    height: 18px; /* Augmenté de 16px à 18px */
                }

                .search-input {
                    padding-left: 3rem;
                    width: 100%;
                }

                .cards-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1.2rem;
                    margin-bottom: 2rem;
                }

                .invoice-card {
                    background: white;
                    border-radius: 0.75rem;
                    padding: 1rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    border: 1px solid #e8e8e8;
                    transition: all 0.3s;
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }

                .invoice-card:hover {
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
                    transform: translateY(-2px);
                }

                .card-type-badge {
                    position: absolute;
                    top: 0;
                    left: 0;
                    padding: 0.35rem 0.75rem; /* Augmenté de 0.3rem 0.7rem */
                    border-radius: 0 0 0.5rem 0;
                    font-size: 0.65rem; /* Augmenté de 0.6rem à 0.65rem */
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .badge-rent {
                    background: #fff3e0;
                    color: #e65100;
                }

                .badge-deposit {
                    background: #e3f2fd;
                    color: #0d47a1;
                }

                .badge-charge {
                    background: #f3e5f5;
                    color: #4a148c;
                }

                .badge-repair {
                    background: #e8f5e9;
                    color: #1b5e20;
                }

                .badge-other {
                    background: #e0e0e0;
                    color: #616161;
                }

                .card-header {
                    margin-top: 1.5rem;
                    margin-bottom: 0.6rem;
                }

                .card-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1a1a1a;
                    margin-bottom: 0.4rem;
                }

                .card-location {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    color: #757575;
                    font-size: 0.8rem; /* Augmenté de 0.75rem à 0.8rem */
                }

                .card-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.8rem;
                    margin: 1rem 0;
                    padding: 1rem 0;
                    border-top: 1px solid #f0f0f0;
                    border-bottom: 1px solid #f0f0f0;
                }

                .detail-item {
                    display: flex;
                    flex-direction: column;
                    gap: 0.2rem;
                }

                .detail-label {
                    font-size: 0.7rem; /* Augmenté de 0.65rem à 0.7rem */
                    color: #9e9e9e;
                    text-transform: uppercase;
                    font-weight: 500;
                }

                .detail-value {
                    font-size: 0.85rem; /* Augmenté de 0.8rem à 0.85rem */
                    color: #424242;
                    font-weight: 600;
                }

                .detail-value.amount {
                    font-size: 1.1rem;
                    color: #ff9800;
                    font-weight: 700;
                }

                .card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: auto;
                }

                .added-date {
                    font-size: 0.75rem; /* Augmenté de 0.7rem à 0.75rem */
                    color: #9e9e9e;
                }

                .card-actions {
                    display: flex;
                    gap: 0.4rem;
                }

                .action-btn {
                    width: 2rem;
                    height: 2rem;
                    border-radius: 0.5rem;
                    border: 1px solid #e0e0e0;
                    background: white;
                    color: #616161;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .action-btn:hover {
                    background: #f5f5f5;
                    border-color: #70AE48;
                    color: #70AE48;
                }

                .action-btn.primary {
                    background: #70AE48;
                    color: white;
                    border-color: #70AE48;
                }

                .action-btn.primary:hover {
                    background: #5a8f3a;
                }

                .action-btn.primary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .action-btn svg {
                    width: 14px;
                    height: 14px;
                }

                .empty-state {
                    text-align: center;
                    padding: 2.5rem 1.5rem;
                    background: white;
                    border-radius: 0.75rem;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    grid-column: 1 / -1;
                }

                .empty-state svg {
                    margin-bottom: 1rem;
                    opacity: 0.3;
                    width: 50px;
                    height: 50px;
                }

                .empty-state h3 {
                    font-size: 1rem;
                    color: #424242;
                    margin-bottom: 0.4rem;
                }

                .empty-state p {
                    color: #757575;
                    margin-bottom: 1rem;
                    font-size: 0.8rem;
                }

                .empty-state a {
                    color: #70AE48;
                    text-decoration: none;
                    font-weight: 500;
                    cursor: pointer;
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }

                @media (max-width: 1024px) {
                    .cards-grid {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .stats-grid {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 0.8rem;
                    }

                    .filter-grid {
                        grid-template-columns: 1fr;
                    }
                    
                    .header-section {
                        flex-direction: column;
                        gap: 1rem;
                    }
                    
                    .add-document-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="header-section">
                <div className="header-content">
                    <h1>Factures et documents divers</h1>
                    <p className="header-description">
                        Centralisez tous vos documents importants : factures de travaux, assurances, diagnostics, attestations.<br />
                        Gardez une trace de toutes vos dépenses et documents administratifs.
                    </p>
                </div>
                <button className="add-document-btn" onClick={() => navigate('/proprietaire/émettre-facture')}>
                    <Plus size={18} strokeWidth={2.5} />
                    Ajouter un document
                </button>
            </div>

            {/* Statistiques */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-label">Total Documents</div>
                    <div className="stat-value">{stats.totalDocs}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Factures ce mois</div>
                    <div className="stat-value">{stats.countThisMonth}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Montant</div>
                    <div className="stat-value orange">{stats.totalAmount.toLocaleString('fr-FR')} FCFA</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">À renouveler</div>
                    <div className="stat-value red">{stats.overdue}</div>
                </div>
            </div>

            {/* Filtres par type (tabs) */}
            <div className="filter-tabs">
                {filters.map(filter => (
                    <button
                        key={filter.value}
                        className={`filter-tab ${activeFilter === filter.value ? 'active' : ''}`}
                        onClick={() => {
                            setActiveFilter(filter.value);
                            setTypeFilter(''); // Reset le select quand on utilise les tabs
                        }}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Section de filtres */}
            <div className="filter-section">
                <h3 className="filter-title">Filtrer par bien et par type</h3>
                <div className="filter-grid">
                    <select
                        className="filter-input"
                        value={propertyFilter}
                        onChange={(e) => setPropertyFilter(e.target.value)}
                    >
                        <option value="">Tous les biens</option>
                        {properties.map((prop) => (
                            <option key={prop.id} value={prop.id}>
                                {prop.name || prop.address || `Bien ${prop.id}`}
                            </option>
                        ))}
                    </select>

                    <select
                        className="filter-input"
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value);
                            setActiveFilter(''); // Reset les tabs quand on utilise le select
                        }}
                    >
                        <option value="">Tous les types</option>
                        <option value="rent">Facture</option>
                        <option value="repair">Travaux</option>
                        <option value="deposit">Assurances</option>
                        <option value="charge">Diagnostics</option>
                    </select>

                    <div className="search-input-wrapper">
                        <Search size={18} />
                        <input
                            type="text"
                            className="filter-input search-input"
                            placeholder="Rechercher"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Grille de cartes */}
            <div className="cards-grid">
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem 1.5rem' }}>
                        <Loader2 className="animate-spin" size={36} color="#70AE48" />
                        <p style={{ marginTop: '0.8rem', color: '#757575', fontSize: '0.85rem' }}>Chargement des factures...</p>
                    </div>
                ) : filtered.length > 0 ? (
                    filtered.map(f => (
                        <div className="invoice-card" key={f.id}>
                            <div className={`card-type-badge ${f.typeBadgeClass}`}>
                                {f.typeBadge}
                            </div>

                            <div className="card-header">
                                <div className="card-title">
                                    {f.titre}
                                </div>
                                <div className="card-location">
                                    <MapPin size={14} />
                                    {f.lieu}
                                </div>
                            </div>

                            <div className="card-details">
                                <div className="detail-item">
                                    <div className="detail-label">
                                        {f.type === 'rent' ? 'Prestataire' :
                                         f.type === 'deposit' ? 'Compagnie' :
                                         f.type === 'charge' ? 'Diagnostiqueur' : 'Fournisseur'}
                                    </div>
                                    <div className="detail-value">{f.propertyName}</div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">Date</div>
                                    <div className="detail-value">{f.date}</div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">N° Facture</div>
                                    <div className="detail-value">{f.invoiceNumber}</div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">Montant TTC</div>
                                    <div className="detail-value amount">{f.amountFormatted}</div>
                                </div>
                            </div>

                            <div className="card-footer">
                                <div className="added-date">
                                    Ajouté le {f.dateBas}
                                </div>
                                <div className="card-actions">
                                    {/* Bouton de téléchargement PDF */}
                                    <button 
                                        className="action-btn primary" 
                                        title="Télécharger PDF"
                                        onClick={() => handleDownloadPdf(f.id, f.invoiceNumber)}
                                        disabled={downloadingId === f.id}
                                    >
                                        {downloadingId === f.id ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : (
                                            <Download size={12} color="white" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <Receipt size={50} strokeWidth={1.5} />
                        <h3>Aucune facture trouvée</h3>
                        <p>
                            <a onClick={() => navigate('/proprietaire/émettre-facture')}>
                                Créez votre première facture
                            </a>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacturesDocs;