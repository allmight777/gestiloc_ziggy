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

    // Ajoutez cette méthode
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
            
            return true;
        } catch (error) {
            console.error('Erreur downloadContract:', error);
            throw error;
        }
    },

    // Signer électroniquement
    signContract: async (leaseId: string) => {
        try {
            const response = await api.post(`/landlord/leases/${leaseId}/sign`);
            return response.data;
        } catch (error) {
            console.error('Erreur signContract:', error);
            throw error;
        }
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