
import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  component_name?: string;
  url?: string;
  user_agent?: string;
  created_at: string;
}

interface ErrorContextType {
  errors: ErrorLog[];
  logError: (error: Error, componentName?: string) => Promise<void>;
  clearErrors: () => void;
  showError: (message: string, type?: string) => void;
}

const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  logError: async () => {},
  clearErrors: () => {},
  showError: () => {},
});

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [errors, setErrors] = useState<ErrorLog[]>([]);

  const logError = useCallback(async (error: Error, componentName?: string) => {
    const errorData = {
      error_type: error.name || 'Error',
      error_message: error.message,
      error_stack: error.stack,
      component_name: componentName,
      url: window.location.href,
      user_agent: navigator.userAgent,
    };

    try {
      const { data, error: dbError } = await supabase
        .from('error_logs')
        .insert(errorData)
        .select()
        .single();

      if (dbError) {
        console.error('Failed to log error to database:', dbError);
      } else if (data) {
        setErrors(prev => [data, ...prev]);
      }
    } catch (dbError) {
      console.error('Failed to log error:', dbError);
    }

    // Also log to console for development
    console.error(`[${componentName || 'Unknown'}]`, error);
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const showError = useCallback((message: string, type = 'Error') => {
    const error = new Error(message);
    error.name = type;
    logError(error, 'User Action');
  }, [logError]);

  return (
    <ErrorContext.Provider value={{ errors, logError, clearErrors, showError }}>
      {children}
    </ErrorContext.Provider>
  );
};
