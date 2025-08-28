import { useState, useCallback } from 'react';
import { logger } from '@shared/utils/logger';

interface UseConnectionStateOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const useConnectionState = (options: UseConnectionStateOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(async (action: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await action();
      options.onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      logger.error('Error en operación de conexión:', errorMessage);
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    setError,
    clearError,
    executeAction
  };
};

interface UseFormStateOptions<T> {
  initialState: T;
  onSubmit?: (data: T) => Promise<void> | void;
  validate?: (data: T) => string | null;
}

export const useFormState = <T extends Record<string, any>>(options: UseFormStateOptions<T>) => {
  const [formData, setFormData] = useState<T>(options.initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando se actualiza
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    if (options.validate) {
      const error = options.validate(formData);
      if (error) {
        logger.warn('Error de validación del formulario:', error);
        return false;
      }
    }
    return true;
  }, [formData, options]);

  const resetForm = useCallback(() => {
    setFormData(options.initialState);
    setErrors({});
    setIsSubmitting(false);
  }, [options.initialState]);

  const submitForm = useCallback(async () => {
    if (!validateForm()) return false;

    setIsSubmitting(true);
    try {
      await options.onSubmit?.(formData);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error en el envío';
      logger.error('Error al enviar formulario:', errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, options]);

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    validateForm,
    resetForm,
    submitForm,
    setErrors
  };
};
