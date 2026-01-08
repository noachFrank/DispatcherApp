import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Container,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Chip,
    Divider,
    IconButton,
    Button,
    CircularProgress,
    Alert,
    Breadcrumbs,
    Link,
    Tooltip,
    Snackbar,
    Dialog,
    DialogContent,
    Backdrop
} from '@mui/material';
import {
    Assessment as ReportsIcon,
    Person as PersonIcon,
    Receipt as ReceiptIcon,
    ArrowBack as ArrowBackIcon,
    Download as DownloadIcon,
    Email as EmailIcon,
    OpenInNew as OpenInNewIcon,
    Folder as FolderIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { invoicesAPI } from '../services/apiService';

const Reports = () => {
    const [view, setView] = useState('main'); // 'main', 'drivers', 'invoices'
    const [driversWithInvoices, setDriversWithInvoices] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState(null);
    const [driverInvoices, setDriverInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // PDF Viewer state
    const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
    const [pdfUrl, setPdfUrl] = useState(null);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [viewingInvoiceNumber, setViewingInvoiceNumber] = useState(null);

    const fetchDriversWithInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await invoicesAPI.getDriversWithInvoices();
            setDriversWithInvoices(data);
        } catch (err) {
            setError('Failed to load drivers with invoices');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDriverInvoices = async (driverId) => {
        setLoading(true);
        setError(null);
        try {
            const data = await invoicesAPI.getDriverInvoices(driverId);
            setDriverInvoices(data);
        } catch (err) {
            setError('Failed to load invoices');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewInvoice = async (invoiceNumber) => {
        setPdfLoading(true);
        setPdfViewerOpen(true);
        setViewingInvoiceNumber(invoiceNumber);
        try {
            const blob = await invoicesAPI.downloadInvoice(invoiceNumber);
            const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
            setPdfUrl(url);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to view invoice', severity: 'error' });
            setPdfViewerOpen(false);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleClosePdfViewer = () => {
        setPdfViewerOpen(false);
        if (pdfUrl) {
            window.URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
        setViewingInvoiceNumber(null);
    };

    const handleDownloadInvoice = async (invoiceNumber, e) => {
        if (e) e.stopPropagation();
        try {
            const blob = await invoicesAPI.downloadInvoice(invoiceNumber);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to download invoice', severity: 'error' });
        }
    };

    const handleResendInvoice = async (invoiceNumber, e) => {
        if (e) e.stopPropagation();
        try {
            await invoicesAPI.resendInvoice(invoiceNumber);
            setSnackbar({ open: true, message: 'Invoice resent successfully', severity: 'success' });
            // Refresh the invoices list to update the lastEmailSentAt
            if (selectedDriver) {
                fetchDriverInvoices(selectedDriver.driverId);
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to resend invoice', severity: 'error' });
        }
    };

    const handleDriverClick = (driver) => {
        setSelectedDriver(driver);
        setView('invoices');
        fetchDriverInvoices(driver.driverId);
    };

    const handleInvoicesClick = () => {
        setView('drivers');
        fetchDriversWithInvoices();
    };

    const handleBack = () => {
        if (view === 'invoices') {
            setView('drivers');
            setSelectedDriver(null);
            setDriverInvoices([]);
        } else {
            setView('main');
            setDriversWithInvoices([]);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const renderMainView = () => (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Available Reports
            </Typography>
            <List>
                <ListItemButton onClick={handleInvoicesClick}>
                    <ListItemIcon>
                        <ReceiptIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                        primary="Driver Invoices"
                        secondary="View and manage invoices for drivers"
                    />
                </ListItemButton>
            </List>
        </Paper>
    );

    const renderDriversView = () => (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h6">
                    Drivers with Invoices
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : driversWithInvoices.length === 0 ? (
                <Alert severity="info">No invoices found</Alert>
            ) : (
                <List>
                    {driversWithInvoices.map((driver, index) => (
                        <React.Fragment key={driver.driverId}>
                            {index > 0 && <Divider />}
                            <ListItemButton onClick={() => handleDriverClick(driver)}>
                                <ListItemIcon>
                                    <FolderIcon color="primary" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={driver.driverName}
                                    secondary={`@${driver.driverUsername} • Last invoice: ${formatDate(driver.latestInvoiceDate)}`}
                                />
                                <Chip
                                    label={`${driver.invoiceCount} invoice${driver.invoiceCount !== 1 ? 's' : ''}`}
                                    color="primary"
                                    size="small"
                                />
                            </ListItemButton>
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Paper>
    );

    const renderInvoicesView = () => (
        <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <IconButton onClick={handleBack} sx={{ mr: 1 }}>
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h6">
                        {selectedDriver?.driverName}'s Invoices
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        @{selectedDriver?.driverUsername}
                    </Typography>
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : driverInvoices.length === 0 ? (
                <Alert severity="info">No invoices found for this driver</Alert>
            ) : (
                <List>
                    {driverInvoices.map((invoice, index) => (
                        <React.Fragment key={invoice.id}>
                            {index > 0 && <Divider />}
                            <ListItemButton
                                onClick={() => handleViewInvoice(invoice.invoiceNumber)}
                                sx={{
                                    py: 2,
                                    '&:hover': { backgroundColor: 'action.hover' }
                                }}
                            >
                                <ListItemIcon>
                                    <ReceiptIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                {invoice.invoiceNumber}
                                            </Typography>
                                            <Chip
                                                label={invoice.driverOwesCompany ? 'Driver Owes' : 'Company Owes'}
                                                color={invoice.driverOwesCompany ? 'warning' : 'success'}
                                                size="small"
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box component="span">
                                            <Typography variant="body2" component="span">
                                                {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                                            </Typography>
                                            <Typography variant="body2" component="span" sx={{ mx: 1 }}>•</Typography>
                                            <Typography variant="body2" component="span">
                                                {invoice.rideCount} rides
                                            </Typography>
                                            <Typography variant="body2" component="span" sx={{ mx: 1 }}>•</Typography>
                                            <Typography
                                                variant="body2"
                                                component="span"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: invoice.driverOwesCompany ? 'warning.main' : 'success.main'
                                                }}
                                            >
                                                {formatCurrency(Math.abs(invoice.netAmount))}
                                            </Typography>
                                            {invoice.emailSent && (
                                                <>
                                                    <Typography variant="body2" component="span" sx={{ mx: 1 }}>•</Typography>
                                                    <Typography variant="body2" component="span" color="text.secondary">
                                                        Emailed: {formatDateTime(invoice.lastEmailSentAt)}
                                                    </Typography>
                                                </>
                                            )}
                                        </Box>
                                    }
                                />
                                <Box sx={{ display: 'flex', gap: 0.5, ml: 2 }}>
                                    <Tooltip title="Download">
                                        <IconButton
                                            onClick={(e) => handleDownloadInvoice(invoice.invoiceNumber, e)}
                                            color="primary"
                                            size="small"
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Resend Invoice To Driver">
                                        <IconButton
                                            onClick={(e) => handleResendInvoice(invoice.invoiceNumber, e)}
                                            color="secondary"
                                            size="small"
                                        >
                                            <EmailIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </ListItemButton>
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Paper>
    );

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

                {/* Breadcrumbs */}
                {view !== 'main' && (
                    <Breadcrumbs sx={{ mb: 2 }}>
                        <Link
                            component="button"
                            variant="body1"
                            onClick={() => { setView('main'); setSelectedDriver(null); }}
                            underline="hover"
                            color="inherit"
                        >
                            Reports
                        </Link>
                        {view === 'drivers' && (
                            <Typography color="text.primary">Invoices</Typography>
                        )}
                        {view === 'invoices' && (
                            <>
                                <Link
                                    component="button"
                                    variant="body1"
                                    onClick={() => { setView('drivers'); setSelectedDriver(null); }}
                                    underline="hover"
                                    color="inherit"
                                >
                                    Invoices
                                </Link>
                                <Typography color="text.primary">{selectedDriver?.driverName}</Typography>
                            </>
                        )}
                    </Breadcrumbs>
                )}

                {/* Content */}
                {view === 'main' && renderMainView()}
                {view === 'drivers' && renderDriversView()}
                {view === 'invoices' && renderInvoicesView()}
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* PDF Viewer Dialog */}
            <Dialog
                open={pdfViewerOpen}
                onClose={handleClosePdfViewer}
                maxWidth={false}
                fullWidth
                PaperProps={{
                    sx: {
                        width: '90vw',
                        height: '90vh',
                        maxWidth: '1200px',
                        m: 2,
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'hidden'
                    }
                }}
                slotProps={{
                    backdrop: {
                        sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            cursor: 'pointer'
                        }
                    }
                }}
            >
                <DialogContent
                    sx={{
                        p: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        backgroundColor: 'transparent',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header with close button and actions */}
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            borderRadius: '8px 8px 0 0'
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ color: 'white', ml: 1 }}>
                            {viewingInvoiceNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Download">
                                <IconButton
                                    onClick={(e) => handleDownloadInvoice(viewingInvoiceNumber, e)}
                                    sx={{ color: 'white' }}
                                    size="small"
                                >
                                    <DownloadIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Resend Invoice To Driver">
                                <IconButton
                                    onClick={(e) => handleResendInvoice(viewingInvoiceNumber, e)}
                                    sx={{ color: 'white' }}
                                    size="small"
                                >
                                    <EmailIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Close">
                                <IconButton
                                    onClick={handleClosePdfViewer}
                                    sx={{ color: 'white' }}
                                    size="small"
                                >
                                    <CloseIcon />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>

                    {/* PDF Content */}
                    <Box
                        sx={{
                            flex: 1,
                            backgroundColor: '#525659',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                            borderRadius: '0 0 8px 8px'
                        }}
                    >
                        {pdfLoading ? (
                            <CircularProgress sx={{ color: 'white' }} />
                        ) : pdfUrl ? (
                            <iframe
                                src={pdfUrl}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none'
                                }}
                                title="Invoice PDF"
                            />
                        ) : (
                            <Typography color="white">Failed to load PDF</Typography>
                        )}
                    </Box>
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default Reports;
