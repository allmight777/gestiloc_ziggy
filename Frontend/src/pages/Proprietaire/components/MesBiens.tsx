import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Home,
  MapPin,
  Euro,
  Image as ImageIcon,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  X,
  Save,
  Building2,
  Ruler,
  ArrowLeft,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { uploadService, propertyService } from "../../../services/api";

// Types
interface Property {
  id: number;
  type: string;
  name: string;
  title?: string;
  description?: string;
  address: string;
  city?: string;
  district?: string;
  zip_code?: string;
  surface?: string;
  room_count?: number;
  bedroom_count?: number;
  bathroom_count?: number;
  rent_amount?: string;
  charges_amount?: string;
  caution?: string;
  status?: string;
  reference_code?: string;
  photos?: string[];
  floor?: number;
  wc_count?: number;
  construction_year?: number;
  total_floors?: number;
  property_type?: string;
}

interface MesBiensProps {
  notify?: (msg: string, type: "success" | "info" | "error") => void;
  currentUser?: {
    id: number;
    email: string;
    role: "landlord" | "co_owner" | "admin";
  };
}

const filters = ["Tous", "Disponible", "Loué", "En maintenance", "Retiré du marché"];

const STATUS_MAP: Record<string, string> = {
  available: "Disponible",
  rented: "Loué",
  maintenance: "En maintenance",
  off_market: "Retiré du marché",
};

const TYPE_MAP: Record<string, string> = {
  apartment: "APPARTEMENT",
  house: "MAISON",
  office: "BUREAU",
  commercial: "LOCAL COMMERCIAL",
  parking: "PARKING",
  other: "AUTRE",
};

const getBackendOrigin = () => {
  const baseURL = (api.defaults.baseURL || "").toString();
  if (!baseURL) return window.location.origin;
  try {
    return new URL(baseURL).origin;
  } catch {
    try {
      return new URL(baseURL, window.location.origin).origin;
    } catch {
      return window.location.origin;
    }
  }
};

