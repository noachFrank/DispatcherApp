import React, { useState, useEffect } from 'react';
import { ridesAPI, driversAPI } from '../services/dashboardService';
import './DashboardMetrics.css';

const DashboardMetrics = ({ onMetricClick }) => {
  const [metrics, setMetrics] = useState({
    assignedRides: [],
    ridesInProgress: [],
    futureRides: [],
    todaysRides: [],
    activeDrivers: [],
    driversCurrentlyDriving: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assignedRides, ridesInProgress, futureRides, todaysRides, activeDrivers, driversCurrentlyDriving] = await Promise.all([
        ridesAPI.getAssigned(),
        ridesAPI.getInProgress(),
        ridesAPI.getFuture(),
        ridesAPI.getToday(),
        driversAPI.getActive(),
        driversAPI.getDriving()
      ]);

      setMetrics({
        assignedRides,
        ridesInProgress,
        futureRides,
        todaysRides,
        activeDrivers,
        driversCurrentlyDriving
      });
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMetricClick = (metricType, data) => {
    onMetricClick(metricType, data);
  };

  if (loading) {
    return (
      <div className="dashboard-metrics">
        <div className="loading">Loading dashboard metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-metrics">
        <div className="error">{error}</div>
        <button onClick={loadMetrics} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard-metrics">
      <h2>Dashboard Overview</h2>
      
      <div className="metrics-grid">
        {/* First Row - Current Rides */}
        <div 
          className="metric-card rides-assigned"
          onClick={() => handleMetricClick('assignedRides', metrics.assignedRides)}
        >
          <div className="metric-header">
            <h3>Assigned Rides</h3>
            <span className="metric-count">{metrics.assignedRides.length}</span>
          </div>
          <div className="metric-description">
            Rides assigned to drivers but not yet started
          </div>
        </div>

        <div 
          className="metric-card rides-progress"
          onClick={() => handleMetricClick('ridesInProgress', metrics.ridesInProgress)}
        >
          <div className="metric-header">
            <h3>Rides in Progress</h3>
            <span className="metric-count">{metrics.ridesInProgress.length}</span>
          </div>
          <div className="metric-description">
            Rides currently being driven
          </div>
        </div>

        {/* Second Row - Scheduled & Today's Rides */}
        <div 
          className="metric-card rides-future"
          onClick={() => handleMetricClick('futureRides', metrics.futureRides)}
        >
          <div className="metric-header">
            <h3>Future Rides</h3>
            <span className="metric-count">{metrics.futureRides.length}</span>
          </div>
          <div className="metric-description">
            Scheduled rides for future dates
          </div>
        </div>

        <div 
          className="metric-card rides-today"
          onClick={() => handleMetricClick('todaysRides', metrics.todaysRides)}
        >
          <div className="metric-header">
            <h3>Today's Rides</h3>
            <span className="metric-count">{metrics.todaysRides.length}</span>
          </div>
          <div className="metric-description">
            All rides created or scheduled for today
          </div>
        </div>

        {/* Third Row - Drivers */}
        <div 
          className="metric-card drivers-active"
          onClick={() => handleMetricClick('activeDrivers', metrics.activeDrivers)}
        >
          <div className="metric-header">
            <h3>Active Drivers</h3>
            <span className="metric-count">{metrics.activeDrivers.length}</span>
          </div>
          <div className="metric-description">
            Drivers currently available for dispatch
          </div>
        </div>

        <div 
          className="metric-card drivers-driving"
          onClick={() => handleMetricClick('driversCurrentlyDriving', metrics.driversCurrentlyDriving)}
        >
          <div className="metric-header">
            <h3>Drivers Currently Driving</h3>
            <span className="metric-count">{metrics.driversCurrentlyDriving.length}</span>
          </div>
          <div className="metric-description">
            Drivers currently on active rides
          </div>
        </div>
      </div>

      <div className="refresh-section">
        <button onClick={loadMetrics} className="refresh-btn">
          Refresh Metrics
        </button>
      </div>
    </div>
  );
};

export default DashboardMetrics;