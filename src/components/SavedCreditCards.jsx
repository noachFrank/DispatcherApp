import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Chip,
  IconButton,
  Alert
} from '@mui/material';
import { Close as CloseIcon, CreditCard as CreditCardIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { creditCardStorage } from '../utils/creditCardStorage';

const SavedCreditCards = ({ onClose }) => {
  const [savedCards, setSavedCards] = useState({});

  useEffect(() => {
    setSavedCards(creditCardStorage.getAll());
  }, []);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all saved credit card details?')) {
      creditCardStorage.clear();
      setSavedCards({});
    }
  };

  const cardEntries = Object.entries(savedCards);

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <CreditCardIcon />
            <Typography variant="h6">Saved Credit Card Details</Typography>
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {cardEntries.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No credit card details saved.
          </Alert>
        ) : (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Button
                onClick={handleClearAll}
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
              >
                Clear All
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Array.isArray(cardEntries) && cardEntries.map(([key, card]) => (
                <Card key={key} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="subtitle2" color="primary">
                        <strong>Card Key:</strong> {key}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Last 4 digits:</strong> ****{card.ccNumber.slice(-4)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Expiry:</strong> {card.expiryDate}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Zip Code:</strong> {card.zipCode}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Saved:</strong> {new Date(card.savedAt).toLocaleString()}
                      </Typography>
                      <Chip
                        label="CVV is stored but not displayed for security"
                        size="small"
                        variant="outlined"
                        color="warning"
                        sx={{ mt: 1, alignSelf: 'flex-start' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SavedCreditCards;