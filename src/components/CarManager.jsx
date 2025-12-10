import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminService';
import './CarManager.css';

const CarManager = ({ driverId, driverName, onClose }) => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    vin: ''
  });

  useEffect(() => {
    loadCars();
  }, [driverId]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.cars.getByDriver(driverId);
      
      // Ensure data is always an array
      const carsArray = Array.isArray(data) ? data : [];
      
      setCars(carsArray);
    } catch (error) {
      console.error('Failed to load cars:', error);
      // Set empty array on error
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const carData = {
        ...formData,
        driverId: driverId,
        year: parseInt(formData.year)
      };

      if (editingCar) {
        await adminAPI.cars.update(editingCar.id, carData);
      } else {
        await adminAPI.cars.create(carData);
      }
      
      // Reload cars and reset form
      await loadCars();
      resetForm();
      
    } catch (error) {
      console.error('Failed to save car:', error);
      alert('Failed to save car. Please try again.');
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      make: car.make,
      model: car.model,
      year: car.year,
      color: car.color,
      licensePlate: car.licensePlate,
      vin: car.vin
    });
    setShowAddForm(true);
  };

  const handleDelete = async (car) => {
    if (window.confirm(`Are you sure you want to delete this ${car.make} ${car.model}?`)) {
      try {
        await adminAPI.cars.delete(car.id);
        await loadCars();
      } catch (error) {
        console.error('Failed to delete car:', error);
        alert('Failed to delete car. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      licensePlate: '',
      vin: ''
    });
    setEditingCar(null);
    setShowAddForm(false);
  };

  if (loading) {
    return <div className="loading">Loading cars...</div>;
  }

  return (
    <div className="car-manager">
      <div className="car-manager-header">
        <div className="header-info">
          <button onClick={onClose} className="back-btn">← Back to Drivers</button>
          <h2>Cars for {driverName}</h2>
        </div>
        <button 
          onClick={() => setShowAddForm(true)} 
          className="add-btn"
        >
          + Add Car
        </button>
      </div>

      {showAddForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingCar ? 'Edit Car' : 'Add New Car'}</h3>
              <button onClick={resetForm} className="close-btn">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="car-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => handleInputChange('make', e.target.value)}
                    placeholder="Toyota, Honda, Ford..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="Camry, Accord, Focus..."
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Year *</label>
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Color *</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    placeholder="Silver, White, Black..."
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>License Plate *</label>
                <input
                  type="text"
                  value={formData.licensePlate}
                  onChange={(e) => handleInputChange('licensePlate', e.target.value)}
                  placeholder="ABC123"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>VIN</label>
                <input
                  type="text"
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value)}
                  placeholder="17-digit Vehicle Identification Number"
                  maxLength="17"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingCar ? 'Update' : 'Add Car'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="cars-list">
        {!Array.isArray(cars) || cars.length === 0 ? (
          <div className="empty-state">
            <p>No cars found for this driver.</p>
            <button onClick={() => setShowAddForm(true)} className="add-first-car-btn">
              Add First Car
            </button>
          </div>
        ) : (
          <div className="cars-grid">
            {cars.map(car => (
              <div key={car.id} className="car-card">
                <div className="car-info">
                  <h4>{car.year} {car.make} {car.model}</h4>
                  <p><strong>Color:</strong> {car.color}</p>
                  <p><strong>License Plate:</strong> {car.licensePlate}</p>
                  {car.vin && <p><strong>VIN:</strong> {car.vin}</p>}
                </div>
                <div className="car-actions">
                  <button onClick={() => handleEdit(car)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(car)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarManager;