// src/services/leaseService.ts

import api from './api';

export const leaseService = {
    // Récupérer tous les baux
    listLeases: async () => {
        try {
            const response = await api.get('/landlord/leases');
            return response.data;
        } catch (error) {
            console.error('Erreur listLeases:', error);
            throw error;
        }
    },

    // Voir le contrat signé
    viewSignedContract: async (uuid: string) => {
        window.open(`/api/landlord/leases/${uuid}/signed`, '_blank');
    },

    // Récupérer les propriétés pour le filtre
    getProperties: async () => {
        try {
            const response = await api.get('/landlord/properties');
            return response.data;
        } catch (error) {
            console.error('Erreur getProperties:', error);
            throw error;
        }
    },

    // Télécharger un contrat
    downloadContract: async (leaseId: string) => {
        try {
            const response = await api.get(`/landlord/leases/${leaseId}/download`, {
                responseType: 'blob',
            });
            
            // Créer un lien de téléchargement
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `contrat-bail-${leaseId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            return true;
        } catch (error) {
            console.error('Erreur downloadContract:', error);
            throw error;
        }
    },

    // Signer électroniquement (ancienne méthode - signature simple)
    signContract: async (leaseId: string) => {
        try {
            const response = await api.post(`/landlord/leases/${leaseId}/sign`);
            return response.data;
        } catch (error) {
            console.error('Erreur signContract:', error);
            throw error;
        }
    },

    // ✅ NOUVELLE MÉTHODE - Signature électronique avec canvas
    signContractElectronic: async (uuid: string, signatureDataUrl: string) => {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
        const baseUrl = apiUrl.replace('/api', '');
        
        const response = await fetch(`${baseUrl}/api/landlord/leases/${uuid}/sign-electronic`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ signature: signatureDataUrl }),
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Erreur lors de la signature');
        }
        
        return response.json();
    },

    // Uploader un contrat signé manuellement
    uploadSignedContract: async (leaseId: string, file: File) => {
        try {
            const formData = new FormData();
            formData.append('signed_file', file);
            
            const response = await api.post(`/landlord/leases/${leaseId}/upload-signed`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Erreur uploadSignedContract:', error);
            throw error;
        }
    },
};

export default leaseService;