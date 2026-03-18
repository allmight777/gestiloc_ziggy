// src/services/paymentMethodService.ts
import api from './api';

export interface PaymentMethod {
    id: number;
    user_id: number;
    type: 'mobile_money' | 'card' | 'bank_transfer' | 'cash';
    beneficiary_name: string;
    country: string;
    currency: string;
    is_default: boolean;
    is_active: boolean;
    mobile_operator?: string;
    mobile_number?: string;
    card_token?: string;
    card_last4?: string;
    card_brand?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_iban?: string;
    bank_swift?: string;
    metadata?: any;
    verified_at?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
}

export interface CreatePaymentMethodData {
    type: 'mobile_money' | 'card' | 'bank_transfer' | 'cash';
    beneficiary_name: string;
    country: string;
    currency: string;
    is_default?: boolean;
    mobile_operator?: string;
    mobile_number?: string;
    card_token?: string;
    card_last4?: string;
    card_brand?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_iban?: string;
    bank_swift?: string;
}

export interface UpdatePaymentMethodData {
    beneficiary_name?: string;
    country?: string;
    currency?: string;
    is_default?: boolean;
    mobile_operator?: string;
    mobile_number?: string;
    card_last4?: string;
    card_brand?: string;
    bank_name?: string;
    bank_account_number?: string;
    bank_iban?: string;
    bank_swift?: string;
}

class PaymentMethodService {
    private baseUrl = '/payment-methods';

    // Récupérer toutes les méthodes de paiement
    async getAll(): Promise<PaymentMethod[]> {
        const response = await api.get(this.baseUrl);
        return response.data.data;
    }

    // Récupérer une méthode de paiement par ID
    async getById(id: number): Promise<PaymentMethod> {
        const response = await api.get(`${this.baseUrl}/${id}`);
        return response.data.data;
    }

    // Créer une nouvelle méthode de paiement
    async create(data: CreatePaymentMethodData): Promise<PaymentMethod> {
        const response = await api.post(this.baseUrl, data);
        return response.data.data;
    }

    // Mettre à jour une méthode de paiement
    async update(id: number, data: UpdatePaymentMethodData): Promise<PaymentMethod> {
        const response = await api.put(`${this.baseUrl}/${id}`, data);
        return response.data.data;
    }

    // Supprimer une méthode de paiement
    async delete(id: number): Promise<void> {
        await api.delete(`${this.baseUrl}/${id}`);
    }

    // Définir une méthode comme par défaut
    async setDefault(id: number): Promise<void> {
        await api.post(`${this.baseUrl}/${id}/set-default`);
    }

    // Utilitaires
    getDisplayName(method: PaymentMethod): string {
        if (method.type === 'mobile_money') {
            return `${method.mobile_operator} - ${this.maskNumber(method.mobile_number || '')}`;
        } else if (method.type === 'card') {
            return `${method.card_brand} •••• ${method.card_last4}`;
        } else if (method.type === 'bank_transfer') {
            return `${method.bank_name} - ${this.maskNumber(method.bank_account_number || '')}`;
        } else if (method.type === 'cash') {
            return 'Espèces';
        }
        return 'Méthode de paiement';
    }

    getIcon(type: string): string {
        const icons = {
            'mobile_money': 'smartphone',
            'card': 'credit-card',
            'bank_transfer': 'landmark',
            'cash': 'wallet'
        };
        return icons[type as keyof typeof icons] || 'credit-card';
    }

    getColor(type: string): string {
        const colors = {
            'mobile_money': '#70AE48',
            'card': '#FF9800',
            'bank_transfer': '#2196F3',
            'cash': '#4CAF50'
        };
        return colors[type as keyof typeof colors] || '#9E9E9E';
    }

    getTypeLabel(type: string): string {
        const labels = {
            'mobile_money': 'Mobile Money',
            'card': 'Carte bancaire',
            'bank_transfer': 'Virement bancaire',
            'cash': 'Espèces'
        };
        return labels[type as keyof typeof labels] || 'Autre';
    }

    getCountryName(code: string): string {
        const countries: Record<string, string> = {
            'CI': 'Côte d\'Ivoire',
            'BF': 'Burkina Faso',
            'SN': 'Sénégal',
            'ML': 'Mali',
            'GN': 'Guinée',
            'CM': 'Cameroun',
            'BJ': 'Bénin',
            'TG': 'Togo'
        };
        return countries[code] || code;
    }

    maskNumber(number: string): string {
        if (!number) return '';
        if (number.length <= 4) return number;
        const visible = number.slice(-4);
        const masked = '*'.repeat(4);
        return masked + visible;
    }
}

export default new PaymentMethodService();