/**
 * Toast.jsx
 * 
 * Auto-dismissing toast notification for the dispatcher web app.
 * Uses Material-UI Snackbar and Alert components for consistent styling.
 * 
 * FEATURES:
 * - Auto-dismiss after duration (default 3 seconds)
 * - Slide in from top with MUI animations
 * - Color-coded by type: success (green), error (red), warning (orange), info (blue)
 * - Click to dismiss early
 */

import React from 'react';
import { Snackbar, Alert } from '@mui/material';

const Toast = ({ visible, message, type = 'info', duration = 3000, onClose }) => {
    return (
        <Snackbar
            open={visible}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            sx={{ mt: 2 }}
        >
            <Alert
                onClose={onClose}
                severity={type}
                variant="filled"
                sx={{
                    width: '100%',
                    minWidth: 300,
                    maxWidth: 500,
                    boxShadow: 3,
                    fontSize: '0.95rem',
                    fontWeight: 500
                }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
};

export default Toast;