const resolvePhotoUrl = (p?: string | null) => {
  if (!p) return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  const origin = getBackendOrigin();
  if (p.startsWith("/storage/")) return `${origin}${p}`;
  const normalized = p.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${origin}/storage/${normalized}`;
};

// Styles pour le composant
const styles = `
  .edit-form {
    background: white;
    border-radius: 24px;
    width: 90%;
    max-width: 860px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .edit-header {
    padding: 1.5rem 1.75rem 0;
  }

  .edit-header-content {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .edit-title-section {
    flex: 1;
  }

  .edit-title {
    font-family: 'Merriweather', serif;
    font-size: 1.35rem;
    font-weight: 800;
    margin: 6px 0 0 0;
    color: #111;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .edit-subtitle {
    font-size: 0.7rem;
    font-weight: 700;
    color: #70AE48;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0;
  }

  .edit-badges {
    display: flex;
    gap: 8px;
    margin-top: 6px;
  }

  .edit-badge {
    font-size: 0.7rem;
    font-weight: 700;
    color: #70AE48;
    background: #f0f9e6;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .edit-body {
    padding: 1.25rem 1.75rem 1.5rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .form-section-title {
    font-size: 0.7rem;
    font-weight: 700;
    color: #70AE48;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0 0 8px 0;
  }

  .form-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }

  .form-fields.one {
    grid-template-columns: 1fr;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-label {
    font-size: 0.75rem;
    font-weight: 700;
    color: #374151;
    display: block;
    margin-bottom: 4px;
  }

  .form-required {
    color: #dc2626;
  }

  .form-control {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid #d1d5db;
    border-radius: 10px;
    font-size: 0.85rem;
    font-family: 'Manrope', sans-serif;
    font-weight: 500;
    color: #111;
    outline: none;
    box-sizing: border-box;
    background: #fff;
  }

  .form-control:focus {
    border-color: #70AE48;
    box-shadow: 0 0 0 3px rgba(112,174,72,0.12);
  }

  .form-control-warm {
    width: 100%;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid #ffcc80;
    border-radius: 10px;
    font-size: 0.85rem;
    font-family: 'Manrope', sans-serif;
    font-weight: 500;
    color: #111;
    outline: none;
    box-sizing: border-box;
    background: #fff;
  }

  .form-control-warm:focus {
    border-color: #fb8c00;
    box-shadow: 0 0 0 3px rgba(255,152,0,0.12);
  }

  .form-error {
    font-size: 0.7rem;
    font-weight: 600;
    color: #dc2626;
    margin-top: 2px;
    display: block;
  }

  .form-help {
    font-size: 0.7rem;
    color: #9ca3af;
    font-weight: 500;
    font-style: italic;
    margin-top: 2px;
    display: block;
  }

  .finances-section {
    margin-top: 20px;
    background: linear-gradient(135deg, #fff8ef 0%, #fff3e0 100%);
    border: 1.5px solid #ffe0b2;
    border-radius: 16px;
    padding: 1.25rem;
  }

  .finances-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .finances-title span {
    font-size: 1.1rem;
  }

  .finances-title h3 {
    font-family: 'Merriweather', serif;
    font-size: 0.95rem;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0;
  }

  .photo-section {
    position: relative;
    width: 100%;
    height: 180px;
    border-radius: 16px;
    overflow: hidden;
    background: linear-gradient(135deg, #e8eaf0 0%, #d5d8e0 100%);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .photo-label {
    position: absolute;
    bottom: 12px;
    left: 14px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #fff;
    background: rgba(0,0,0,0.38);
    border-radius: 6px;
    padding: 3px 10px;
  }

  .photo-upload-btn {
    position: absolute;
    bottom: 12px;
    right: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    color: #374151;
    background: #fff;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    padding: 5px 12px;
    cursor: pointer;
  }

  .photos-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 10px;
  }

  .photo-thumb {
    position: relative;
    width: 100px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
  }

  .photo-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .photo-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    background: rgba(239,68,68,0.9);
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    zIndex: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.38);
    backdropFilter: blur(4px);
  }

  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 4px;
    border-radius: 8px;
    transition: 0.15s;
  }

  .modal-close:hover {
    background: #f3f4f6;
  }

  .divider {
    border-bottom: 1.5px solid #e5e7eb;
    margin: 1rem 0 0;
  }

  .form-actions {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1.5px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn-cancel {
    padding: 10px 22px;
    border-radius: 10px;
    border: 1.5px solid #d1d5db;
    background: #fff;
    font-family: 'Manrope', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: #374151;
    cursor: pointer;
  }

  .btn-save {
    padding: 10px 22px;
    border-radius: 10px;
    border: none;
    background: linear-gradient(135deg, #70AE48 0%, #8BC34A 100%);
    font-family: 'Manrope', sans-serif;
    font-size: 0.82rem;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(112,174,72,0.25);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-save:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(112,174,72,0.3);
  }

  @media (max-width: 768px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
    .form-actions {
      flex-direction: column;
    }
    .btn-cancel, .btn-save {
      width: 100%;
      justify-content: center;
    }
  }
`;

// Composant pour éditer un bien (version simplifiée avec les mêmes champs que l'ajout)
const EditPropertyModal: React.FC<{
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
  notify?: (msg: string, type: "success" | "info" | "error") => void;
}> = ({ property, onClose, onSuccess, notify }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    property_type: property.type || property.property_type || "apartment",
    name: property.name || property.title || "",
    description: property.description || "",
    address: property.address || "",
    city: property.city || "",
    district: property.district || "",
    zip_code: property.zip_code || "",
    surface: property.surface || "",
    floor: property.floor || "",
    total_floors: property.total_floors || "",
    room_count: property.room_count || "",
    bedroom_count: property.bedroom_count || "",
    bathroom_count: property.bathroom_count || "",
    wc_count: property.wc_count || "",
    construction_year: property.construction_year || "",
    rent_amount: property.rent_amount || "",
    charges_amount: property.charges_amount || "",
    caution: property.caution || "",
    status: property.status || "available",
    reference_code: property.reference_code || "",
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (property) {
      setFormData({
        property_type: property.type || property.property_type || "apartment",
        name: property.name || property.title || "",
        description: property.description || "",
        address: property.address || "",
        city: property.city || "",
        district: property.district || "",
        zip_code: property.zip_code || "",
        surface: property.surface || "",
        floor: property.floor || "",
        total_floors: property.total_floors || "",
        room_count: property.room_count || "",
        bedroom_count: property.bedroom_count || "",
        bathroom_count: property.bathroom_count || "",
        wc_count: property.wc_count || "",
        construction_year: property.construction_year || "",
        rent_amount: property.rent_amount || "",
        charges_amount: property.charges_amount || "",
        caution: property.caution || "",
        status: property.status || "available",
        reference_code: property.reference_code || "",
      });

      // Photos
      if (property.photos && property.photos.length > 0) {
        const photoUrls = property.photos.map((photo: string) => 
          photo.startsWith('http') ? photo : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/storage/${photo}`
        );
        setPhotos(photoUrls);
      }
    }
  }, [property]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const maxPhotos = 8 - photos.length - newPhotos.length;

    if (fileArray.length > maxPhotos) {
      notify?.(`Maximum ${maxPhotos} photos supplémentaires autorisées`, "error");
      return;
    }

    const newFiles = fileArray.slice(0, maxPhotos);
    setNewPhotos(prev => [...prev, ...newFiles]);

    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleRemovePhoto = (index: number, isNew: boolean) => {
    if (isNew) {
      setNewPhotos(prev => prev.filter((_, i) => i !== index));
      setPhotoPreviews(prev => {
        const url = prev[index];
        URL.revokeObjectURL(url);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setPhotos(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    if (!formData.name?.trim()) errors.name = "Le titre du bien est obligatoire.";
    if (!formData.surface || Number(formData.surface) <= 0) errors.surface = "La surface doit être > 0.";
    if (!formData.address?.trim()) errors.address = "L'adresse est obligatoire.";
    if (!formData.city?.trim()) errors.city = "La ville est obligatoire.";
    if (formData.rent_amount && Number(formData.rent_amount) < 0) errors.rent_amount = "Le loyer doit être positif.";
    if (formData.reference_code && !/^[A-Z0-9-]+$/.test(formData.reference_code)) {
      errors.reference_code = "Uniquement lettres MAJ, chiffres et tirets.";
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;

    const errors = validate();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      const msg = Object.values(errors)[0] || "Veuillez vérifier le formulaire.";
      notify?.(msg, "error");
      return;
    }

    setIsLoading(true);

    try {
      // Préparer les données pour l'envoi
      const payload: any = {
        type: formData.property_type,
        title: formData.name.trim(),
        name: formData.name.trim(),
        description: formData.description || null,
        address: formData.address,
        district: formData.district || null,
        city: formData.city,
        state: null,
        zip_code: formData.zip_code || null,
        latitude: null,
        longitude: null,
        surface: formData.surface ? parseFloat(formData.surface) : null,
        room_count: formData.room_count ? parseInt(formData.room_count) : null,
        bedroom_count: formData.bedroom_count ? parseInt(formData.bedroom_count) : null,
        bathroom_count: formData.bathroom_count ? parseInt(formData.bathroom_count) : null,
        wc_count: formData.wc_count ? parseInt(formData.wc_count) : null,
        construction_year: formData.construction_year ? parseInt(formData.construction_year) : null,
        total_floors: formData.total_floors ? parseInt(formData.total_floors) : null,
        rent_amount: formData.rent_amount ? parseFloat(formData.rent_amount) : null,
        charges_amount: formData.charges_amount ? parseFloat(formData.charges_amount) : null,
        caution: formData.caution ? parseFloat(formData.caution) : null,
        status: formData.status,
        reference_code: formData.reference_code || null,
        floor: formData.floor ? parseInt(formData.floor) : null,
      };

      // Upload des nouvelles photos si nécessaire
      if (newPhotos.length > 0) {
        const formDataPhotos = new FormData();
        newPhotos.forEach(file => {
          formDataPhotos.append('photos[]', file);
        });
        // Ici, appelez votre service d'upload
        // const uploadRes = await uploadService.uploadMultiple(formDataPhotos);
        // payload.photos = uploadRes.paths;
      }

      // Appeler l'API pour mettre à jour
      await propertyService.updateProperty(property.id, payload);

      notify?.("✅ Bien modifié avec succès !", "success");
      onSuccess();
    } catch (error: any) {
      console.error("Erreur lors de la modification:", error);
      
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const be = error.response.data.errors;
        const mapped: Record<string, string> = {};
        if (be.title || be.name) mapped.name = (be.title?.[0] || be.name?.[0]) ?? "Titre invalide.";
        if (be.surface) mapped.surface = be.surface?.[0] || "Surface invalide.";
        if (be.address) mapped.address = be.address?.[0] || "Adresse invalide.";
        if (be.city) mapped.city = be.city?.[0] || "Ville invalide.";
        if (be.reference_code) mapped.reference_code = be.reference_code?.[0] || "Référence invalide.";
        if (be.rent_amount) mapped.rent_amount = be.rent_amount?.[0] || "Loyer invalide.";
        setFormErrors(mapped);
        notify?.("Certains champs sont invalides.", "error");
      } else {
        notify?.(error.response?.data?.message || "Une erreur est survenue", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.38)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 24,
          width: "95%",
          maxWidth: 860,
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          fontFamily: "'Manrope', sans-serif",
        }}
      >
        {/* ── Header ── */}
        <div style={{ padding: "1.5rem 1.75rem 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#70AE48", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
                MODIFIER LE BIEN
              </p>
              <h2 style={{ fontFamily: "'Merriweather', serif", fontSize: "1.35rem", fontWeight: 800, margin: "6px 0 0 0", color: "#111" }}>
                {property.name || "Sans titre"}
              </h2>
              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <span style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#70AE48",
                  background: "#f0f9e6",
                  padding: "3px 8px",
                  borderRadius: 6,
                }}>
                  {property.reference_code ? `Réf: ${property.reference_code}` : "Sans référence"}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                padding: 4,
                borderRadius: 8,
                transition: "0.15s",
              }}
            >
              <X size={22} />
            </button>
          </div>
          <div style={{ borderBottom: "1.5px solid #e5e7eb", margin: "1rem 0 0" }} />
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "1.25rem 1.75rem 1.5rem" }}>
          <form onSubmit={handleSubmit}>
            {/* Photos */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: 180,
                borderRadius: 16,
                overflow: "hidden",
                background: "linear-gradient(135deg, #e8eaf0 0%, #d5d8e0 100%)",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {photos.length > 0 ? (
                <img
                  src={photos[0]}
                  alt="Photo principale"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={() => {}}
                />
              ) : photoPreviews.length > 0 ? (
                <img
                  src={photoPreviews[0]}
                  alt="Nouvelle photo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <ImageIcon size={48} color="#b0b5c0" />
              )}

              <span
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 14,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#fff",
                  background: "rgba(0,0,0,0.38)",
                  borderRadius: 6,
                  padding: "3px 10px",
                }}
              >
                Photo principale
              </span>
              
              <label
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 14,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#374151",
                  background: "#fff",
                  border: "1px solid #d1d5db",
                  borderRadius: 8,
                  padding: "5px 12px",
                  cursor: "pointer",
                }}
              >
                <ImageIcon size={14} />
                Changer les photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  style={{ display: "none" }}
                />
              </label>
            </div>

            {/* Grille 2 colonnes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

              {/* COLONNE GAUCHE */}
              <div>
                {/* INFORMATIONS GÉNÉRALES */}
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#70AE48", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  INFORMATIONS GÉNÉRALES
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Type</label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                    >
                      <option value="apartment">Appartement</option>
                      <option value="house">Maison</option>
                      <option value="office">Bureau</option>
                      <option value="commercial">Local commercial</option>
                      <option value="parking">Parking</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Statut</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                    >
                      <option value="available">Disponible</option>
                      <option value="rented">Loué</option>
                      <option value="maintenance">En maintenance</option>
                      <option value="off_market">Retiré du marché</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Nom du bien</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ex: Appartement T3 centre-ville"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      border: "1.5px solid #d1d5db",
                      borderRadius: 10,
                      fontSize: "0.85rem",
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      color: "#111",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#fff",
                    }}
                  />
                  {formErrors.name && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.name}</span>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Surface (m²)</label>
                    <input
                      type="number"
                      name="surface"
                      value={formData.surface}
                      onChange={handleChange}
                      placeholder="Ex: 65"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                      min="0"
                      step="0.01"
                    />
                    {formErrors.surface && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.surface}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Référence</label>
                    <input
                      type="text"
                      name="reference_code"
                      value={formData.reference_code}
                      onChange={(e) => {
                        const v = e.target.value.toUpperCase();
                        setFormData((p: any) => ({ ...p, reference_code: v }));
                      }}
                      placeholder="Ex: APP-123"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Étage</label>
                    <input
                      type="number"
                      name="floor"
                      value={formData.floor}
                      onChange={handleChange}
                      placeholder="Ex: 3"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                      min="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Chambres</label>
                    <input
                      type="number"
                      name="bedroom_count"
                      value={formData.bedroom_count}
                      onChange={handleChange}
                      placeholder="Ex: 3"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                      min="0"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Salles de bain</label>
                    <input
                      type="number"
                      name="bathroom_count"
                      value={formData.bathroom_count}
                      onChange={handleChange}
                      placeholder="Ex: 2"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                      min="0"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Pièces totales</label>
                    <input
                      type="number"
                      name="room_count"
                      value={formData.room_count}
                      onChange={handleChange}
                      placeholder="Ex: 4"
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #d1d5db",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                      min="0"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Décrivez le bien (optionnel)…"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      border: "1.5px solid #d1d5db",
                      borderRadius: 10,
                      fontSize: "0.85rem",
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      color: "#111",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#fff",
                      minHeight: 100,
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              {/* COLONNE DROITE */}
              <div>
                {/* ADRESSE */}
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#70AE48", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  ADRESSE
                </p>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Adresse</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="N° et nom de la rue"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      border: "1.5px solid #d1d5db",
                      borderRadius: 10,
                      fontSize: "0.85rem",
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      color: "#111",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#fff",
                    }}
                  />
                  {formErrors.address && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.address}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Ville</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Ex: Cotonou"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      border: "1.5px solid #d1d5db",
                      borderRadius: 10,
                      fontSize: "0.85rem",
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      color: "#111",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#fff",
                    }}
                  />
                  {formErrors.city && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.city}</span>}
                </div>

                <div style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Quartier / Arrondissement</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="Ex: Fidjrossè"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem",
                      border: "1.5px solid #d1d5db",
                      borderRadius: 10,
                      fontSize: "0.85rem",
                      fontFamily: "'Manrope', sans-serif",
                      fontWeight: 500,
                      color: "#111",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#fff",
                    }}
                  />
                </div>

                {/* FINANCES */}
                <div style={{
                  marginTop: 20,
                  background: "linear-gradient(135deg, #fff8ef 0%, #fff3e0 100%)",
                  border: "1.5px solid #ffe0b2",
                  borderRadius: 16,
                  padding: "1.25rem",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: "1.1rem" }}>💰</span>
                    <h3 style={{ fontFamily: "'Merriweather', serif", fontSize: "0.95rem", fontWeight: 800, color: "#1a1a1a", margin: 0 }}>
                      Finances
                    </h3>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Loyer hors charges (FCFA)</label>
                    <input
                      type="number"
                      name="rent_amount"
                      value={formData.rent_amount}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #ffcc80",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                      min="0"
                      step="0.01"
                    />
                    {formErrors.rent_amount && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.rent_amount}</span>}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Loyer charges locatives (FCFA)</label>
                    <input
                      type="number"
                      name="charges_amount"
                      value={formData.charges_amount}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #ffcc80",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                      min="0"
                      step="0.01"
                    />
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 500, fontStyle: "italic", marginTop: 2, display: "block" }}>
                      Charges mensuelles (eau, électricité, entretien...)
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Caution / Dépôt de garantie (FCFA)</label>
                    <input
                      type="number"
                      name="caution"
                      value={formData.caution}
                      onChange={handleChange}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem",
                        border: "1.5px solid #ffcc80",
                        borderRadius: 10,
                        fontSize: "0.85rem",
                        fontFamily: "'Manrope', sans-serif",
                        fontWeight: 500,
                        color: "#111",
                        outline: "none",
                        boxSizing: "border-box",
                        background: "#fff",
                      }}
                      min="0"
                      step="0.01"
                    />
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 500, fontStyle: "italic", marginTop: 2, display: "block" }}>
                      Montant du dépôt de garantie demandé au locataire
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos supplémentaires */}
            {(photos.length > 1 || photoPreviews.length > 0) && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#70AE48", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  AUTRES PHOTOS
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {/* Photos existantes (sauf la première) */}
                  {photos.slice(1).map((src, index) => (
                    <div key={`existing-${index}`} style={{ position: "relative", width: 100, height: 80, borderRadius: 8, overflow: "hidden" }}>
                      <img src={src} alt={`Photo ${index + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index + 1, false)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(239,68,68,0.9)",
                          border: "none",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "white",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {/* Nouvelles photos */}
                  {photoPreviews.map((src, index) => (
                    <div key={`new-${index}`} style={{ position: "relative", width: 100, height: 80, borderRadius: 8, overflow: "hidden" }}>
                      <img src={src} alt={`Nouvelle ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index, true)}
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "rgba(239,68,68,0.9)",
                          border: "none",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "white",
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{
              marginTop: 24,
              paddingTop: 16,
              borderTop: "1.5px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "1.5px solid #d1d5db",
                  background: "#fff",
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#374151",
                  cursor: "pointer",
                }}
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                type="submit"
                style={{
                  padding: "10px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #70AE48 0%, #8BC34A 100%)",
                  fontFamily: "'Manrope', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(112,174,72,0.25)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function BienCard({ bien, onClick }: { bien: any; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col group"
    >
      {/* Image Container */}
      <div className="relative h-56 sm:h-64 md:h-[280px] w-full overflow-hidden bg-gray-100">
        <img
          src={bien.image}
          alt={bien.titre}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center -z-10">
          <Building2 size={48} className="text-green-300/50" />
        </div>

        {/* Status badge */}
        <span
          className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm text-white shadow-sm font-medium ${
            bien.statut === 'Disponible' ? 'bg-[#4ade80]' :
            bien.statut === 'Loué' ? 'bg-[#3b82f6]' :
            bien.statut === 'En maintenance' ? 'bg-[#f59e0b]' :
            'bg-gray-500'
          }`}
        >
          {bien.statut}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        {/* Header Section */}
        <div className="p-5 flex flex-col gap-1.5">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
            {bien.type}
          </p>
          <h2 className="text-lg font-bold text-gray-900 leading-tight tracking-wide">
            {bien.titre}
          </h2>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
            <span className="text-red-500 text-base leading-none">📍</span>
            <span className="line-clamp-1">{bien.adresse}</span>
          </p>
        </div>

        {/* Pricing & Surface Section */}
        <div className="px-5 py-4 border-t border-b border-gray-100 flex justify-between items-center bg-white/50">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#4db038] tracking-tight">
              {bien.loyer}
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              FCFA / mois
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
            <span>{bien.surface}</span>
            <span>m²</span>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-5 py-4 flex justify-between items-center bg-white mt-auto">
          <span className="text-sm text-gray-500 flex items-center gap-2 font-medium">
            <div className="w-7 h-7 bg-[#f0f4ff] rounded-full flex items-center justify-center">
              <ImageIcon size={14} className="text-[#a5b4fc]" />
            </div>
            {bien.photos} Photo{bien.photos > 1 ? "s" : ""}
          </span>
          <span className="text-xs text-gray-500 tracking-wide font-medium">
            {bien.ref}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MesBiens({ notify, currentUser }: MesBiensProps) {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedBien, setSelectedBien] = useState<any | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const res = await propertyService.listProperties();
      const mappedResults = (res.data || []).map((p: any) => ({
        id: p.id,
        statut: STATUS_MAP[p.status] || p.status,
        type: (TYPE_MAP[p.type] || p.type).toUpperCase(),
        titre: p.name || p.title || "Sans titre",
        adresse: p.address,
        loyer: p.rent_amount ? parseInt(p.rent_amount).toLocaleString("fr-FR") : "0",
        surface: p.surface || "0",
        photos: p.photos ? p.photos.length : 0,
        ref: p.reference_code || `REF-${p.id}`,
        image: p.photos && p.photos.length > 0 ? resolvePhotoUrl(p.photos[0]) : "",
        raw: p // Garder l'objet original pour l'édition
      }));
      setProperties(mappedResults);
    } catch (error) {
      console.error("Erreur lors du chargement des biens:", error);
      notify?.("Impossible de charger vos biens", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const filtered = properties.filter((b) => {
    const matchFilter = activeFilter === "Tous" || b.statut === activeFilter;
    const matchSearch =
      b.titre.toLowerCase().includes(search.toLowerCase()) ||
      b.adresse.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />
      <style>{styles}</style>

      {/* Top bar - Mobile First */}
      <div className="animate-slideInLeft flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {/* Back button - Mobile First */}
        <div className="inline-flex items-center justify-center w-full sm:w-auto">
          <button
            onClick={() => navigate("/proprietaire/dashboard")}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} className="flex-shrink-0" />
            <span className="font-medium text-sm">Retour</span>
          </button>
        </div>

        {/* Search and Add button - Mobile First */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {/* Search - Full width on mobile */}
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 opacity-60" />
            <input
              type="text"
              placeholder="Rechercher par nom, adresse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-transparent bg-transparent text-sm font-sans outline-none text-gray-700 placeholder-gray-500 focus:border-green-400 focus:bg-white focus:ring-2 focus:ring-green-400/20 transition-all"
            />
          </div>

          {/* Add button - Full width on mobile */}
          <button
            className="animate-scaleIn animate-delay-200 bg-[#58a531] text-white rounded-lg px-6 py-2 font-semibold hover:bg-[#498828] transition-all transform active:scale-95 shadow-md w-full sm:w-auto flex items-center justify-center gap-2"
            onClick={() => navigate("/proprietaire/ajouter-bien")}
          >
            <Plus size={18} className="flex-shrink-0" />
            <span className="text-sm">Ajouter un bien</span>
          </button>
        </div>
      </div>

      {/* Page title - Mobile First */}
      <div className="animate-fadeInUp animate-delay-100 mb-6 font-serif">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <img src="/Ressource_gestiloc/Home.png" alt="Mes biens" className="w-8 h-8" />
          <span className="break-words font-serif tracking-tight">Mes biens</span>
        </h1>
        <p className="text-sm sm:text-sm text-gray-500 leading-relaxed max-w-3xl font-sans mt-2">
          Gérez l'ensemble de vos biens : appartements, maisons, locaux professionnels...
        </p>
      </div>

      {/* Filters - Mobile First */}
      <div className="animate-fadeInUp animate-delay-200 flex flex-wrap gap-2 sm:gap-3 mb-8">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium font-sans cursor-pointer transition-all ${
              activeFilter === f
                ? "bg-[#80ca57] text-white shadow-md shadow-green-500/20 border border-[#80ca57]"
                : "bg-white border border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid - Mobile First */}
      <div className="animate-fadeInUp animate-delay-300 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 xl:gap-12 max-w-[1400px]">
        {isLoading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Chargement de vos biens...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((bien) => (
            <BienCard key={bien.id} bien={bien} onClick={() => setSelectedBien(bien)} />
          ))
        ) : (
          <div className="col-span-full bg-white border-2 border-dashed border-gray-200 rounded-3xl py-20 flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <Home className="w-10 h-10 text-green-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Aucun bien trouvé</h3>
            <p className="text-gray-500 mb-8 max-w-sm text-center">
              {search || activeFilter !== "Tous"
                ? "Aucun bien ne correspond à vos critères de recherche."
                : "Vous n'avez pas encore ajouté de bien immobilier. Commencez par en ajouter un pour le gérer."}
            </p>
            {!search && activeFilter === "Tous" && (
              <button
                onClick={() => navigate("/proprietaire/ajouter-bien")}
                className="bg-[#58a531] text-white rounded-xl px-8 py-3 font-bold hover:bg-[#498828] transition-all transform active:scale-95 shadow-lg flex items-center gap-2"
              >
                <Plus size={20} />
                Ajouter maintenant
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      {selectedBien && (
        <EditPropertyModal
          property={selectedBien.raw}
          onClose={() => setSelectedBien(null)}
          onSuccess={() => {
            setSelectedBien(null);
            fetchProperties();
          }}
          notify={notify}
        />
      )}
    </div>
  );
}