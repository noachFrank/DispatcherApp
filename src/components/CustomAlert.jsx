/**
 * CustomAlert.jsx
 * 
 * WinForms MessageBox.Show style modal dialog for the dispatcher web app.
 * Uses Material-UI components for consistent styling with the rest of the app.
 * 
 * FEATURES:
 * - Modal overlay with title, message, and buttons
 * - Button styles: normal (blue), cancel (gray), destructive (red)
 * - Alert types for color coding: success, error, warning, info
 * - Accessible keyboard support (Enter/Escape)
 */

import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box
} from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const CustomAlert = ({ visible, title, message, buttons = [], type = 'info', onClose }) => {
    // Get icon and color based on type
    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return { Icon: SuccessIcon, color: 'success.main', bgColor: 'success.light' };
            case 'error':
                return { Icon: ErrorIcon, color: 'error.main', bgColor: 'error.light' };
            case 'warning':
                return { Icon: WarningIcon, color: 'warning.main', bgColor: 'warning.light' };
            case 'info':
            default:
                return { Icon: InfoIcon, color: 'info.main', bgColor: 'info.light' };
        }
    };

    const { Icon, color, bgColor } = getTypeConfig();

    const handleButtonClick = (button) => {
        if (button.onPress) {
            button.onPress();
        }
        onClose();
    };

    // Get button variant and color based on style
    const getButtonProps = (button) => {
        if (button.style === 'cancel') {
            return { variant: 'outlined', color: 'inherit' };
        }
        if (button.style === 'destructive') {
            return { variant: 'contained', color: 'error' };
        }
        return { variant: 'contained', color: 'primary' };
    };

    return (
        <Dialog
            open={visible}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: bgColor, pb: 2 }}>
                <Icon sx={{ color, fontSize: 32 }} />
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    {title}
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                {buttons.map((button, index) => (
                    <Button
                        key={index}
                        onClick={() => handleButtonClick(button)}
                        autoFocus={index === buttons.length - 1}
                        {...getButtonProps(button)}
                    >
                        {button.text}
                    </Button>
                ))}
            </DialogActions>
        </Dialog>
    );
};

export default CustomAlert;
