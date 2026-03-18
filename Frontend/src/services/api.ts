import axios from 'axios';

// Configuration mode standalone/backend
const IS_STANDALONE = false; // Mettre 'false' pour utiliser le backend Laravel

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'locataire' | 'proprietaire' | 'admin';
  email_verified_at?: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  data: {
    access_token: string;
    token_type: string;
    user: {
      id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone: string;
      roles: string[];
      default_role: string | null;
    };
  };
}

export interface Landlord {
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface ApiError {
  response?: {
    status?: number;
    statusText?: string;
    data?: {
      message?: string;
      errors?: Record<string, string[]>;
    };
  };
  message?: string;
}

export interface RegisterPayload {
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  role?: string;
}

export interface RegisterResponse {
  status: string;
  message: string;
  data?: {
    token: string;
    user: User;
    landlord?: Landlord;
  };
  token?: string;
  user?: User;
}

export interface Property {
  id: number;
  uuid: string;
  landlord_id: number;
  type: string;
  name: string;
  description: string | null;
  reference_code: string | null;
  address: string;
  district: string | null;
  city: string;
  state: string | null;
  zip_code: string | null;
  latitude: string | null;
  longitude: string | null;
  surface: string | null;
  room_count: number | null;
  bedroom_count: number | null;
  bathroom_count: number | null;
  rent_amount: string | null;
  charges_amount: string | null;
  status: string;
  amenities: string[] | null;
  photos: string[] | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface CreatePropertyPayload {
  type: string;
  name?: string | null;
  title: string;
  description?: string | null;
  address: string;
  district?: string | null;
  city: string;
  state?: string | null;
  zip_code?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  surface?: number | null;
  room_count?: number | null;
  bedroom_count?: number | null;
  bathroom_count?: number | null;
  rent_amount?: number | null;
  charges_amount?: number | null;
  status: string;
  reference_code?: string | null;
  amenities?: string[] | null;
  photos?: string[] | null;
  meta?: {
    terrace?: boolean;
    balcony?: boolean;
    garden?: boolean;
    parking?: boolean;
    floor?: number;
    elevator?: boolean;
    furnished?: boolean;
    heating_type?: string;
    energy_class?: string;
  } | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

// Configuration de base d'axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

// ================= CSRF / SANCTUM =================

const getCsrfToken = async () => {
  if (IS_STANDALONE) {
    console.log('Mode standalone : CSRF token simulation (pas d\'appel backend)');
    return true;
  }

  try {
    await axios.get(`${API_URL.replace('/api', '')}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
    return true;
  } catch (error) {
    console.error('Erreur CSRF:', error);
    return false;
  }
};

let csrfTokenInitialized = false;

const initializeCsrfToken = async () => {
  if (!csrfTokenInitialized) {
    csrfTokenInitialized = true;
    return await getCsrfToken();
  }
  return true;
};

if (!IS_STANDALONE) {
  initializeCsrfToken().catch(console.error);
}

// Intercepteur pour gérer les erreurs 419 (CSRF)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const apiError = error as ApiError;
    const originalRequest = error.config;

    if (apiError.response?.status === 419 && !(originalRequest as Record<string, unknown>)._retry) {
      (originalRequest as Record<string, unknown>)._retry = true;
      await getCsrfToken();
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 (non authentifié)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou non valide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);



// ================= AUTH SERVICE =================

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      await initializeCsrfToken();

      const response = await api.post<LoginResponse>(
        '/auth/login',
        {
          email: email.toLowerCase().trim(),
          password,
          device_name: 'web-browser',
        },
        {
          withCredentials: true,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      if (response.data?.data?.access_token) {
        const token = response.data.data.access_token;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
      }

      if ('token' in response.data && response.data.token) {
        const fallbackData = response.data as LoginResponse & { token?: string; user?: typeof response.data.data.user };
        if (fallbackData.token) {
          localStorage.setItem('token', fallbackData.token);
        }
        if (fallbackData.user) {
          localStorage.setItem('user', JSON.stringify(fallbackData.user));
        }
      }

      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Login error:', error);

      if (apiError.response?.data?.message) {
        throw new Error(apiError.response.data.message);
      } else if (apiError.response?.data?.errors) {
        const validationErrors = Object.values(
          apiError.response.data.errors
        ).flat();
        throw new Error(validationErrors[0] || 'Erreur de validation');
      } else {
        throw new Error(
          apiError.message || 'Une erreur est survenue lors de la connexion'
        );
      }
    }
  },

  register: async (userData: RegisterPayload): Promise<RegisterResponse> => {
    try {
      await initializeCsrfToken();

      const role = userData.role || 'proprietaire';
      const endpoint = role === 'agence'
        ? '/auth/register/co-owner'
        : '/auth/register/landlord';

      const requestData = role === 'agence'
        ? {
          email: userData.email || '',
          phone: userData.phone || '',
          password: userData.password || '',
          password_confirmation: userData.password_confirmation || '',
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          is_professional: true,
        }
        : {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          password: userData.password || '',
          password_confirmation: userData.password_confirmation || '',
        };

      const response = await api.post<RegisterResponse>(endpoint, requestData);

      const responseData = response.data;

      const token = responseData.token || responseData.data?.token;
      const user = responseData.user || responseData.data?.user;

      if (token) localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', JSON.stringify(user));

      return responseData;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('API - Register error:', error);

      if (apiError.response) {
        if (apiError.response.data) {
          if (apiError.response.data.errors) {
            const validationErrors = Object.values(
              apiError.response.data.errors
            ).flat();
            const errorMessage =
              validationErrors && validationErrors.length > 0
                ? (validationErrors as string[]).join('\n')
                : 'Une erreur de validation est survenue';
            const errorWithResponse = new Error(errorMessage);
            (errorWithResponse as ApiError).response = apiError.response;
            throw errorWithResponse;
          }
          if (apiError.response.data.message) {
            const errorWithResponse = new Error(apiError.response.data.message);
            (errorWithResponse as ApiError).response = apiError.response;
            throw errorWithResponse;
          }
        }

        const statusError = new Error(
          `Erreur ${apiError.response.status}: ${apiError.response.statusText}`
        );
        (statusError as ApiError).response = apiError.response;
        throw statusError;
      }

      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    api.post(
      '/auth/logout',
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          Accept: 'application/json',
        },
      }
    ).catch(error => {
      console.error('Erreur lors de la déconnexion côté serveur:', error);
    });

    return Promise.resolve();
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await api.get<User>('/auth/user');

      if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      return null;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur :", error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  },

  forgotPassword: async (email: string) => {
    if (IS_STANDALONE) {
      await new Promise((r) => setTimeout(r, 1000));
      return { status: 'success', message: 'Email envoyé (simulé)' };
    }
    await initializeCsrfToken();
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: any) => {
    if (IS_STANDALONE) {
      await new Promise((r) => setTimeout(r, 1000));
      return { status: 'success', message: 'Mot de passe réinitialisé (simulé)' };
    }
    await initializeCsrfToken();
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },
};

// ================= PROPERTIES SERVICE =================

export const propertyService = {
  createProperty: async (
    payload: CreatePropertyPayload
  ): Promise<Property> => {
    try {
      await initializeCsrfToken();

      const safePayload: CreatePropertyPayload = {
        ...payload,
        charges_amount:
          payload.charges_amount === null || payload.charges_amount === undefined
            ? 0
            : payload.charges_amount,
      };

      const response = await api.post<Property>('/properties', safePayload);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API createProperty:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },

  listProperties: async (): Promise<PaginatedResponse<Property>> => {
    const response = await api.get<PaginatedResponse<Property>>('/properties');
    return response.data;
  },

  getProperty: async (id: number | string): Promise<Property> => {
    const response = await api.get<Property>(`/properties/${id}`);
    return response.data;
  },

  updateProperty: async (
    id: number | string,
    payload: Partial<CreatePropertyPayload>
  ): Promise<Property> => {
    try {
      await initializeCsrfToken();

      const safePayload: Partial<CreatePropertyPayload> = {
        ...payload,
      };

      const response = await api.put<Property>(
        `/properties/${id}`,
        safePayload
      );
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API updateProperty:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },

  deleteProperty: async (id: number | string): Promise<void> => {
    try {
      await initializeCsrfToken();
      await api.delete(`/properties/${id}`);
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API deleteProperty:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },
};

// ================= UPLOAD SERVICE =================

export const uploadService = {
  uploadPhoto: async (
    file: File
  ): Promise<{ path: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<{ path: string; url: string }>(
        '/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API uploadPhoto:', apiError.response?.data || error);
      throw error;
    }
  },
};

// ================= TENANT SERVICE =================

export interface InviteTenantPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export interface CompleteTenantRegistrationPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface TenantApiProperty {
  id: number;
  name: string | null;
  address: string;
  city: string | null;
}

export interface TenantApiLease {
  id: number;
  uuid: string | null;
  status: string;
}

export interface TenantApi {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone?: string | null;
  status?: string | null;
  solvency_score?: number | null;
  property?: TenantApiProperty | null;
  lease?: TenantApiLease | null;
}

export interface TenantInvitationApi {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  expires_at: string;
  created_at: string;
}

export interface TenantIndexResponse {
  tenants: TenantApi[];
  invitations: TenantInvitationApi[];
}

export const tenantService = {
  inviteTenant: async (payload: InviteTenantPayload): Promise<{
    message: string;
    invitation: {
      id: number;
      email: string;
      expires_at: string;
    };
  }> => {
    try {
      await initializeCsrfToken();

      const response = await api.post('/tenants/invite', payload);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API inviteTenant:', error);

      if (apiError.response?.data) {
        throw apiError.response.data;
      }
      throw error;
    }
  },

  listTenants: async (): Promise<TenantIndexResponse> => {
    try {
      await initializeCsrfToken();

      const response = await api.get<TenantIndexResponse>('/tenants');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API listTenants:', error);

      if (apiError.response?.data) {
        throw apiError.response.data;
      }
      throw error;
    }
  },

  completeTenantRegistration: async (
    payload: CompleteTenantRegistrationPayload
  ): Promise<{
    message: string;
    token: string;
    user: User;
  }> => {
    try {
      await initializeCsrfToken();

      const response = await api.post(
        '/auth/tenant/complete-registration',
        payload
      );

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }
      if (response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API completeTenantRegistration:', error);

      if (apiError.response?.data) {
        throw apiError.response.data;
      }
      throw error;
    }
  },

  updateTenant: async (id: number | string, data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }): Promise<any> => {
    try {
      await initializeCsrfToken();
      const response = await api.put(`/tenants/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur API updateTenant:', error);
      throw error;
    }
  },

  archiveTenant: async (id: number | string): Promise<void> => {
    try {
      await initializeCsrfToken();
      await api.post(`/tenants/${id}/archive`);
    } catch (error) {
      console.error('Erreur API archiveTenant:', error);
      throw error;
    }
  },

  deleteTenant: async (id: number | string): Promise<void> => {
    try {
      await initializeCsrfToken();
      await api.delete(`/tenants/${id}`);
    } catch (error) {
      console.error('Erreur API deleteTenant:', error);
      throw error;
    }
  },
};

// ================= LEASES SERVICE =================

export interface Lease {
  tenant: any;
  property: any;
  id: number;
  uuid: string;
  property_id: number;
  tenant_id: number;
  start_date: string;
  end_date: string | null;
  rent_amount: string;
  deposit: string | null;
  type: string;
  status: string;
  terms: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeasePayload {
  property_id: number;
  tenant_id: number;
  start_date: string;
  end_date?: string | null;
  rent_amount: number;
  deposit?: number | null;
  type: "nu" | "meuble";
  status?: "pending" | "active" | "terminated";
  terms?: string[];
}

export const leaseService = {
  createLease: async (payload: CreateLeasePayload): Promise<Lease> => {
    try {
      await initializeCsrfToken();

      const response = await api.post<Lease>('/leases', payload);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API createLease:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },

  listLeases: async (): Promise<Lease[]> => {
    try {
      const response = await api.get<Lease[]>('/leases');
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API listLeases:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },

  getLease: async (id: number | string): Promise<Lease> => {
    try {
      const response = await api.get<Lease>(`/leases/${id}`);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API getLease:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },

  terminateLease: async (uuid: string): Promise<Lease> => {
    try {
      await initializeCsrfToken();

      const response = await api.post<Lease>(`/leases/${uuid}/terminate`, {});
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API terminateLease:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },
};

// ================= ETATS DES LIEUX (CONDITION REPORTS) =================

export type ConditionStatus = 'good' | 'satisfactory' | 'poor' | 'damaged';

export interface PropertyConditionPhoto {
  id: number;
  report_id: number;
  path: string;
  original_filename: string | null;
  mime_type: string | null;
  size: number;
  condition_status: ConditionStatus | null;
  condition_notes?: string | null;
  taken_at: string;
  caption?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyConditionReport {
  id: number;
  property_id: number;
  lease_id: number;
  created_by: number;
  type: 'entry' | 'exit' | 'intermediate';
  report_date: string;
  notes?: string | null;
  signature_data?: string | null;
  signed_by?: string | null;
  signed_at?: string | null;
  photos?: PropertyConditionPhoto[];
  lease?: Lease | null;
  property?: Property | null;
}

export type CreateConditionReportPhotoItem = {
  file: File;
  condition_status?: ConditionStatus;
  condition_notes?: string;
  caption?: string;
  taken_at?: string;
};

export interface CreateConditionReportPayload {
  lease_id: number;
  type: 'entry' | 'exit' | 'intermediate';
  report_date: string;
  notes?: string | null;
  photos: CreateConditionReportPhotoItem[];
  signature_data?: string;
  signed_by?: string;
}

// ✅ SERVICE COMBINÉ - UNE SEULE DÉFINITION
export const conditionReportService = {
  // Méthodes spécifiques aux propriétés (pour les composants existants)
  listForProperty: async (
    propertyId: number | string
  ): Promise<PropertyConditionReport[]> => {
    await initializeCsrfToken();
    const response = await api.get<PropertyConditionReport[]>(
      `/properties/${propertyId}/condition-reports`
    );
    return response.data;
  },

  getForProperty: async (
    propertyId: number | string,
    reportId: number | string
  ): Promise<PropertyConditionReport> => {
    await initializeCsrfToken();
    const response = await api.get<PropertyConditionReport>(
      `/properties/${propertyId}/condition-reports/${reportId}`
    );
    return response.data;
  },

  createForProperty: async (
    propertyId: number | string,
    payload: CreateConditionReportPayload
  ): Promise<PropertyConditionReport> => {
    await initializeCsrfToken();

    const formData = new FormData();

    formData.append('lease_id', String(payload.lease_id));
    formData.append('type', payload.type);
    formData.append('report_date', payload.report_date);

    if (payload.notes) formData.append('notes', payload.notes);

    if (payload.signature_data) {
      formData.append('signature_data', payload.signature_data);
      formData.append('signed_by', payload.signed_by || 'Signature');
    }

    payload.photos.forEach((p, index) => {
      if (!(p?.file instanceof File)) {
        throw new Error(`Photo invalide à l’index ${index} (file manquant).`);
      }

      formData.append(`photos[${index}]`, p.file);
      formData.append(
        `photo_dates[${index}]`,
        (p.taken_at || payload.report_date) as string
      );

      if (p.caption) {
        formData.append(`photo_captions[${index}]`, p.caption);
      }
    });

    const response = await api.post<{ message: string; report: PropertyConditionReport } | PropertyConditionReport>(
      `/properties/${propertyId}/condition-reports`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    const data = response.data as { message?: string; report?: PropertyConditionReport } | PropertyConditionReport;
    return (data && 'report' in data ? data.report : data) as PropertyConditionReport;
  },

  addPhotos: async (
    propertyId: number | string,
    reportId: number | string,
    items: CreateConditionReportPhotoItem[],
    defaultDate?: string
  ): Promise<{ message: string; photos: PropertyConditionPhoto[] }> => {
    await initializeCsrfToken();

    const formData = new FormData();

    items.forEach((p, index) => {
      if (!(p?.file instanceof File)) {
        throw new Error(`Photo invalide à l’index ${index} (file manquant).`);
      }

      formData.append(`photos[${index}]`, p.file);
      formData.append(`photo_dates[${index}]`, p.taken_at || defaultDate || new Date().toISOString().slice(0, 10));

      if (p.caption) formData.append(`photo_captions[${index}]`, p.caption);
      if (p.condition_status) formData.append(`condition_status[${index}]`, p.condition_status);
      if (p.condition_notes) formData.append(`condition_notes[${index}]`, p.condition_notes);
    });

    const response = await api.post(
      `/properties/${propertyId}/condition-reports/${reportId}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return response.data;
  },

  // ✅ NOUVELLES MÉTHODES POUR LE COMPOSANT CreateEtatDesLieux
  listAll: async (params?: any): Promise<PropertyConditionReport[]> => {
    await initializeCsrfToken();
    const response = await api.get<PropertyConditionReport[]>('/landlord/condition-reports', { params });
    return response.data;
  },

  get: async (id: string): Promise<PropertyConditionReport> => {
    const response = await api.get(`/landlord/condition-reports/${id}`);
    return response.data;
  },

  getProperties: async (): Promise<Property[]> => {
    const response = await api.get('/landlord/condition-reports/properties');
    return response.data;
  },

  getLeasesForProperty: async (propertyId: string): Promise<Lease[]> => {
    const response = await api.get(`/landlord/condition-reports/leases/${propertyId}`);
    return response.data;
  },

  create: async (data: FormData): Promise<{ success: boolean; message: string; report_id?: number }> => {
    const response = await api.post('/landlord/condition-reports', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  sign: async (id: string, signature: string): Promise<{ success: boolean; message: string; signed_at?: string }> => {
    const response = await api.post(`/landlord/condition-reports/${id}/sign`, { signature });
    return response.data;
  },

  uploadSigned: async (id: string, file: File): Promise<{ success: boolean; message: string }> => {
    const formData = new FormData();
    formData.append('signed_file', file);
    const response = await api.post(`/landlord/condition-reports/${id}/upload-signed`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  downloadPdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/landlord/condition-reports/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/landlord/condition-reports/${id}`);
    return response.data;
  }
};

// ================= CONTRACT SERVICE =================

export interface RentalContractData {
  landlord: {
    name: string;
    address: string;
    phone: string;
    email: string;
    id_type: string;
    id_number: string;
  };
  tenant: {
    name: string;
    address: string;
    phone: string;
    email: string;
    id_type: string;
    id_number: string;
  };
  property: {
    address: string;
    floor?: string;
    type: string;
    area: string;
    rooms: string;
    has_parking: boolean;
    equipment?: string[];
  };
  contract: {
    start_date: string;
    end_date: string | null;
    rent_amount: number;
    deposit_amount: number;
    included_charges?: string[];
    payment_frequency?: "monthly" | "quarterly";
    payment_method?: "cash" | "bank_transfer" | "mobile_money";
    notice_period?: number;
    duration?: string;
  };
}

export const contractService = {
  async downloadLeaseContract(uuid: string): Promise<Blob> {
    try {
      const response = await api.get(`/pdf/contrat-bail/${uuid}`, {
        responseType: "blob",
      });

      return new Blob([response.data], { type: "application/pdf" });
    } catch (error) {
      console.error("Erreur lors du téléchargement du contrat (UUID):", error);
      throw error;
    }
  },

  async generateRentalContract(data: RentalContractData): Promise<Blob> {
    try {
      const response = await api.post("/pdf/generate-rental-contract", data, {
        responseType: "blob",
      });

      return new Blob([response.data], { type: "application/pdf" });
    } catch (error) {
      console.error("Erreur lors de la génération du contrat (JSON):", error);
      throw error;
    }
  },

  downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },
};

// ================= NOTICES SERVICE =================

export interface Notice {
  id: number;
  property_id: number;
  landlord_id: number;
  tenant_id: number;
  type: "landlord" | "tenant";
  reason: string;
  notice_date: string;
  end_date: string;
  status: "pending" | "confirmed" | "cancelled";
  notes?: string | null;
  created_at: string;
  property?: {
    id: number;
    address: string;
  };
  tenant?: {
    id: number;
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

export interface CreateNoticePayload {
  lease_id?: number;
  property_id?: number;
  tenant_id?: number;
  type: "landlord" | "tenant";
  reason: string;
  notice_date: string;
  end_date: string;
  notes?: string;
}

export const noticeService = {
  list: async (): Promise<Notice[]> => {
    const response = await api.get<Notice[]>("/notices");
    return response.data;
  },

  create: async (payload: CreateNoticePayload): Promise<Notice> => {
    const response = await api.post<Notice>("/notices", payload);
    return response.data;
  },

  getLeasesForForm: async (): Promise<any[]> => {
    const response = await api.get('/notices/leases/form');
    return response.data.leases || [];
  },

  update: async (
    id: number,
    payload: Partial<Pick<Notice, "status" | "notes">>
  ): Promise<Notice> => {
    const response = await api.put<Notice>(`/notices/${id}`, payload);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/notices/${id}`);
  },
};

// ================= RENT RECEIPTS =================

export type RentReceiptType = "independent" | "invoice";

export interface RentReceipt {
  id: number;
  lease_id: number;
  property_id: number;
  landlord_id: number;
  tenant_id: number;
  type: RentReceiptType;
  status: "issued" | "draft";
  paid_month: string;
  issued_date: string;
  amount_paid: number;
  currency?: string | null;
  notes?: string | null;
  created_at: string;
  lease?: Lease;
  property?: { id: number; address: string; city?: string | null };
  tenant?: { id: number; first_name?: string | null; last_name?: string | null; email?: string | null };
}

export interface CreateRentReceiptPayload {
  lease_id: number;
  paid_month: string;
  issued_date?: string;
  notes?: string | null;
  send_email?: boolean;
}

export const rentReceiptService = {
  listIndependent: async (): Promise<RentReceipt[]> => {
    await initializeCsrfToken();
    const response = await api.get<RentReceipt[]>("/rent-receipts", {
      params: { type: "independent" },
    });
    return response.data;
  },

  createIndependent: async (payload: CreateRentReceiptPayload): Promise<RentReceipt> => {
    await initializeCsrfToken();
    const response = await api.post<RentReceipt>("/rent-receipts", {
      ...payload,
      type: "independent",
    });
    return response.data;
  },


  getLeasesForForm: async (): Promise<any[]> => {
    const response = await api.get('/rent-receipts/leases-form');
    return response.data;
  },

  getPropertiesForFilter: async (): Promise<any[]> => {
    const response = await api.get('/rent-receipts/properties');
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/rent-receipts/stats');
    return response.data;
  },

  sendByEmail: async (id: number): Promise<any> => {
    await initializeCsrfToken();
    const response = await api.post(`/quittances/${id}/send-email`);
    return response.data;
  },
  
  downloadPdf: async (id: number): Promise<Blob> => {
    await initializeCsrfToken();
    const response = await api.get(`/quittances/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },
  
  getQuittance: async (id: number): Promise<any> => {
    await initializeCsrfToken();
    const response = await api.get(`/quittances/${id}`);
    return response.data;
  }
};

// ================= INVOICES SERVICE =================

export interface CreateInvoicePayload {
  lease_id: number;
  type: 'rent' | 'deposit' | 'charge' | 'repair';
  due_date: string;
  period_start?: string;
  period_end?: string;
  amount_total: number;
  payment_method?: string;
}

export interface Invoice {
  id?: number;
  lease_id: number;
  type: 'rent' | 'deposit' | 'charge' | 'repair';
  due_date: string;
  amount_total: number;
  invoice_number?: string;
  description?: string;
  status?: string;
  created_at?: string;
  lease?: {
    property?: {
      id: number;
      name?: string;
      address?: string;
    };
    tenant?: {
      user?: {
        name?: string;
      };
    };
  };
  [key: string]: unknown;
}

export interface TenantInvoice {
  id: number;
  lease_id: number;
  type: 'rent' | 'deposit' | 'charge' | 'repair';
  due_date: string;
  amount_total: number;
  paid_amount?: number;
  status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'failed';
  paid_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentConfirmation {
  id: number;
  invoice_id: number;
  transaction_id: string;
  amount_paid: number;
  payment_method: string;
  paid_at: string;
  receipt_url?: string;
  status: 'success' | 'failed' | 'pending';
}

export const invoiceService = {
  createInvoice: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    try {
      await initializeCsrfToken();

      const response = await api.post('/invoices', payload);
      return response.data;
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API createInvoice:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },

  listInvoices: async (): Promise<Invoice[]> => {
    try {
      const response = await api.get('/invoices');
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Erreur API listInvoices:', error);
      if (apiError.response?.data) throw apiError.response.data;
      throw error;
    }
  },

  downloadInvoicePdf: async (id: string): Promise<Blob> => {
    const response = await api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getPropertiesForFilter: async (): Promise<any[]> => {
    try {
      const response = await api.get('/invoices/properties');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement propriétés:', error);
      return [];
    }
  }
};

// ================= MAINTENANCE SERVICE =================

export const maintenanceService = {
  // Liste toutes les interventions
  list: async (): Promise<any[]> => {
    const response = await api.get('/incidents');
    return response.data.data || response.data;
  },
  
  // Alias pour list (pour compatibilité)
  listIncidents: async (): Promise<any[]> => {
    const response = await api.get('/incidents');
    return response.data.data || response.data;
  },
  
  // ✅ NOUVELLE MÉTHODE - Récupérer les propriétés pour le formulaire
  getPropertiesForForm: async () => {
    try {
      const response = await api.get('/maintenance/properties');
      return response.data;
    } catch (error) {
      console.error('Erreur chargement propriétés pour formulaire:', error);
      throw error;
    }
  },
  
  // Créer une intervention
  createIncident: async (data: any) => {
    try {
      const response = await api.post('/incidents', data);
      return response.data;
    } catch (error) {
      console.error('Erreur création intervention:', error);
      throw error;
    }
  },
  
  // Alias pour createIncident (pour compatibilité)
  create: async (payload: any): Promise<any> => {
    const response = await api.post('/incidents', payload);
    return response.data;
  },
  
  // Mettre à jour une intervention
  update: async (id: number | string, payload: any): Promise<any> => {
    const response = await api.put(`/incidents/${id}`, payload);
    return response.data;
  },
  
  // Récupérer une intervention par son ID
  getIncident: async (id: number | string): Promise<any> => {
    const response = await api.get(`/incidents/${id}`);
    return response.data;
  },

  // Répondre à un locataire
  replyToTenant: async (id: number, data: { message: string }): Promise<any> => {
    const response = await api.post(`/incidents/${id}/reply`, data);
    return response.data;
  }
};

// ================= DOCUMENT ARCHIVE SERVICE =================

export const documentArchiveService = {
  list: async (): Promise<any[]> => {
    const response = await api.get('/archives');
    return response.data.archives || [];
  },
  getStats: async (): Promise<any> => {
    const response = await api.get('/archives/stats');
    return response.data;
  }
};

// ================= DOCUMENTS SERVICE (UNIFIÉ) =================

export const documentsService = {
    // Récupérer tous les baux
    getLeases: async (): Promise<any[]> => {
        const response = await api.get('/leases');
        return response.data.data || response.data;
    },

    // Récupérer tous les états des lieux
    getConditionReports: async (): Promise<any[]> => {
        const response = await api.get('/condition-reports');
        return response.data.data || response.data;
    },

    // Récupérer toutes les quittances
    getRentReceipts: async (): Promise<any[]> => {
        const response = await api.get('/rent-receipts');
        return response.data.data || response.data;
    },

    // Récupérer tous les paiements
    getPayments: async (): Promise<any[]> => {
        const response = await api.get('/transactions');
        return response.data.data || response.data;
    },

    // Récupérer tous les documents en une seule fois
    getAllDocuments: async (): Promise<any[]> => {
        try {
            const [leases, conditionReports, rentReceipts, payments] = await Promise.all([
                documentsService.getLeases().catch(() => []),
                documentsService.getConditionReports().catch(() => []),
                documentsService.getRentReceipts().catch(() => []),
                documentsService.getPayments().catch(() => [])
            ]);

            // Transformer les baux
            const leaseDocs = (leases || []).map((lease: any) => ({
                id: `lease-${lease.id}`,
                type: 'lease',
                typeBadge: 'Bail',
                typeBadgeColor: '#77B84D',
                titre: `Bail - ${lease.property?.name || 'Bien'} - ${lease.tenant?.first_name || ''} ${lease.tenant?.last_name || ''}`,
                bien: lease.property?.name || lease.property?.address || 'Bien inconnu',
                date: lease.created_at,
                reference: lease.reference || lease.uuid || `BAIL-${lease.id}`,
                property_id: lease.property_id,
                tenant_id: lease.tenant_id,
                status: lease.status,
                start_date: lease.start_date,
                end_date: lease.end_date
            }));

            // Transformer les états des lieux
            const conditionDocs = (conditionReports || []).map((report: any) => ({
                id: `condition-${report.id}`,
                type: 'inventory',
                typeBadge: 'EDL',
                typeBadgeColor: '#f59e0b',
                titre: `État des lieux ${report.type === 'entry' ? "d'entrée" : 'de sortie'}`,
                bien: report.property?.name || report.property?.address || 'Bien inconnu',
                date: report.report_date || report.created_at,
                reference: report.reference || `EDL-${report.id}`,
                property_id: report.property_id,
                lease_id: report.lease_id,
                report_type: report.type
            }));

            // Transformer les quittances
            const receiptDocs = (rentReceipts || []).map((receipt: any) => ({
                id: `receipt-${receipt.id}`,
                type: 'receipt',
                typeBadge: 'Quittance',
                typeBadgeColor: '#77B84D',
                titre: `Quittance - ${receipt.paid_month || 'Mois inconnu'}`,
                bien: receipt.property?.name || receipt.property?.address || 'Bien inconnu',
                date: receipt.issued_date || receipt.created_at,
                reference: receipt.reference || `QUIT-${receipt.id}`,
                amount: receipt.amount_paid,
                month: receipt.paid_month,
                property_id: receipt.property_id,
                tenant_id: receipt.tenant_id
            }));

            // Transformer les paiements
            const paymentDocs = (payments || []).map((payment: any) => ({
                id: `payment-${payment.id}`,
                type: 'payment',
                typeBadge: 'Paiement',
                typeBadgeColor: '#3b82f6',
                titre: `Paiement - ${payment.description || 'Loyer'}`,
                bien: payment.property_name || payment.property?.name || 'Bien inconnu',
                date: payment.date || payment.created_at,
                reference: payment.reference || `PAY-${payment.id}`,
                amount: payment.amount,
                status: payment.status,
                property_id: payment.property_id
            }));

            // Combiner tous les documents
            const allDocs = [
                ...leaseDocs,
                ...conditionDocs,
                ...receiptDocs,
                ...paymentDocs
            ];

            // Trier par date (du plus récent au plus ancien)
            return allDocs.sort((a, b) => 
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );

        } catch (error) {
            console.error('Erreur lors de la récupération des documents:', error);
            return [];
        }
    },

    // Obtenir des statistiques sur les documents
    getDocumentsStats: async (): Promise<any> => {
        try {
            const [leases, conditionReports, rentReceipts, payments] = await Promise.all([
                documentsService.getLeases().catch(() => []),
                documentsService.getConditionReports().catch(() => []),
                documentsService.getRentReceipts().catch(() => []),
                documentsService.getPayments().catch(() => [])
            ]);

            // Calculer la taille totale approximative (si disponible)
            const totalSize = 0; // À implémenter si vos documents ont une taille

            return {
                total_documents: (leases?.length || 0) + 
                                 (conditionReports?.length || 0) + 
                                 (rentReceipts?.length || 0) + 
                                 (payments?.length || 0),
                baux_termines: (leases || []).filter((l: any) => l.status === 'terminated').length,
                edl_archives: conditionReports?.length || 0,
                quittances_archives: rentReceipts?.length || 0,
                total_size: totalSize,
                total_size_human: totalSize > 0 ? `${(totalSize / (1024 * 1024)).toFixed(1)} MB` : '0 MB'
            };
        } catch (error) {
            console.error('Erreur stats documents:', error);
            return {
                total_documents: 0,
                baux_termines: 0,
                edl_archives: 0,
                quittances_archives: 0,
                total_size: 0,
                total_size_human: '0 MB'
            };
        }
    }
};

// ================= ACCOUNTING SERVICE =================

export const accountingService = {
  getStats: async (year?: number): Promise<any> => {
    try {
      const params = year ? `?year=${year}` : '';
      const response = await api.get(`/landlord/accounting/stats${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getStats:', error);
      return {
        resultat_net: 0,
        resultat_net_formatted: '0 FCFA',
        revenus: 0,
        revenus_formatted: '0 FCFA',
        charges: 0,
        charges_formatted: '0 FCFA',
        rentabilite: 0,
        active_properties: 0,
        transactions_count: 0,
        occupied: 0,
        vacant: 0,
        revenus_par_categorie: {},
        charges_par_categorie: {},
        repartition_par_bien: [],
        variation: '0%',
        available_years: [new Date().getFullYear()]
      };
    }
  },

  getTransactions: async (params?: { year?: number }): Promise<any> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.year) queryParams.append('year', params.year.toString());
      
      const response = await api.get(`/landlord/accounting/transactions?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getTransactions:', error);
      return { data: [] };
    }
  },

  getChartData: async (year?: number): Promise<any> => {
    try {
      const params = year ? `?year=${year}` : '';
      const response = await api.get(`/landlord/accounting/chart-data${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur getChartData:', error);
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      return {
        data: months.map(month => ({
          month,
          received: 0,
          average: 0
        }))
      };
    }
  },

  createTransaction: async (payload: any): Promise<any> => {
    try {
      const response = await api.post('/landlord/accounting/transactions', payload);
      return response.data;
    } catch (error) {
      console.error('Erreur createTransaction:', error);
      throw error;
    }
  }
};

// ================= LANDLORD SERVICE =================

// ================= LANDLORD SERVICE =================

export const landlordService = {
  getSettings: async () => {
    try {
      // Enlever '/landlord' du chemin
      const response = await api.get('/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching landlord settings:', error);
      throw error;
    }
  },

  updateProfile: async (userData: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    address?: string;
    company_name?: string;
  }) => {
    try {
      // Enlever '/landlord' du chemin
      const response = await api.put('/settings/profile', userData);

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...currentUser, ...response.data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      return response.data;
    } catch (error) {
      console.error('Error updating landlord profile:', error);
      throw error;
    }
  },

  getDashboardStats: async () => {
    try {
      const response = await api.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
};

// ================= API SERVICE EXPORT =================

export const apiService = {
  ...authService,
  ...propertyService,
  ...uploadService,
  ...tenantService,
  ...leaseService,
  ...conditionReportService,
  ...contractService,
  ...noticeService,
  ...rentReceiptService,
  ...invoiceService,
  ...maintenanceService,
  ...documentArchiveService,
  ...accountingService,
  ...landlordService,
  getLeases: leaseService.listLeases,
  createInvoice: invoiceService.createInvoice,
};

export default api;