import React, { useState, useEffect } from 'react';
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Saved Credit Card Details</h3>
          <button onClick={onClose} style={{ fontSize: '20px', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
        </div>

        {cardEntries.length === 0 ? (
          <p>No credit card details saved.</p>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <button onClick={handleClearAll} style={{
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>
                Clear All
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Array.isArray(cardEntries) && cardEntries.map(([key, card]) => (
                <div key={key} style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '15px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div><strong>Card Key:</strong> {key}</div>
                  <div><strong>Last 4 digits:</strong> ****{card.ccNumber.slice(-4)}</div>
                  <div><strong>Expiry:</strong> {card.expiryDate}</div>
                  <div><strong>Zip Code:</strong> {card.zipCode}</div>
                  <div><strong>Saved:</strong> {new Date(card.savedAt).toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    <em>CVV is stored but not displayed for security</em>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SavedCreditCards;