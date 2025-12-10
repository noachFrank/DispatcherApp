// Local storage utilities for credit card details
const CC_STORAGE_KEY = 'dispatcher_cc_details';

export const creditCardStorage = {
  // Save credit card details to localStorage
  save: (ccDetails) => {
    try {
      const existingCards = creditCardStorage.getAll();
      const cardKey = `${ccDetails.ccNumber.slice(-4)}_${ccDetails.expiryDate}`;
      existingCards[cardKey] = {
        ...ccDetails,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(CC_STORAGE_KEY, JSON.stringify(existingCards));
      return cardKey;
    } catch (error) {
      console.error('Failed to save credit card details:', error);
      return null;
    }
  },

  // Get all saved credit card details
  getAll: () => {
    try {
      const stored = localStorage.getItem(CC_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to retrieve credit card details:', error);
      return {};
    }
  },

  // Get a specific credit card by key
  get: (cardKey) => {
    try {
      const allCards = creditCardStorage.getAll();
      return allCards[cardKey] || null;
    } catch (error) {
      console.error('Failed to retrieve specific credit card:', error);
      return null;
    }
  },

  // Clear all saved credit cards
  clear: () => {
    try {
      localStorage.removeItem(CC_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear credit card details:', error);
    }
  }
};