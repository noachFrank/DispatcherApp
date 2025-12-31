import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Container
} from '@mui/material';
import { Assessment as ReportsIcon } from '@mui/icons-material';

const Reports = () => {
    return (
        <Container maxWidth="xl">
            <Box>
                {/* Header */}
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReportsIcon fontSize="large" color="primary" />
                    <Typography variant="h4" component="h1">
                        Reports
                    </Typography>
                </Box>

                {/* Placeholder for future reports */}
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Reports Coming Soon
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Financial reports, driver performance metrics, and ride analytics will be available here.
                    </Typography>
                </Paper>
            </Box>
        </Container>
    );
};

export default Reports;
