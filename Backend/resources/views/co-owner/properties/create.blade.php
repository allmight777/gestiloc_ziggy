@extends('layouts.co-owner')

@section('title', 'Ajouter un bien')

@section('content')
<style>
    .ab-page {
        padding: 2rem 1.5rem 3rem;
        max-width: 1300px;
        margin: 0 auto;
        font-family: 'Manrope', sans-serif;
        color: #1a1a1a;
    }

    /* ── Top bar ── */
    .ab-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 15px;
        margin-bottom: 2rem;
    }
    .ab-btn-back {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 12px 22px;
        border-radius: 14px;
        border: 2px solid #d1d5db;
        background: #fff;
        font-family: 'Manrope', sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        color: #374151;
        cursor: pointer;
        transition: all 0.18s ease;
        text-decoration: none;
    }
    .ab-btn-back:hover {
        background: #f9fafb;
        border-color: #9ca3af;
    }
    .ab-actions-top {
        display: flex;
        gap: 12px;
    }
    .ab-btn-cancel {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 24px;
        border-radius: 14px;
        border: 2px solid #fca5a5;
        background: #fff;
        font-family: 'Manrope', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: #dc2626;
        cursor: pointer;
        transition: all 0.18s ease;
        text-decoration: none;
    }
    .ab-btn-cancel:hover { background: #fef2f2; }
    .ab-btn-cancel:disabled { opacity: 0.5; cursor: not-allowed; }

    .ab-btn-save {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 12px 26px;
        border-radius: 14px;
        border: none;
        background: #4CAF50;
        font-family: 'Manrope', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: #fff;
        cursor: pointer;
        transition: all 0.18s ease;
        box-shadow: 0 4px 14px rgba(76,175,80,0.25);
    }
    .ab-btn-save:hover { background: #43A047; box-shadow: 0 6px 18px rgba(76,175,80,0.3); }
    .ab-btn-save:disabled { opacity: 0.55; cursor: not-allowed; }

    /* ── Title ── */
    .ab-title {
        font-family: 'Merriweather', serif;
        font-size: 2.2rem;
        font-weight: 900;
        color: #1a1a1a;
        margin: 0 0 8px 0;
    }
    .ab-subtitle {
        font-family: 'Manrope', sans-serif;
        font-size: 1.1rem;
        font-weight: 500;
        color: #6b7280;
        margin: 0 0 2rem 0;
    }

    /* ── Grid ── */
    .ab-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
    }

    /* ── Section card ── */
    .ab-section {
        background: #fff;
        border: 2px solid #d6e4d6;
        border-radius: 22px;
        padding: 2rem;
    }
    .ab-section-head {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e8f0e8;
    }
    .ab-section-icon {
        font-size: 1.5rem;
    }
    .ab-section-title {
        font-family: 'Merriweather', serif;
        font-size: 1.25rem;
        font-weight: 800;
        color: #1a1a1a;
        margin: 0;
    }

    /* ── Fields ── */
    .ab-fields {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 18px;
    }
    .ab-fields.one { grid-template-columns: 1fr; }

    .ab-field {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .ab-label {
        font-size: 0.9rem;
        font-weight: 700;
        color: #374151;
        font-family: 'Manrope', sans-serif;
    }
    .ab-label .req { color: #dc2626; }

    .ab-input {
        width: 100%;
        padding: 0.85rem 1rem;
        border: 2px solid #d1d5db;
        border-radius: 12px;
        font-size: 0.95rem;
        font-family: 'Manrope', sans-serif;
        font-weight: 500;
        color: #1a1a1a;
        background: #fff;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }
    .ab-input:hover { border-color: #9ca3af; }
    .ab-input:focus { border-color: #4CAF50; box-shadow: 0 0 0 4px rgba(76,175,80,0.15); }
    .ab-input::placeholder { color: #9ca3af; font-weight: 400; }

    textarea.ab-input {
        min-height: 120px;
        resize: vertical;
        font-family: 'Manrope', sans-serif;
    }

    select.ab-input {
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg width='14' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 14px center;
        padding-right: 2.5rem;
    }

    .ab-help {
        font-size: 0.8rem;
        color: #9ca3af;
        font-weight: 500;
        font-style: italic;
    }
    .ab-error-msg {
        font-size: 0.85rem;
        font-weight: 600;
        color: #dc2626;
    }

    /* ── Finances sub-section (warm orange) ── */
    .ab-finances {
        margin-top: 1.5rem;
        background: linear-gradient(135deg, #fff8ef 0%, #fff3e0 100%);
        border: 2px solid #ffe0b2;
        border-radius: 18px;
        padding: 1.5rem;
    }
    .ab-finances-head {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 1.25rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #ffe0b2;
    }
    .ab-finances-title {
        font-family: 'Merriweather', serif;
        font-size: 1.1rem;
        font-weight: 800;
        color: #1a1a1a;
        margin: 0;
    }
    .ab-input-warm {
        width: 100%;
        padding: 0.85rem 1rem;
        border: 2px solid #ffcc80;
        border-radius: 12px;
        font-size: 0.95rem;
        font-family: 'Manrope', sans-serif;
        font-weight: 500;
        color: #1a1a1a;
        background: #fff;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }
    .ab-input-warm:hover { border-color: #ffa726; }
    .ab-input-warm:focus { border-color: #fb8c00; box-shadow: 0 0 0 4px rgba(255,152,0,0.15); }
    .ab-input-warm::placeholder { color: #bfaE90; font-weight: 400; }

    /* ── Photos section ── */
    .ab-photos {
        background: #fff;
        border: 2px solid #d6e4d6;
        border-radius: 22px;
        padding: 2rem;
        margin-bottom: 1.5rem;
    }
    .ab-photos-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 15px;
        margin-bottom: 15px;
    }
    .ab-photos-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: 'Merriweather', serif;
        font-size: 1.25rem;
        font-weight: 800;
        color: #1a1a1a;
    }
    .ab-btn-add-photos {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 11px 22px;
        border-radius: 999px;
        border: 2px dashed #4CAF50;
        background: #fff;
        font-family: 'Manrope', sans-serif;
        font-size: 0.95rem;
        font-weight: 700;
        color: #4CAF50;
        cursor: pointer;
        transition: all 0.18s ease;
    }
    .ab-btn-add-photos:hover {
        background: #f0fdf0;
        border-color: #2e7d32;
    }

    .ab-previews {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 15px;
    }
    .ab-thumb {
        width: 140px;
        height: 100px;
        border-radius: 16px;
        overflow: hidden;
        border: 2px solid #e5e7eb;
        background: #f9fafb;
        position: relative;
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        transition: 0.18s ease;
    }
    .ab-thumb:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,0,0,0.12); }
    .ab-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .ab-thumb-remove {
        position: absolute;
        right: 8px;
        top: 8px;
        border: 1px solid #e5e7eb;
        background: rgba(255,255,255,0.95);
        border-radius: 999px;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: 0.18s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .ab-thumb-remove:hover { transform: scale(1.1); background: #fff; }

    /* ── Footer ── */
    .ab-footer {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
    }

    /* ── Responsive ── */
    @media (max-width: 820px) {
        .ab-grid { grid-template-columns: 1fr; }
        .ab-topbar { flex-direction: column; align-items: stretch; }
        .ab-actions-top { justify-content: flex-end; }
        .ab-fields { grid-template-columns: 1fr; }
        .ab-page {
            padding: 1.5rem 1rem;
        }
    }
</style>

<div class="ab-page">
    <!-- ── Top bar ── -->
    <div class="ab-topbar">
        <button onclick="goToReact('/coproprietaire/dashboard')" class="ab-btn-back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
             Retour au tableau de bord
        </button>
        <div class="ab-actions-top">
            <button onclick="goToReact('/coproprietaire/biens')" class="ab-btn-cancel">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
                Annuler
            </button>
            <button type="submit" form="property-form" class="ab-btn-save">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                    <path d="M17 21v-4H7v4"/>
                    <path d="M12 7v6"/>
                    <path d="M9 10h6"/>
                </svg>
                Enregistrer
            </button>
        </div>
    </div>

    <!-- ── Title ── -->
    <h1 class="ab-title">Créer un bien</h1>
    <p class="ab-subtitle">Ajoutez un nouveau bien immobilier à votre portefeuille</p>

    <!-- Messages d'alerte -->
    @if(session('success'))
        <div style="background: rgba(240, 253, 244, 0.95); border: 1px solid rgba(34,197,94,0.3); color: #166534; padding: 1.2rem; border-radius: 14px; margin-bottom: 2rem; display: flex; gap: 12px; align-items: center; font-size: 1rem;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <path d="M22 4L12 14.01l-3-3"/>
            </svg>
            <span>{{ session('success') }}</span>
        </div>
    @endif

    @if(session('error') || $errors->any())
        <div style="background: rgba(255, 241, 242, 0.95); border: 1px solid rgba(244,63,94,0.3); color: #be123c; padding: 1.2rem; border-radius: 14px; margin-bottom: 2rem; display: flex; gap: 12px; align-items: center; font-size: 1rem;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4M12 16h.01"/>
            </svg>
            <span>{{ session('error') ?: $errors->first() }}</span>
        </div>
    @endif

    <!-- Formulaire -->
    <form id="property-form"
          action="{{ route('co-owner.properties.store', ['api_token' => request()->get('api_token')]) }}"
          method="POST"
          enctype="multipart/form-data">
        @csrf

        <!-- ── Two-column grid ── -->
        <div class="ab-grid">
            <!-- ── LEFT: Informations générales ── -->
            <div class="ab-section">
                <div class="ab-section-head">
                    <span class="ab-section-icon">🏠</span>
                    <h2 class="ab-section-title">Informations générales</h2>
                </div>

                <!-- Type & Statut -->
                <div class="ab-fields" style="margin-bottom: 18px;">
                    <div class="ab-field">
                        <label class="ab-label">Type</label>
                        <select name="property_type" class="ab-input">
                            <option value="apartment" {{ old('property_type') == 'apartment' ? 'selected' : '' }}>Appartement</option>
                            <option value="house" {{ old('property_type') == 'house' ? 'selected' : '' }}>Maison</option>
                            <option value="office" {{ old('property_type') == 'office' ? 'selected' : '' }}>Bureau</option>
                            <option value="commercial" {{ old('property_type') == 'commercial' ? 'selected' : '' }}>Local commercial</option>
                            <option value="parking" {{ old('property_type') == 'parking' ? 'selected' : '' }}>Parking</option>
                            <option value="other" {{ old('property_type') == 'other' ? 'selected' : '' }}>Autre</option>
                        </select>
                    </div>
                    <div class="ab-field">
                        <label class="ab-label">Statut</label>
                        <select name="status" class="ab-input">
                            <option value="available" {{ old('status') == 'available' ? 'selected' : '' }}>Disponible</option>
                            <option value="rented" {{ old('status') == 'rented' ? 'selected' : '' }}>Loué</option>
                            <option value="maintenance" {{ old('status') == 'maintenance' ? 'selected' : '' }}>En rénovation</option>
                            <option value="sold" {{ old('status') == 'sold' ? 'selected' : '' }}>Vendu</option>
                        </select>
                    </div>
                </div>

                <!-- Titre du bien -->
                <div class="ab-fields one" style="margin-bottom: 18px;">
                    <div class="ab-field">
                        <label class="ab-label">Titre du bien</label>
                        <input type="text" name="name" value="{{ old('name') }}" placeholder="Ex: Appartement T3 centre-ville" class="ab-input">
                        @error('name') <span class="ab-error-msg">{{ $message }}</span> @enderror
                    </div>
                </div>

                <!-- Surface -->
                <div class="ab-fields one" style="margin-bottom: 18px;">
                    <div class="ab-field">
                        <label class="ab-label">Surface (m²)</label>
                        <input type="number" name="surface" value="{{ old('surface') }}" placeholder="Ex: 65" class="ab-input" min="0" step="0.01">
                        @error('surface') <span class="ab-error-msg">{{ $message }}</span> @enderror
                    </div>
                </div>

                <!-- Référence -->
                <div class="ab-fields one" style="margin-bottom: 18px;">
                    <div class="ab-field">
                        <label class="ab-label">Référence (Optionnel)</label>
                        <input type="text" name="reference_code" value="{{ old('reference_code') }}" placeholder="Ex: APP-123" class="ab-input">
                        @error('reference_code') <span class="ab-error-msg">{{ $message }}</span> @enderror
                    </div>
                </div>

                <!-- Étage & Chambres -->
                <div class="ab-fields" style="margin-bottom: 18px;">
                    <div class="ab-field">
                        <label class="ab-label">Étage</label>
                        <input type="number" name="floor" value="{{ old('floor') }}" placeholder="Ex: 3" class="ab-input" min="0">
                    </div>
                    <div class="ab-field">
                        <label class="ab-label">Nombre de chambre(s)</label>
                        <input type="number" name="bedroom_count" value="{{ old('bedroom_count') }}" placeholder="Ex: 3" class="ab-input" min="0">
                    </div>
                </div>

                <!-- Salle de bain & Pièces -->
                <div class="ab-fields" style="margin-bottom: 18px;">
                    <div class="ab-field">
                        <label class="ab-label">Salle de bain</label>
                        <input type="number" name="bathroom_count" value="{{ old('bathroom_count') }}" placeholder="Ex: 2" class="ab-input" min="0">
                    </div>
                    <div class="ab-field">
                        <label class="ab-label">Nombre de pièce(s)</label>
                        <input type="number" name="room_count" value="{{ old('room_count') }}" placeholder="Ex: 4" class="ab-input" min="0">
                    </div>
                </div>

                <!-- Description -->
                <div class="ab-fields one">
                    <div class="ab-field">
                        <label class="ab-label">Description</label>
                        <textarea name="description" placeholder="Décrivez le bien (optionnel)…" class="ab-input">{{ old('description') }}</textarea>
                        <span class="ab-help">Points forts, emplacement, spécificités...</span>
                    </div>
                </div>
            </div>

            <!-- ── RIGHT: Adresse + Finances ── -->
            <div class="ab-section">
                <div class="ab-section-head">
                    <span class="ab-section-icon">📍</span>
                    <h2 class="ab-section-title">Adresse</h2>
                </div>

                <!-- Adresse -->
                <div class="ab-fields one" style="margin-bottom: 18px;">
                    <div class="ab-field">
                        <label class="ab-label">Adresse</label>
                        <input type="text" name="address" value="{{ old('address') }}" placeholder="N° et nom de la rue" class="ab-input">
                        @error('address') <span class="ab-error-msg">{{ $message }}</span> @enderror
                    </div>
                </div>

                <!-- Ville -->
                <div class="ab-fields one" style="margin-bottom: 18px;">
                    <div class="ab-field">
                        <label class="ab-label">Ville</label>
                        <input type="text" name="city" value="{{ old('city') }}" placeholder="Ex: Cotonou" class="ab-input">
                        @error('city') <span class="ab-error-msg">{{ $message }}</span> @enderror
                    </div>
                </div>

                <!-- Quartier -->
                <div class="ab-fields one" style="margin-bottom: 0;">
                    <div class="ab-field">
                        <label class="ab-label">Quartier / Arrondissement</label>
                        <input type="text" name="district" value="{{ old('district') }}" placeholder="Ex: Fidjrossè" class="ab-input">
                    </div>
                </div>

                <!-- ── Finances sub-section ── -->
                <div class="ab-finances">
                    <div class="ab-finances-head">
                        <span style="font-size: 1.2rem;">💰</span>
                        <h3 class="ab-finances-title">Finances</h3>
                    </div>

                    <div class="ab-fields one" style="margin-bottom: 18px;">
                        <div class="ab-field">
                            <label class="ab-label">Loyer hors charges (FCFA)</label>
                            <input type="number" name="rent_amount" value="{{ old('rent_amount') }}" class="ab-input-warm" min="0" step="0.01">
                            @error('rent_amount') <span class="ab-error-msg">{{ $message }}</span> @enderror
                        </div>
                    </div>

                    <div class="ab-fields one" style="margin-bottom: 18px;">
                        <div class="ab-field">
                            <label class="ab-label">Loyer charges locatives (FCFA)</label>
                            <input type="number" name="charges_amount" value="{{ old('charges_amount') }}" class="ab-input-warm" min="0" step="0.01">
                            <span class="ab-help">Charges mensuelles (eau, électricité, entretien...)</span>
                        </div>
                    </div>

                    <div class="ab-fields one">
                        <div class="ab-field">
                            <label class="ab-label">Caution / Dépôt de garantie (FCFA)</label>
                            <input type="number" name="caution" value="{{ old('caution') }}" class="ab-input-warm" min="0" step="0.01">
                            <span class="ab-help">Montant du dépôt de garantie demandé au locataire</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Photos section ── -->
        <div class="ab-photos">
            <div class="ab-photos-top">
                <div>
                    <div class="ab-photos-title">
                        <span>🖼️</span> Photos du bien
                    </div>
                    <p class="ab-help" style="margin-top: 6px;">
                        Optionnel • Max 8 photos • 5MB max • Reste: <span id="photos-remaining">8</span>
                    </p>
                </div>
                <label class="ab-btn-add-photos">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="2" width="20" height="20" rx="2.18"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L7 21"/>
                    </svg>
                    Ajouter des photos
                    <input type="file" name="photos[]" id="photo-input" accept="image/*" multiple style="display: none;">
                </label>
            </div>

            @error('photos')
                <span class="ab-error-msg" style="display: block; margin-bottom: 10px;">{{ $message }}</span>
            @enderror

            <div id="photos-preview" class="ab-previews"></div>
            <div id="photos-empty" class="ab-help" style="margin-top: 6px; {{ old('photos') ? 'display: none;' : '' }}">Aucune photo ajoutée.</div>

            <!-- ── Footer inside photos card ── -->
            <div class="ab-footer" style="margin-top: 20px;">
                <button onclick="goToReact('/coproprietaire/biens')" class="ab-btn-cancel">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                    Annuler
                </button>
                <button type="submit" form="property-form" class="ab-btn-save">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                        <path d="M17 21v-4H7v4"/>
                        <path d="M12 7v6"/>
                        <path d="M9 10h6"/>
                    </svg>
                    Enregistrer
                </button>
            </div>
        </div>
    </form>
</div>

@push('scripts')
<script>
// Gestion des photos
let photoFiles = [];
let photoPreviews = [];
const MAX_PHOTOS = 8;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

document.getElementById('photo-input').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);

    if (photoFiles.length + files.length > MAX_PHOTOS) {
        alert(`Vous ne pouvez pas ajouter plus de ${MAX_PHOTOS} photos`);
        return;
    }

    files.forEach(file => {
        if (file.size > MAX_SIZE) {
            alert(`Le fichier ${file.name} dépasse 5MB`);
            return;
        }

        photoFiles.push(file);

        const reader = new FileReader();
        reader.onload = function(e) {
            photoPreviews.push(e.target.result);
            renderPhotos();
        };
        reader.readAsDataURL(file);
    });

    e.target.value = '';
    updatePhotosRemaining();
});

function removePhoto(index) {
    photoFiles.splice(index, 1);
    photoPreviews.splice(index, 1);
    renderPhotos();
    updatePhotosRemaining();
}

function updatePhotosRemaining() {
    const remaining = MAX_PHOTOS - photoFiles.length;
    const remainingElement = document.getElementById('photos-remaining');
    if (remainingElement) {
        remainingElement.textContent = remaining;
    }
}

function renderPhotos() {
    const container = document.getElementById('photos-preview');
    const emptyMsg = document.getElementById('photos-empty');
    container.innerHTML = '';

    if (photoPreviews.length === 0) {
        emptyMsg.style.display = 'block';
    } else {
        emptyMsg.style.display = 'none';
    }

    photoPreviews.forEach((src, index) => {
        const div = document.createElement('div');
        div.className = 'ab-thumb';
        div.innerHTML = `
            <img src="${src}" alt="Photo ${index + 1}">
            <button type="button" class="ab-thumb-remove" onclick="removePhoto(${index})">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>
        `;
        container.appendChild(div);
    });

    // Mettre à jour le compteur
    updatePhotosRemaining();
}

// Empêcher la soumission du formulaire avec Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    updatePhotosRemaining();
});
</script>
@endpush
@endsection
