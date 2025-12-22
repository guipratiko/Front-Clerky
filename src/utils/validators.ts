/**
 * Utilitários de validação reutilizáveis
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validators = {
  email: (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'validation.emailRequired' };
    }
    if (!/\S+@\S+\.\S+/.test(value)) {
      return { isValid: false, error: 'validation.emailInvalid' };
    }
    return { isValid: true };
  },

  password: (value: string, minLength: number = 6): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'validation.passwordRequired' };
    }
    if (value.length < minLength) {
      return { isValid: false, error: 'validation.passwordMinLength' };
    }
    return { isValid: true };
  },

  name: (value: string, minLength: number = 3): ValidationResult => {
    if (!value?.trim()) {
      return { isValid: false, error: 'validation.nameRequired' };
    }
    if (value.trim().length < minLength) {
      return { isValid: false, error: 'validation.nameMinLength' };
    }
    return { isValid: true };
  },

  confirmPassword: (value: string, password: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: 'validation.confirmPasswordRequired' };
    }
    if (value !== password) {
      return { isValid: false, error: 'validation.passwordsNotMatch' };
    }
    return { isValid: true };
  },

  required: (value: any, errorKey: string = 'validation.required'): ValidationResult => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return { isValid: false, error: errorKey };
    }
    return { isValid: true };
  },
};

