import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    DirectionsCar as CarIcon
} from '@mui/icons-material';
import { adminAPI } from '../services/adminService';

const FiredWorkersView = () => {
    const [firedWorkers, setFiredWorkers] = useState({ dispatchers: [], drivers: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchFiredWorkers();
    }, []);

    const fetchFiredWorkers = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await adminAPI.user.getFiredWorkers();
            console.log('Fired workers data:', data);
            setFiredWorkers({
                dispatchers: data.Dispatchers || data.dispatchers || [],
                drivers: data.Drivers || data.drivers || []
            });
        } catch (err) {
            console.error('Error fetching fired workers:', err);
            setError('Failed to load fired workers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" onClose={() => setError(null)}>
                {error}
            </Alert>
        );
    }

    const totalFired = firedWorkers.dispatchers.length + firedWorkers.drivers.length;

    if (totalFired === 0) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Fired Workers
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    All workers are currently active.
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" color="text.secondary">
                    Total Fired Workers: {totalFired}
                </Typography>
            </Box>

            {/* Fired Dispatchers */}
            <Accordion defaultExpanded={false}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        backgroundColor: 'action.hover',
                        '&:hover': { backgroundColor: 'action.selected' }
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <PersonIcon color="primary" />
                        <Typography variant="h6">
                            Fired Dispatchers ({firedWorkers.dispatchers.length})
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {firedWorkers.dispatchers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No fired dispatchers.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>ID</strong></TableCell>
                                        <TableCell><strong>Name</strong></TableCell>
                                        <TableCell><strong>Username</strong></TableCell>
                                        <TableCell><strong>Email</strong></TableCell>
                                        <TableCell><strong>Phone</strong></TableCell>
                                        <TableCell><strong>Date Joined</strong></TableCell>
                                        <TableCell><strong>Date Fired</strong></TableCell>
                                        <TableCell><strong>Admin</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {firedWorkers.dispatchers.map((dispatcher) => (
                                        <TableRow key={dispatcher.id} hover>
                                            <TableCell>{dispatcher.id}</TableCell>
                                            <TableCell>{dispatcher.name}</TableCell>
                                            <TableCell>{dispatcher.userName}</TableCell>
                                            <TableCell>{dispatcher.email}</TableCell>
                                            <TableCell>{dispatcher.phoneNumber}</TableCell>
                                            <TableCell>{formatDate(dispatcher.dateJoined)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={formatDate(dispatcher.endDate)}
                                                    color="error"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {dispatcher.isAdmin ? (
                                                    <Chip label="Yes" color="primary" size="small" />
                                                ) : (
                                                    <Chip label="No" variant="outlined" size="small" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </AccordionDetails>
            </Accordion>

            {/* Fired Drivers */}
            <Accordion defaultExpanded={false} sx={{ mt: 2 }}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                        backgroundColor: 'action.hover',
                        '&:hover': { backgroundColor: 'action.selected' }
                    }}
                >
                    <Box display="flex" alignItems="center" gap={2}>
                        <CarIcon color="primary" />
                        <Typography variant="h6">
                            Fired Drivers ({firedWorkers.drivers.length})
                        </Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    {firedWorkers.drivers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                            No fired drivers.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>ID</strong></TableCell>
                                        <TableCell><strong>Name</strong></TableCell>
                                        <TableCell><strong>Username</strong></TableCell>
                                        <TableCell><strong>Email</strong></TableCell>
                                        <TableCell><strong>Phone</strong></TableCell>
                                        <TableCell><strong>License</strong></TableCell>
                                        <TableCell><strong>Date Joined</strong></TableCell>
                                        <TableCell><strong>Date Fired</strong></TableCell>
                                        <TableCell><strong>Cars</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {firedWorkers.drivers.map((driver) => (
                                        <TableRow key={driver.id} hover>
                                            <TableCell>{driver.id}</TableCell>
                                            <TableCell>{driver.name}</TableCell>
                                            <TableCell>{driver.userName}</TableCell>
                                            <TableCell>{driver.email}</TableCell>
                                            <TableCell>{driver.phoneNumber}</TableCell>
                                            <TableCell>{driver.license}</TableCell>
                                            <TableCell>{formatDate(driver.joinedDate)}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={formatDate(driver.endDate)}
                                                    color="error"
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {driver.cars && driver.cars.length > 0 ? (
                                                    <Chip
                                                        label={`${driver.cars.length} car${driver.cars.length > 1 ? 's' : ''}`}
                                                        size="small"
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    <Typography variant="body2" color="text.secondary">
                                                        None
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </AccordionDetails>
            </Accordion>
        </Box>
    );
};

export default FiredWorkersView;
