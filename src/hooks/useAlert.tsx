import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CustomAlert } from '../components/CustomAlert';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'success' | 'error' | 'warning' | 'info';
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
    setTimeout(() => setAlertOptions(null), 300);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {alertOptions && (
        <CustomAlert
          visible={visible}
          title={alertOptions.title}
          message={alertOptions.message}
          buttons={alertOptions.buttons}
          type={alertOptions.type}
          onDismiss={hideAlert}
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

// Helper functions for common alert types
export const useAlertHelpers = () => {
  const { showAlert } = useAlert();

  const showSuccess = (title: string, message?: string, onDismiss?: () => void) => {
    showAlert({
      type: 'success',
      title,
      message,
      buttons: [{ text: 'OK', onPress: onDismiss }],
    });
  };

  const showError = (title: string, message?: string, onDismiss?: () => void) => {
    showAlert({
      type: 'error',
      title,
      message,
      buttons: [{ text: 'OK', onPress: onDismiss }],
    });
  };

  const showWarning = (title: string, message?: string, onDismiss?: () => void) => {
    showAlert({
      type: 'warning',
      title,
      message,
      buttons: [{ text: 'OK', onPress: onDismiss }],
    });
  };

  const showInfo = (title: string, message?: string, onDismiss?: () => void) => {
    showAlert({
      type: 'info',
      title,
      message,
      buttons: [{ text: 'OK', onPress: onDismiss }],
    });
  };

  const showConfirm = (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    showAlert({
      type: 'info',
      title,
      message,
      buttons: [
        { text: 'Annuler', style: 'cancel', onPress: onCancel },
        { text: 'Confirmer', style: 'default', onPress: onConfirm },
      ],
    });
  };

  const showDestructive = (
    title: string,
    message?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    showAlert({
      type: 'warning',
      title,
      message,
      buttons: [
        { text: 'Annuler', style: 'cancel', onPress: onCancel },
        { text: 'Supprimer', style: 'destructive', onPress: onConfirm },
      ],
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
    showDestructive,
  };
};