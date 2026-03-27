import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  MapPin,
  Save,
  Loader2,
  Image as ImageIcon,
  Euro,
  Ruler,
  DollarSign,
  AlertTriangle,
  ArrowLeft,
  Home
} from 'lucide-react';
import { coOwnerApi } from '../../../services/coOwnerApi';

interface PropertyEditModalProps {
  property: any | null;
  isOpen: boolean;
  onClose: () => void;
  notify: (msg: string, type: "success" | "info" | "error") => void;
  onUpdate: () => void;
}

const getBackendOrigin = () => {
  const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  if (!baseURL) return 'http://127.0.0.1:8000';
  try {
    const url = new URL(baseURL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return 'http://127.0.0.1:8000';
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  border: "1.5px solid #d1d5db",
  borderRadius: 10,
  fontSize: "0.85rem",
  fontFamily: "'Manrope', sans-serif",
  fontWeight: 500,
  color: "#111",
  outline: "none",
  boxSizing: "border-box" as const,
  background: "#fff",
};

export const PropertyEditModal: React.FC<PropertyEditModalProps> = ({
  property,
  isOpen,
  onClose,
  notify,
  onUpdate,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    type: "apartment",
    name: "",
    description: "",
    address: "",
    city: "",
    district: "",
    zip_code: "",
    surface: "",
    room_count: "",
    bedroom_count: "",
    bathroom_count: "",
    rent_amount: "",
    charges_amount: "",
    caution: "",
    status: "available",
    reference_code: "",
    floor: "",
  });

  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (property) {
      console.log('=== PROPERTY REÇUE DANS MODAL ===');
      console.log('Property:', property);
      console.log('Property.photos:', property.photos);
      console.log('Property.photo_urls:', property.photo_urls);
      
      setFormData({
        type: property.property_type || property.type || "apartment",
        name: property.name || property.title || "",
        description: property.description || "",
        address: property.address || "",
        city: property.city || "",
        district: property.district || "",
        zip_code: property.zip_code || "",
        surface: property.surface || "",
        room_count: property.room_count || "",
        bedroom_count: property.bedroom_count || "",
        bathroom_count: property.bathroom_count || "",
        rent_amount: property.rent_amount || "",
        charges_amount: property.charges_amount || "",
        caution: property.caution || "",
        status: property.status || "available",
        reference_code: property.reference_code || "",
        floor: property.floor || "",
      });

      // Photos - Utiliser photo_urls d'abord, sinon photos
      if (property.photo_urls && property.photo_urls.length > 0) {
        console.log('Utilisation de photo_urls:', property.photo_urls);
        setPhotos(property.photo_urls);
      } else if (property.photos && property.photos.length > 0) {
        console.log('Utilisation de photos (relatives):', property.photos);
        const photoUrls = property.photos.map((photo: string) => resolvePhotoUrl(photo) || photo);
        console.log('URLs résolues:', photoUrls);
        setPhotos(photoUrls);
      } else {
        console.log('Aucune photo trouvée');
        setPhotos([]);
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
    console.log('Nouvelles photos ajoutées:', newFiles.map(f => f.name));
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

    console.log('=== DÉBUT DE LA MODIFICATION ===');
    console.log('Property ID:', property.id);
    console.log('Photos actuelles (state):', photos);
    console.log('Nouvelles photos (files):', newPhotos.map(f => f.name));
    console.log('FormData actuel:', formData);

    const errors = validate();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
        const msg = Object.values(errors)[0] || "Veuillez vérifier le formulaire.";
        notify(msg, "error");
        return;
    }

    setIsLoading(true);

    try {
        // Préparer les données pour l'envoi
        const formDataToSend = new FormData();
        
        // Ajouter les champs texte
        formDataToSend.append('type', formData.type || 'apartment');
        formDataToSend.append('title', (formData.name || '').trim());
        formDataToSend.append('name', (formData.name || '').trim());
        if (formData.description) formDataToSend.append('description', formData.description);
        formDataToSend.append('address', formData.address || '');
        if (formData.district) formDataToSend.append('district', formData.district);
        formDataToSend.append('city', formData.city || '');
        if (formData.zip_code) formDataToSend.append('zip_code', formData.zip_code);
        if (formData.surface) formDataToSend.append('surface', formData.surface);
        if (formData.floor) formDataToSend.append('floor', formData.floor);
        if (formData.total_floors) formDataToSend.append('total_floors', formData.total_floors);
        if (formData.room_count) formDataToSend.append('room_count', formData.room_count);
        if (formData.bedroom_count) formDataToSend.append('bedroom_count', formData.bedroom_count);
        if (formData.bathroom_count) formDataToSend.append('bathroom_count', formData.bathroom_count);
        if (formData.wc_count) formDataToSend.append('wc_count', formData.wc_count);
        if (formData.construction_year) formDataToSend.append('construction_year', formData.construction_year);
        if (formData.rent_amount) formDataToSend.append('rent_amount', formData.rent_amount);
        if (formData.charges_amount) formDataToSend.append('charges_amount', formData.charges_amount);
        if (formData.caution) formDataToSend.append('caution', formData.caution);
        formDataToSend.append('status', formData.status || 'available');
        if (formData.reference_code) formDataToSend.append('reference_code', formData.reference_code);
        
        // Ajouter les photos existantes à conserver
        const existingPhotoPaths = (property.photos || []);
        const photosToKeep: string[] = [];
        
        console.log('Photos existantes dans property:', existingPhotoPaths);
        console.log('Photos dans le state (URLs):', photos);
        
        existingPhotoPaths.forEach((photoPath: string) => {
            const resolvedUrl = resolvePhotoUrl(photoPath);
            console.log(`Comparaison: ${resolvedUrl} === ${photos.includes(resolvedUrl)}`);
            if (resolvedUrl && photos.includes(resolvedUrl)) {
                photosToKeep.push(photoPath);
            }
        });
        
        console.log('Photos à conserver:', photosToKeep);
        formDataToSend.append('photos_to_keep', JSON.stringify(photosToKeep));
        
        // Ajouter les nouvelles photos
        console.log('Nouvelles photos à uploader:', newPhotos.length);
        newPhotos.forEach((photo, index) => {
            console.log(`Ajout photo ${index}:`, photo.name);
            formDataToSend.append('new_photos[]', photo);
        });

        // Debug: Afficher le contenu du FormData
        console.log('=== CONTENU DU FORMDATA À ENVOYER ===');
        for (let pair of formDataToSend.entries()) {
            if (pair[0] === 'new_photos[]') {
                console.log(pair[0], 'FILE:', (pair[1] as File).name);
            } else {
                console.log(pair[0], pair[1]);
            }
        }

        // Appeler l'API pour mettre à jour avec FormData
        const token = localStorage.getItem('token');
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        
        console.log('Envoi de la requête à:', `${API_BASE_URL}/co-owners/me/properties/${property.id}`);
        
        const response = await fetch(`${API_BASE_URL}/co-owners/me/properties/${property.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
            body: formDataToSend
        });

        console.log('Statut de la réponse:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Erreur réponse:', errorData);
            throw new Error(errorData.message || 'Erreur lors de la mise à jour');
        }

        const result = await response.json();
        console.log('=== RÉPONSE DU SERVEUR ===');
        console.log('Réponse complète:', result);
        console.log('Photo URLs dans la réponse:', result.data?.photo_urls);
        
        notify("✅ Bien modifié avec succès !", "success");
        onUpdate();
        onClose();
    } catch (error: any) {
        console.error("Erreur lors de la modification:", error);
        notify(error.message || "Une erreur est survenue", "error");
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen || !property) return null;

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
                  onError={(e) => {
                    console.error('Erreur chargement image:', photos[0]);
                    const img = e.currentTarget;
                    img.style.display = "none";
                    const parent = img.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.photo-fallback');
                      if (fallback) fallback.setAttribute('style', 'display: flex');
                    }
                  }}
                />
              ) : photoPreviews.length > 0 ? (
                <img
                  src={photoPreviews[0]}
                  alt="Nouvelle photo"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="photo-fallback flex flex-col items-center justify-center">
                  <ImageIcon size={48} color="#b0b5c0" />
                  <p className="text-xs text-gray-400 mt-2">Aucune photo</p>
                </div>
              )}
              
              {/* Fallback when no photo */}
              <div className="photo-fallback absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center" style={{ display: photos.length === 0 && photoPreviews.length === 0 ? 'flex' : 'none' }}>
                <ImageIcon size={48} color="#9ca3af" />
                <p className="text-xs text-gray-400 mt-2">Aucune photo</p>
              </div>

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

            {/* Le reste du formulaire reste identique */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {/* COLONNE GAUCHE */}
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#70AE48", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  INFORMATIONS GÉNÉRALES
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Type</label>
                    <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
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
                    <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                      <option value="available">Disponible</option>
                      <option value="rented">Loué</option>
                      <option value="maintenance">En maintenance</option>
                      <option value="off_market">Retiré du marché</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Nom du bien</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Appartement T3 centre-ville" style={inputStyle} />
                  {formErrors.name && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.name}</span>}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Surface (m²)</label>
                    <input type="text" inputMode="numeric" name="surface" value={formData.surface} onChange={handleChange} placeholder="Ex: 65" style={inputStyle} min="0" step="0.01" />
                    {formErrors.surface && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.surface}</span>}
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Référence</label>
                    <input type="text" name="reference_code" value={formData.reference_code} onChange={(e) => { const v = e.target.value.toUpperCase(); setFormData((p: any) => ({ ...p, reference_code: v })); }} placeholder="Ex: APP-123" style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Étage</label>
                    <input type="text" inputMode="numeric" name="floor" value={formData.floor} onChange={handleChange} placeholder="Ex: 3" style={inputStyle} min="0" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Chambres</label>
                    <input type="text" inputMode="numeric" name="bedroom_count" value={formData.bedroom_count} onChange={handleChange} placeholder="Ex: 3" style={inputStyle} min="0" />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Salles de bain</label>
                    <input type="text" inputMode="numeric" name="bathroom_count" value={formData.bathroom_count} onChange={handleChange} placeholder="Ex: 2" style={inputStyle} min="0" />
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Pièces totales</label>
                    <input type="text" inputMode="numeric" name="room_count" value={formData.room_count} onChange={handleChange} placeholder="Ex: 4" style={inputStyle} min="0" />
                  </div>
                </div>

                <div style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Décrivez le bien (optionnel)…" style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} />
                </div>
              </div>

              {/* COLONNE DROITE */}
              <div>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#70AE48", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
                  ADRESSE
                </p>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Adresse</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="N° et nom de la rue" style={inputStyle} />
                  {formErrors.address && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.address}</span>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Ville</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ex: Cotonou" style={inputStyle} />
                  {formErrors.city && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.city}</span>}
                </div>

                <div style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Quartier / Arrondissement</label>
                  <input type="text" name="district" value={formData.district} onChange={handleChange} placeholder="Ex: Fidjrossè" style={inputStyle} />
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
                    <input type="text" inputMode="numeric" name="rent_amount" value={formData.rent_amount} onChange={handleChange} style={{ ...inputStyle, border: "1.5px solid #ffcc80" }} min="0" step="0.01" />
                    {formErrors.rent_amount && <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#dc2626", marginTop: 2, display: "block" }}>{formErrors.rent_amount}</span>}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Charges locatives (FCFA)</label>
                    <input type="text" inputMode="numeric" name="charges_amount" value={formData.charges_amount} onChange={handleChange} style={{ ...inputStyle, border: "1.5px solid #ffcc80" }} min="0" step="0.01" />
                    <span style={{ fontSize: "0.7rem", color: "#9ca3af", fontWeight: 500, fontStyle: "italic", marginTop: 2, display: "block" }}>
                      Charges mensuelles (eau, électricité, entretien...)
                    </span>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: 4 }}>Caution / Dépôt de garantie (FCFA)</label>
                    <input type="text" inputMode="numeric" name="caution" value={formData.caution} onChange={handleChange} style={{ ...inputStyle, border: "1.5px solid #ffcc80" }} min="0" step="0.01" />
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
                  {photos.slice(1).map((src, index) => (
                    <div key={`existing-${index}`} style={{ position: "relative", width: 100, height: 80, borderRadius: 8, overflow: "hidden" }}>
                      <img src={src} alt={`Photo ${index + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => handleRemovePhoto(index + 1, false)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {photoPreviews.map((src, index) => (
                    <div key={`new-${index}`} style={{ position: "relative", width: 100, height: 80, borderRadius: 8, overflow: "hidden" }}>
                      <img src={src} alt={`Nouvelle ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => handleRemovePhoto(index, true)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(239,68,68,0.9)", border: "none", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}>
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
              <button type="button" onClick={onClose} style={{ padding: "10px 22px", borderRadius: 10, border: "1.5px solid #d1d5db", background: "#fff", fontFamily: "'Manrope', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "#374151", cursor: "pointer" }} disabled={isLoading}>
                Annuler
              </button>
              <button type="submit" style={{ padding: "10px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #70AE48 0%, #8BC34A 100%)", fontFamily: "'Manrope', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(112,174,72,0.25)", display: "flex", alignItems: "center", gap: 6 }} disabled={isLoading}>
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