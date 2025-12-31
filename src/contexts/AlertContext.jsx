/**
 * AlertContext.jsx
 * 
 * Global alert/toast provider for the dispatcher web app.
 * Manages state for CustomAlert (modal dialogs) and Toast (notifications).
 * 
 * USAGE:
 * ```javascript
 * import { useAlert } from './contexts/AlertContext';
 * 
 * const MyComponent = () => {
 *   const { showAlert, showToast } = useAlert();
 * 
 *   // Show modal dialog
 *   showAlert('Error', 'Something went wrong', [{ text: 'OK' }]);
 * 
 *   // Show confirmation
 *   showAlert('Confirm', 'Are you sure?', [
 *     { text: 'Cancel', style: 'cancel' },
 *     { text: 'Delete', style: 'destructive', onPress: () => deleteItem() }
 *   ]);
 * 
 *   // Show success toast
 *   showToast('Call sent successfully!', 'success');
 * 
 *   // Show error toast
 *   showToast('Failed to connect', 'error');
 * };
 * ```
 */

import React, { createContext, useContext, useState } from 'react';
import CustomAlert from '../components/CustomAlert';
import Toast from '../components/Toast';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState({
        visible: false,
        title: '',
        message: '',
        buttons: [],
        type: 'info'
    });

    const [toast, setToast] = useState({
        visible: false,
        message: '',
        type: 'info',
        duration: 3000
    });

    /**
     * Show a modal alert dialog
     * @param {string} title - Alert title
     * @param {string} message - Alert message
     * @param {Array} buttons - Array of button objects: [{ text, onPress, style }]
     * @param {string} type - Alert type: 'success', 'error', 'warning', 'info'
     */
    const showAlert = (title, message, buttons = [{ text: 'OK' }], type = 'info') => {
        setAlert({
            visible: true,
            title,
            message,
            buttons,
            type
        });
    };

    /**
     * Show a toast notification (auto-dismissing)
     * @param {string} message - Toast message
     * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in milliseconds (default 3000)
     */
    const showToast = (message, type = 'info', duration = 3000) => {
        setToast({
            visible: true,
            message,
            type,
            duration
        });
    };

    const closeAlert = () => {
        setAlert(prev => ({ ...prev, visible: false }));
    };

    const closeToast = () => {
        setToast(prev => ({ ...prev, visible: false }));
    };

    return (
        <AlertContext.Provider value={{ showAlert, showToast }}>
            {children}
            <CustomAlert
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                buttons={alert.buttons}
                type={alert.type}
                onClose={closeAlert}
            />
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                duration={toast.duration}
                onClose={closeToast}
            />
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
