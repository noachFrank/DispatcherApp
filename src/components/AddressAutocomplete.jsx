import React, { useRef, useEffect, useState } from 'react';
import { TextField, Box, List, ListItemButton, ListItemIcon, ListItemText, Paper, CircularProgress } from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import { useGoogleMaps } from './GoogleMapsProvider';
import { AUTOCOMPLETE_OPTIONS } from '../config/googleMapsConfig';

/**
 * AddressAutocomplete Component
 * 
 * A text input that shows Google Places address suggestions as you type.
 * Shows a dropdown list of matching addresses below the input field.
 * 
 * Props:
 * - label: The label for the text field
 * - value: Current address value
 * - onChange: Called when user selects an address - receives (formattedAddress, placeDetails)
 * - onInputChange: Called when user types - receives the raw input value
 * - placeholder: Placeholder text
 * - error: Boolean to show error state
 * - helperText: Helper/error text to display
 * - required: Boolean for required field
 * - disabled: Boolean to disable the input
 */
const AddressAutocomplete = ({
    label,
    value,
    onChange,
    onInputChange,
    placeholder = 'Enter address...',
    error = false,
    helperText = '',
    required = false,
    disabled = false,
    margin = 'normal',
    fullWidth = true,
    size = 'medium'
}) => {
    const { isLoaded } = useGoogleMaps();
    const [inputValue, setInputValue] = useState(value || '');
    const [predictions, setPredictions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const autocompleteService = useRef(null);
    const placesService = useRef(null);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Initialize Google services when API is loaded
    useEffect(() => {
        if (isLoaded && window.google) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            // Create a dummy div for PlacesService (required by Google API)
            const dummyDiv = document.createElement('div');
            placesService.current = new window.google.maps.places.PlacesService(dummyDiv);
        }
    }, [isLoaded]);

    // Update input value when external value changes
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch predictions when user types
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Notify parent of raw input change
        if (onInputChange) {
            onInputChange(newValue);
        }

        // Only search if we have at least 3 characters
        if (newValue.length < 3) {
            setPredictions([]);
            setIsOpen(false);
            return;
        }

        if (!autocompleteService.current) {
            console.warn('Google Autocomplete service not initialized');
            return;
        }

        setIsLoading(true);

        autocompleteService.current.getPlacePredictions(
            {
                input: newValue,
                ...AUTOCOMPLETE_OPTIONS
            },
            (results, status) => {
                setIsLoading(false);

                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    setPredictions(results);
                    setIsOpen(true);
                } else {
                    setPredictions([]);
                    setIsOpen(false);
                }
            }
        );
    };

    // Handle selection of a prediction
    const handleSelect = (prediction) => {
        // Get detailed place information
        if (placesService.current) {
            placesService.current.getDetails(
                {
                    placeId: prediction.place_id,
                    fields: ['formatted_address', 'geometry', 'address_components']
                },
                (place, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                        const formattedAddress = place.formatted_address;
                        setInputValue(formattedAddress);
                        setPredictions([]);
                        setIsOpen(false);

                        // Call onChange with the full place details
                        if (onChange) {
                            onChange(formattedAddress, {
                                placeId: prediction.place_id,
                                formattedAddress: formattedAddress,
                                lat: place.geometry?.location?.lat(),
                                lng: place.geometry?.location?.lng(),
                                addressComponents: place.address_components
                            });
                        }
                    }
                }
            );
        } else {
            // Fallback if PlacesService isn't available
            setInputValue(prediction.description);
            setPredictions([]);
            setIsOpen(false);
            if (onChange) {
                onChange(prediction.description, { placeId: prediction.place_id });
            }
        }
    };

    // Show loading state if Google Maps isn't loaded yet
    if (!isLoaded) {
        return (
            <TextField
                fullWidth={fullWidth}
                label={label}
                value={inputValue}
                placeholder="Loading Google Maps..."
                disabled
                margin={margin}
                size={size}
                InputProps={{
                    endAdornment: <CircularProgress size={20} />
                }}
            />
        );
    }

    return (
        <Box ref={containerRef} sx={{ position: 'relative' }}>
            <TextField
                inputRef={inputRef}
                fullWidth={fullWidth}
                label={label}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => predictions.length > 0 && setIsOpen(true)}
                placeholder={placeholder}
                error={error}
                helperText={helperText}
                required={required}
                disabled={disabled}
                margin={margin}
                size={size}
                InputProps={{
                    endAdornment: isLoading ? <CircularProgress size={20} /> : null
                }}
            />

            {/* Dropdown with predictions */}
            {isOpen && predictions.length > 0 && (
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1300,
                        maxHeight: 300,
                        overflow: 'auto',
                        mt: 0.5
                    }}
                >
                    <List dense>
                        {predictions.map((prediction) => (
                            <ListItemButton
                                key={prediction.place_id}
                                onClick={() => handleSelect(prediction)}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 36 }}>
                                    <LocationIcon color="action" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary={prediction.structured_formatting?.main_text || prediction.description}
                                    secondary={prediction.structured_formatting?.secondary_text}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                </Paper>
            )}
        </Box>
    );
};

export default AddressAutocomplete;
