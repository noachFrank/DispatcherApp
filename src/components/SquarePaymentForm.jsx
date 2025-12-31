import { useState, useEffect } from 'react';
import { Box, TextField, Alert, CircularProgress } from '@mui/material';

/**
 * SquarePaymentForm - Credit Card Tokenization Component
 * 
 * This component uses Square Web Payments SDK to securely collect credit card info
 * and tokenize it (convert to a secure token) without your server ever touching raw card data.
 * 
 * HOW IT WORKS:
 * 1. Square SDK creates a secure iframe for card input
 * 2. User enters card details (card never touches your server)
 * 3. Square converts card to a token (e.g., "cnon:card-abc123")
 * 4. Token is passed to parent component via onTokenGenerated callback
 * 5. Parent component saves token with the ride data
 * 
 * IMPORTANT: You MUST set your Square Application ID in environment config!
 */

const SquarePaymentForm = ({ onTokenGenerated, onError }) => {
    const [payments, setPayments] = useState(null);
    const [card, setCard] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cardholderName, setCardholderName] = useState('');

    // ⚠️ REPLACE THIS WITH YOUR SQUARE APPLICATION ID ⚠️
    // Get this from: https://developer.squareup.com/apps
    // Sandbox App ID looks like: sandbox-sq0idb-xxxxx
    // Production App ID looks like: sq0idp-xxxxx
    const SQUARE_APPLICATION_ID = 'sandbox-sq0idb--YpQgluD9h8KuPogEWEhPQ';
    const SQUARE_LOCATION_ID = 'LEGVMSFC7THW5';

    useEffect(() => {
        // First, check if Square SDK is loaded
        if (!window.Square) {
            setError('Square SDK failed to load. Please refresh the page.');
            setIsLoading(false);
            return;
        }

        // Set loading to false first so the card-container renders
        setIsLoading(false);
    }, []);

    // Second effect: Initialize Square after container is rendered
    useEffect(() => {
        if (isLoading || payments) {
            return; // Don't initialize if still loading or already initialized
        }

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            initializeSquare();
        }, 100);

        return () => clearTimeout(timer);
    }, [isLoading, payments]);

    const initializeSquare = async () => {
        try {
            console.log('🔷 Initializing Square Payments...');

            const container = document.getElementById('card-container');
            if (!container) {
                console.error('❌ card-container element not found');
                setError('Payment form container not ready');
                return;
            }

            // Initialize Square Payments
            const paymentsInstance = window.Square.payments(
                SQUARE_APPLICATION_ID,
                SQUARE_LOCATION_ID
            );

            setPayments(paymentsInstance);

            // Create card payment form
            const cardInstance = await paymentsInstance.card();
            await cardInstance.attach('#card-container');

            console.log('✅ Square Card Form initialized');
            setCard(cardInstance);
        } catch (err) {
            console.error('❌ Failed to initialize Square:', err);
            setError('Failed to load payment form. Please refresh the page.');

            if (onError) {
                onError(err.message || 'Failed to initialize payment form');
            }
        }
    };

    const tokenizeCard = async () => {
        if (!card) {
            const error = 'Payment form not initialized';
            setError(error);
            if (onError) onError(error);
            return null;
        }

        if (!cardholderName.trim()) {
            setError('Please enter cardholder name');
            return null;
        }

        try {
            console.log('💳 Tokenizing card...');
            setError(null);

            const result = await card.tokenize();

            if (result.status === 'OK') {
                console.log('✅ Card tokenized successfully');
                console.log('Token:', result.token);

                // Pass token to parent component
                if (onTokenGenerated) {
                    onTokenGenerated(result.token, cardholderName);
                }

                return result.token;
            } else {
                const errorMessage = result.errors?.[0]?.message || 'Unable to process card';
                console.error('❌ Tokenization failed:', errorMessage);
                setError(errorMessage);

                if (onError) {
                    onError(errorMessage);
                }

                return null;
            }
        } catch (err) {
            const errorMessage = err.message || 'An error occurred processing the card';
            console.error('❌ Tokenization error:', err);
            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }

            return null;
        }
    };

    // Expose tokenize function to parent via ref or callback
    useEffect(() => {
        if (card) {
            // Make tokenize function available globally (for parent to call)
            window.squareTokenizeCard = tokenizeCard;
            console.log('✅ Square tokenization function registered');
        }

        return () => {
            // Clean up on unmount
            if (window.squareTokenizeCard) {
                delete window.squareTokenizeCard;
            }
        };
    }, [card, cardholderName]);

    return (
        <Box sx={{ my: 2 }}>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {SQUARE_APPLICATION_ID === 'sandbox-sq0idb--YpQgluD9h8KuPogEWEhPQ' && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    ⚠️ Square Application ID not configured!
                    Please update SQUARE_APPLICATION_ID in SquarePaymentForm.jsx
                </Alert>
            )}

            <TextField
                fullWidth
                label="Cardholder Name"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="John Doe"
                required
                disabled={!card}
            />

            {/* Square Card Form Container - Square SDK renders card inputs here */}
            <Box
                id="card-container"
                sx={{
                    border: '1px solid #ccc',
                    borderRadius: 1,
                    padding: 2,
                    minHeight: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '& iframe': {
                        border: 'none',
                        width: '100%'
                    }
                }}
            >
                {!card && !error && (
                    <CircularProgress size={24} />
                )}
            </Box>
        </Box>
    );
};

export default SquarePaymentForm;
