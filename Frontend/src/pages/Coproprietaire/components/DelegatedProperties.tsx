import React, { useEffect, useState } from 'react';
import {
  Building,
  MapPin,
  Search,
  Plus,
  Home,
  ArrowLeft,
  Image as ImageIcon,
  X,
  Save,
  Loader2,
  Edit
} from 'lucide-react';
import { coOwnerApi, CoOwnerProperty } from '../../../services/coOwnerApi';
import { PropertyEditModal } from './PropertyEditModal';

interface DelegatedPropertiesProps {
  onNavigate: (tab: string) => void;
  notify: (msg: string, type: "success" | "info" | "error") => void;
}

const STATUS_MAP: Record<string, string> = {
  available: "Disponible",
  rented: "Loué",
  maintenance: "En travaux",
  off_market: "Préavis",
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
  const baseURL = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL || 'https://gestiloc-back.onrender.com').toString();
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

const filters = ["Tous", "Disponible", "Loué", "En travaux", "Préavis"];

export const DelegatedProperties: React.FC<DelegatedPropertiesProps> = ({ onNavigate, notify }) => {
  const [properties, setProperties] = useState<CoOwnerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [selectedEditProperty, setSelectedEditProperty] = useState<CoOwnerProperty | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await coOwnerApi.getDelegatedProperties();
      console.log('Propriétés récupérées:', data);
      setProperties(data);
    } catch (error: any) {
      console.warn('Error fetching delegated properties (silenced):', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les propriétés
  const filteredProperties = properties.filter(property => {
    const matchFilter = activeFilter === "Tous" || STATUS_MAP[property.status] === activeFilter;
    const matchSearch =
      property.name.toLowerCase().includes(search.toLowerCase()) ||
      property.address.toLowerCase().includes(search.toLowerCase()) ||
      property.city.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-[#4ade80]';
      case 'rented':
        return 'bg-[#3b82f6]';
      case 'maintenance':
        return 'bg-[#f59e0b]';
      case 'off_market':
        return 'bg-[#ef4444]';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    return STATUS_MAP[status] || status;
  };

  const getPropertyTypeLabel = (type: string) => {
    return TYPE_MAP[type] || type.toUpperCase();
  };

  const formatCurrency = (amount?: string | number | null) => {
    if (!amount) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString("fr-FR");
  };

  const getPropertyImage = (property: CoOwnerProperty) => {
    if (property.photos && property.photos.length > 0) {
      const firstPhoto = property.photos[0];
      const url = resolvePhotoUrl(firstPhoto);
      if (url) return url;
    }
    return "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=600";
  };

  const handleEditProperty = (property: CoOwnerProperty) => {
    setSelectedEditProperty(property);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedEditProperty(null);
  };

  const handlePropertyUpdated = () => {
    fetchProperties();
    notify('Modification envoyée au propriétaire pour approbation', 'info');
  };

  const BienCard = ({ property }: { property: CoOwnerProperty }) => (
    <div
      onClick={() => handleEditProperty(property)}
      className="bg-white border border-green-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col group"
    >
      {/* Image Container */}
      <div className="relative h-56 sm:h-64 md:h-[280px] w-full overflow-hidden bg-gray-100">
        <img
          src={getPropertyImage(property)}
          alt={property.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const img = e.currentTarget;
            img.style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 flex flex-col items-center justify-center -z-10">
          <Building size={48} className="text-green-300/50" />
        </div>

        {/* Status badge */}
        <span className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg text-sm text-white shadow-sm font-medium ${getStatusColor(property.status)}`}>
          {getStatusLabel(property.status)}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        {/* Header Section */}
        <div className="p-5 flex flex-col gap-1.5">
          <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">
            {getPropertyTypeLabel(property.property_type || '')}
          </p>
          <h2 className="text-lg font-bold text-gray-900 leading-tight tracking-wide">
            {property.name}
          </h2>
          <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
            <span className="text-red-500 text-base leading-none">📍</span>
            <span className="line-clamp-1">{property.address}, {property.city}</span>
          </p>
        </div>

        {/* Pricing & Surface Section */}
        <div className="px-5 py-4 border-t border-b border-gray-100 flex justify-between items-center bg-white/50">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[#4db038] tracking-tight">
              {formatCurrency(property.rent_amount)}
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              FCFA / mois
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
            <span>{property.surface}</span>
            <span>m²</span>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-5 py-4 flex justify-between items-center bg-white mt-auto">
          <span className="text-sm text-gray-500 flex items-center gap-2 font-medium">
            <div className="w-7 h-7 bg-[#f0f4ff] rounded-full flex items-center justify-center">
              <ImageIcon size={14} className="text-[#a5b4fc]" />
            </div>
            {property.photos?.length || 0} Photo{property.photos?.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-gray-500 tracking-wide font-medium">
            {property.reference_code || `REF-${property.id}`}
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Chargement des biens délégués...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-4 sm:p-6 lg:p-8 font-sans">
      <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&family=Manrope:wght@400;600;700&display=swap" rel="stylesheet" />

      {/* Top bar - Mobile First */}
      <div className="animate-slideInLeft flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        {/* Back button - Mobile First */}
        <div className="inline-flex items-center justify-center w-full sm:w-auto">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} className="flex-shrink-0" />
            <span className="font-medium text-sm">Retour</span>
          </button>
        </div>

        {/* Search - Mobile First */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
        </div>
      </div>

      {/* Page title - Mobile First */}
      <div className="animate-fadeInUp animate-delay-100 mb-6 font-serif">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <img src="/Ressource_gestiloc/Home.png" alt="Biens délégués" className="w-8 h-8" />
          <span className="break-words font-serif tracking-tight">Mes biens</span>
        </h1>
        <p className="text-sm sm:text-sm text-gray-500 leading-relaxed max-w-3xl font-sans mt-2">
          Gérez les biens qui vous ont été délégués par d'autres propriétaires
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
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property) => (
            <BienCard key={property.id} property={property} />
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
                : "Aucun bien ne vous a encore été délégué."}
            </p>
          </div>
        )}
      </div>

      {/* Modal d'édition */}
      <PropertyEditModal
        property={selectedEditProperty}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        notify={notify}
        onUpdate={handlePropertyUpdated}
      />
    </div>
  );
};