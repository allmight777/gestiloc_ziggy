import React, { useEffect, useState } from "react";
import { Plus, Loader2, AlertCircle, Eye, Archive, RefreshCw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../../services/api";

/* ─── Types ─── */
interface Tenant {
  id: number; 
  first_name: string; 
  last_name: string; 
  tenant_type: string;
  email: string; 
  phone: string; 
  status: string;
  invitation_status?: string;
  meta?: { 
    landlord_id?: number; 
    invitation_email?: string; 
    phone?: string; 
    invitation_id?: number; 
    invitation_status?: string;
    accepted_at?: string;
    [key: string]: any; 
  };
  user?: { id: number; email: string; phone: string; email_verified_at?: string };
  leases?: any[]; 
  properties?: any[];
  property_name?: string;
  has_property?: boolean;
  created_by?: string;
  full_name?: string;
}

interface Property { 
  id: number; 
  name: string; 
  address: string; 
  city: string; 
  status?: string;
  type?: string; // 'owned' ou 'delegated'
}

interface ApiResponse { 
  tenants: Tenant[]; 
  invitations: any[]; 
}

interface TenantsListProps { 
  notify?: (msg: string, type: "success" | "info" | "error") => void; 
}

/* ─── Modal ─── */
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, details, icon, confirmText = "Confirmer", loading = false }: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; details?: React.ReactNode;
  icon?: React.ReactNode; confirmText?: string; loading?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div style={{ display:"flex", position:"fixed", top:0, left:0, width:"100%", height:"100%", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)", zIndex:1000, alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:"white", borderRadius:16, width:"90%", maxWidth:500, boxShadow:"0 20px 25px -5px rgba(0,0,0,0.1)", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:"24px 24px 16px", borderBottom:"1px solid #e5e7eb", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h3 style={{ margin:0, fontSize:20, fontWeight:700, color:"#111827" }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", fontSize:24, color:"#9ca3af", cursor:"pointer" }}>×</button>
        </div>
        <div style={{ padding:24, textAlign:"center" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 20px", fontSize:32, background: "#fef3c7" }}>{icon}</div>
          <p style={{ fontSize:16, color:"#111827", lineHeight:1.5, marginBottom:16 }}>{message}</p>
          {details && <div style={{ background:"#f9fafb", border:"1px solid #e5e7eb", borderRadius:8, padding:16, marginTop:16, textAlign:"left" }}>{details}</div>}
        </div>
        <div style={{ padding:"16px 24px 24px", borderTop:"1px solid #e5e7eb", display:"flex", gap:12, justifyContent:"flex-end" }}>
          <button onClick={onClose} style={{ padding:"10px 20px", borderRadius:8, border:"1px solid #e5e7eb", background:"white", fontSize:14, fontWeight:600, color:"#6b7280", cursor:"pointer" }}>Annuler</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding:"10px 20px", borderRadius:8, border:"none", fontSize:14, fontWeight:600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, display:"flex", alignItems:"center", gap:8, background:"#70AE48", color:"white" }}>
            {loading && <Loader2 size={14} className="spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Composant principal ─── */
export const TenantsList: React.FC<TenantsListProps> = ({ notify }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"active" | "archived">("active");
  const [search, setSearch] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [perPage, setPerPage] = useState("100");
  const [modalArchive, setModalArchive] = useState<{ open: boolean; tenant: Tenant | null }>({ open: false, tenant: null });
  const [modalRestore, setModalRestore] = useState<{ open: boolean; tenant: Tenant | null }>({ open: false, tenant: null });

  // Compteurs corrects
  const [actifCount, setActifCount] = useState(0);
  const [archiveCount, setArchiveCount] = useState(0);

  const successMessage: string | null = location.state?.success || null;
  
  useEffect(() => {
    if (successMessage) { 
      notify?.(successMessage, "success"); 
      window.history.replaceState({}, document.title); 
    }
  }, [successMessage, notify]);
  
  useEffect(() => { 
    fetchTenants(); 
    fetchProperties(); 
  }, [status, search, propertyId, perPage]);

  const fetchTenants = async () => {
    try {
      setLoading(true); 
      setError(null);
      const params = new URLSearchParams();
      params.append("status", status);
      if (search) params.append("search", search);
      if (propertyId) params.append("property_id", propertyId);
      if (perPage) params.append("per_page", perPage);
      
      const response = await api.get<ApiResponse>(`/tenants?${params.toString()}`);
      console.log("API Response:", response.data);
      
      const tenantsData = response.data.tenants || [];
      setTenants(tenantsData);
      
      // Calculer les compteurs depuis les tenants actuels
      const active = tenantsData.filter((t: Tenant) => t.status !== "archived").length;
      const archived = tenantsData.filter((t: Tenant) => t.status === "archived").length;
      
      setActifCount(active);
      setArchiveCount(archived);
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Impossible de charger les locataires");
      notify?.(err.response?.data?.message || "Erreur de chargement", "error");
    } finally { 
      setLoading(false); 
    }
  };

  const fetchProperties = async () => {
    try { 
      // UTILISER LE NOUVEL ENDPOINT CORRIGÉ
      const response = await api.get("/properties-for-filter"); 
      setProperties(response.data || []); 
      console.log("Propriétés chargées (avec biens délégués):", response.data);
    } catch (err) {
      console.error("Erreur chargement propriétés:", err);
      // En cas d'erreur, essayer l'ancien endpoint
      try {
        const fallbackResponse = await api.get("/landlord/properties");
        setProperties(fallbackResponse.data || []);
      } catch (fallbackErr) {
        console.error("Erreur aussi avec l'ancien endpoint:", fallbackErr);
      }
    }
  };

  const getInvitationStatus = (tenant: Tenant) => {
    const meta = tenant.meta || {};
    
    // Utiliser invitation_status qui vient du contrôleur corrigé
    const invitationStatus = tenant.invitation_status || meta.invitation_status;
    
    // Vérifier si l'utilisateur a vérifié son email
    const hasVerifiedEmail = tenant.user?.email_verified_at != null;
    
    // Vérifier si l'invitation a été acceptée
    const hasAccepted = hasVerifiedEmail || meta.accepted_at != null || invitationStatus === "accepted";
    
    // Si accepté
    if (hasAccepted) {
      return { text: "Acceptée", cls: "active", icon: "✅" };
    }
    
    // Si expiré
    if (invitationStatus === "expired") {
      return { text: "Expirée", cls: "expired", icon: "❌" };
    }
    
    // Si en attente
    if (tenant.status === "candidate" || invitationStatus === "pending" || invitationStatus === "invited") {
      return { text: "Non acceptée", cls: "pending", icon: "⏳" };
    }
    
    // Par défaut
    return { text: "Non acceptée", cls: "pending", icon: "⏳" };
  };

  const getTenantProperty = (tenant: Tenant): string => {
    if (tenant.properties?.length) {
      const prop = tenant.properties[0];
      return prop.name || `Bien #${prop.id}`;
    }
    if (tenant.leases?.length) {
      const lease = tenant.leases[0];
      return lease.property?.name || `Bien #${lease.property_id}`;
    }
    if (tenant.property_name) {
      return tenant.property_name;
    }
    return "";
  };

  const handleArchive = async () => {
    if (!modalArchive.tenant) return;
    setActionLoading(true);
    try { 
      await api.post(`/tenants/${modalArchive.tenant.id}/archive`); 
      notify?.("Locataire archivé avec succès", "success"); 
      await fetchTenants(); 
      setModalArchive({ open: false, tenant: null }); 
    } catch (err: any) { 
      notify?.(err.response?.data?.message || "Erreur lors de l'archivage", "error"); 
    } finally { 
      setActionLoading(false); 
    }
  };

  const handleRestore = async () => {
    if (!modalRestore.tenant) return;
    setActionLoading(true);
    try { 
      await api.post(`/tenants/${modalRestore.tenant.id}/restore`); 
      notify?.("Locataire restauré avec succès", "success"); 
      await fetchTenants(); 
      setModalRestore({ open: false, tenant: null }); 
    } catch (err: any) { 
      notify?.(err.response?.data?.message || "Erreur lors de la restauration", "error"); 
    } finally { 
      setActionLoading(false); 
    }
  };

  // Filtrer les tenants selon l'onglet actif
  const filteredTenants = tenants.filter(tenant => {
    if (status === "active") return tenant.status !== "archived";
    return tenant.status === "archived";
  });

  return (
    <>
      <style>{`
        /* STYLES AVEC TAILLE AUGMENTÉE */
        .tl-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; }
        .tl-card { background: #fff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; }

        .tl-header { color: #000; padding: 24px 24px 0; }
        .tl-header h1 { font-size: 28px; font-weight: 700; margin: 0 0 4px; }
        .tl-header > p { font-size: 15px; color: #6b7280; margin: 0 0 16px; }

        .tl-tabs { display: flex; gap: 8px; margin-top: 16px; margin-bottom: 12px; }
        .tl-tab { padding: 10px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; cursor: pointer; border: 1px solid #70AE48; background: #ecfdf5; color: #065f46; transition: all 0.2s ease; text-decoration: none; display: inline-block; }
        .tl-tab.active { background: #70AE48; color: #fff; }
        .tl-tab:not(.active):hover { background: #70AE48; color: #fff; }

        .tl-body { padding: 24px; }

        .tl-top-actions { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .tl-btn-back { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; text-decoration: none; }
        .tl-btn-back:hover { background: #f3f4f6; border-color: #70AE48; color: #70AE48; }
        .tl-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; background: #70AE48; border: none; border-radius: 6px; color: white; font-size: 14px; font-weight: 600; cursor: pointer; }
        .tl-btn-primary:hover { background: #5d8f3a; }

        .tl-filters { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin-bottom: 20px; }
        .tl-filters-title { display: flex; align-items: center; gap: 6px; color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
        .tl-filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .tl-filter-group label { display: block; color: #111827; font-size: 14px; font-weight: 600; margin-bottom: 6px; }
        .tl-select { width: 100%; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 14px; color: #111827; background: white; cursor: pointer; }

        .tl-search-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .tl-search-box { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; width: 300px; }
        .tl-search-input { flex: 1; border: none; outline: none; font-size: 14px; color: #111827; background: transparent; }
        .tl-search-input::placeholder { color: #9ca3af; }
        .tl-btn-view { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 4px; color: #6b7280; font-size: 14px; font-weight: 500; cursor: pointer; }

        .tl-results-info { margin-bottom: 12px; color: #6b7280; font-size: 14px; }

        .tl-table-wrap { overflow-x: auto; margin-bottom: 20px; }
        .tl-table { width: 100%; border-collapse: collapse; }
        .tl-table th { padding: 12px 12px; text-align: left; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e5e7eb; white-space: nowrap; font-size: 14px; text-transform: uppercase; background: #f8fafc; }
        .tl-table td { padding: 14px 12px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; font-size: 14px; }
        .tl-table tbody tr:hover { background: #f9fafb; }

        .tl-invitation-badge { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; white-space: nowrap; }
        .tl-invitation-badge.active   { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .tl-invitation-badge.pending  { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .tl-invitation-badge.expired  { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }

        .tl-muted   { color: #9ca3af; font-style: italic; font-size: 14px; }

        .tl-actions { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .tl-btn-action { padding: 8px 14px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; color: #374151; font-size: 14px; font-weight: 500; cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; }
        .tl-btn-action:hover { background: #e5e7eb; }
        .tl-btn-archive { background: #fef3c7 !important; color: #92400e !important; border: 1px solid #fde68a !important; }
        .tl-btn-archive:hover { background: #fde68a !important; }
        .tl-btn-restore { background: #d1fae5 !important; color: #065f46 !important; border: 1px solid #a7f3d0 !important; }
        .tl-btn-restore:hover { background: #a7f3d0 !important; }

        .tl-add-bottom { text-align: center; padding: 20px; border-top: 1px solid #e5e7eb; }
        .tl-btn-add { display: inline-flex; align-items: center; gap: 6px; padding: 10px 22px; background: white; border: 2px dashed #e5e7eb; border-radius: 6px; color: #6b7280; font-size: 14px; font-weight: 600; cursor: pointer; }
        .tl-btn-add:hover { border-color: #70AE48; color: #70AE48; }

        .tl-empty { text-align: center; padding: 48px 24px; background: #f9fafb; border: 2px dashed #e5e7eb; border-radius: 8px; margin: 24px 0; }
        .tl-empty h3 { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 6px; }
        .tl-empty p { color: #6b7280; margin-bottom: 16px; font-size: 14px; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      {/* Modals - SANS ID */}
      <ConfirmationModal 
        isOpen={modalArchive.open} 
        onClose={() => setModalArchive({ open: false, tenant: null })} 
        onConfirm={handleArchive}
        title="Archiver le locataire" 
        message="Êtes-vous sûr de vouloir archiver ce locataire ?"
        icon={<Archive size={28} color="#92400e" />} 
        confirmText="Oui, archiver" 
        loading={actionLoading}
        details={modalArchive.tenant && 
          <div>
            <p><strong>Locataire :</strong> {modalArchive.tenant.first_name} {modalArchive.tenant.last_name}</p>
            <p style={{ color: "#92400e", marginTop: 8 }}>⚠️ Ce locataire sera déplacé vers les archives.</p>
          </div>
        }
      />
      
      <ConfirmationModal 
        isOpen={modalRestore.open} 
        onClose={() => setModalRestore({ open: false, tenant: null })} 
        onConfirm={handleRestore}
        title="Restaurer le locataire" 
        message="Êtes-vous sûr de vouloir restaurer ce locataire ?"
        icon={<RefreshCw size={28} color="#065f46" />} 
        confirmText="Oui, restaurer" 
        loading={actionLoading}
        details={modalRestore.tenant && 
          <div>
            <p><strong>Locataire :</strong> {modalRestore.tenant.first_name} {modalRestore.tenant.last_name}</p>
            <p style={{ color: "#065f46", marginTop: 8 }}>✅ Ce locataire sera déplacé vers la liste active.</p>
          </div>
        }
      />

      <div className="tl-container">
        <div className="tl-card">
          <div className="tl-header">
            <h1>Liste des locataires</h1>
            <p>Créez un nouveau contrat entre un bien et un locataire</p>
            <div className="tl-tabs">
              <button 
                className={`tl-tab ${status === "active" ? "active" : ""}`} 
                onClick={() => setStatus("active")}
              >
                Actifs ({actifCount})
              </button>
              <button 
                className={`tl-tab ${status === "archived" ? "active" : ""}`} 
                onClick={() => setStatus("archived")}
              >
                Archives ({archiveCount})
              </button>
            </div>
          </div>

          <div className="tl-body">
            <div className="tl-top-actions">
              <button className="tl-btn-back" onClick={() => navigate("/proprietaire/dashboard")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Retour au tableau de bord
              </button>
              <button className="tl-btn-primary" onClick={() => navigate("/proprietaire/ajouter-locataire")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Créer un locataire
              </button>
            </div>

            <div className="tl-filters">
              <div className="tl-filters-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                FILTRER - UTILISEZ LES OPTIONS CI-DESSOUS
              </div>
              <div className="tl-filters-grid">
                <div className="tl-filter-group">
                  <label>Bien</label>
                  <select className="tl-select" value={propertyId} onChange={e => setPropertyId(e.target.value)}>
                    <option value="">Tous les biens</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name || `Bien #${p.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="tl-filter-group">
                  <label>Lignes par page</label>
                  <select className="tl-select" value={perPage} onChange={e => setPerPage(e.target.value)}>
                    <option value="10">10 lignes</option>
                    <option value="20">20 lignes</option>
                    <option value="50">50 lignes</option>
                    <option value="100">100 lignes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="tl-search-row">
              <div className="tl-search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70AE48" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input 
                  type="text" 
                  className="tl-search-input" 
                  placeholder="Rechercher" 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                />
              </div>
              <button className="tl-btn-view">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M21 9H3M9 21V9" />
                </svg>
                Affichage
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
                <Loader2 size={24} className="spin" style={{ margin: "0 auto 12px", display: "block" }} />
                Chargement des locataires...
              </div>
            ) : error ? (
              <div style={{ textAlign: "center", padding: 40, color: "#e11d48" }}>
                <AlertCircle size={24} style={{ margin: "0 auto 12px", display: "block" }} />
                {error}
              </div>
            ) : filteredTenants.length > 0 ? (
              <>
                <div className="tl-results-info">{filteredTenants.length} résultat(s) trouvé(s)</div>
                <div className="tl-table-wrap">
                  <table className="tl-table">
                    <thead>
                      <tr>
                        <th>Locataire</th>
                        <th>Bien</th>
                        <th>Contact</th>
                        <th>Invitation</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map(tenant => {
                        const inv = getInvitationStatus(tenant);
                        const propName = getTenantProperty(tenant);
                        const email = tenant.user?.email ?? tenant.meta?.invitation_email ?? tenant.email ?? "—";
                        const phone = tenant.user?.phone ?? tenant.meta?.phone ?? tenant.phone ?? "—";
                        return (
                          <tr key={tenant.id}>
                            <td style={{ fontWeight: 600, color: "#111827", fontSize: "14px" }}>
                              {tenant.first_name} {tenant.last_name}
                            </td>
                            <td>
                              {propName || <span className="tl-muted">Aucun bien</span>}
                            </td>
                            <td>
                              <div>{phone}</div>
                              <div style={{ color: "#9ca3af" }}>{email}</div>
                            </td>
                            <td>
                              <span className={`tl-invitation-badge ${inv.cls}`}>
                                {inv.icon} {inv.text}
                              </span>
                            </td>
                            <td>
                              <div className="tl-actions">
                        
                                {tenant.status !== "archived" ? (
                                  <button 
                                    className="tl-btn-action tl-btn-archive" 
                                    onClick={() => setModalArchive({ open: true, tenant })}
                                  >
                                    Archiver
                                  </button>
                                ) : (
                                  <button 
                                    className="tl-btn-action tl-btn-restore" 
                                    onClick={() => setModalRestore({ open: true, tenant })}
                                  >
                                    Restaurer
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="tl-add-bottom">
                  <button className="tl-btn-add" onClick={() => navigate("/proprietaire/ajouter-locataire")}>
                    <Plus size={14} /> Ajouter un locataire
                  </button>
                </div>
              </>
            ) : (
              <div className="tl-empty">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <h3>Aucun locataire trouvé</h3>
                <p>Vous pouvez inviter vos locataires pour leur donner accès à la zone membres.</p>
                <button className="tl-btn-primary" onClick={() => navigate("/proprietaire/ajouter-locataire")}>
                  <Plus size={14} /> Créer un locataire
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TenantsList;