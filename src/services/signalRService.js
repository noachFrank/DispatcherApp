import * as signalR from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.messageCallbacks = [];
    this.newCallCallbacks = [];
    this.callUpdateCallbacks = [];
    this.driverLocationCallbacks = [];
    this.driverLocationRemovedCallbacks = [];
  }

  async initialize(hubUrl = 'http://192.168.1.41:5062/hubs/dispatch') {

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .build();

    // Set up driver location listeners
    this.connection.on('DriverLocationUpdated', (location) => {
      this.driverLocationCallbacks.forEach(cb => cb(location));
    });

    this.connection.on('DriverLocationRemoved', (driverId) => {
      this.driverLocationRemovedCallbacks.forEach(cb => cb(driverId));
    });

    try {
      await this.connection.start();
      console.log('✅ SignalR Connected - Real-time updates enabled');
    } catch (err) {
      alert('Failed to connect to the server, please contact support.');

      console.warn('⚠️  SignalR not available - using HTTP polling fallback');
      console.log('To enable real-time features, implement the SignalR hub on your server');
      this.connection = null; // Clear connection on failure
    }
  }

  async stop() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      this.messageCallbacks = [];
      this.newCallCallbacks = [];
      this.callUpdateCallbacks = [];
      this.driverLocationCallbacks = [];
      this.driverLocationRemovedCallbacks = [];
    }
  }

  // Message methods

  /**
   * Send a message from dispatcher to a specific driver
   * Uses the DispatcherSendsMessage socket which:
   * 1. Saves the message to database
   * 2. Sends to driver if connected
   * 3. Notifies other dispatchers
   */
  async dispatcherSendsMessage(dispatcherId, driverId, message, rideId = null) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('DispatcherSendsMessage', {
        DispatcherId: dispatcherId,
        DriverId: driverId,
        Message: message,
        RideId: rideId
      });
    } catch (err) {
      console.error('Error sending message to driver:', err);
      throw err;
    }
  }

  // Legacy method - keeping for backward compatibility
  async sendMessageToDriver(driverId, message, rideId = null) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('SendMessageToDriver', {
        driverId,
        message,
        rideId,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error sending message to driver:', err);
      throw err;
    }
  }

  async sendMessageToDispatcher(driverId, message, rideId = null) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('SendMessageToDispatcher', {
        fromDriverId: driverId,
        message,
        rideId,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error sending message to dispatcher:', err);
      throw err;
    }
  }

  onMessageReceived(callback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Call notification methods
  async broadcastNewCall(call) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('NewCallCreated', call);
    } catch (err) {
      console.error('Error broadcasting new call:', err);
      throw err;
    }
  }

  async notifyCallUpdate(callId, status, assignedDriverId = null) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('NotifyCallUpdate', {
        callId,
        status,
        assignedDriverId,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error notifying call update:', err);
      throw err;
    }
  }

  onNewCallReceived(callback) {
    this.newCallCallbacks.push(callback);
    return () => {
      this.newCallCallbacks = this.newCallCallbacks.filter(cb => cb !== callback);
    };
  }

  onCallUpdated(callback) {
    this.callUpdateCallbacks.push(callback);
    return () => {
      this.callUpdateCallbacks = this.callUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Driver location tracking methods
  onDriverLocationUpdated(callback) {
    this.driverLocationCallbacks.push(callback);

    return () => {
      this.driverLocationCallbacks = this.driverLocationCallbacks.filter(cb => cb !== callback);
    };
  }

  onDriverLocationRemoved(callback) {
    this.driverLocationRemovedCallbacks.push(callback);

    return () => {
      this.driverLocationRemovedCallbacks = this.driverLocationRemovedCallbacks.filter(cb => cb !== callback);
    };
  }

  async getAllDriverLocations() {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      return await this.connection.invoke('GetAllDriverLocations');
    } catch (err) {
      console.error('Error getting driver locations:', err);
      throw err;
    }
  }

  // Driver registration (for tracking active drivers)
  async registerDriver(driverId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('RegisterDriver', driverId);
    } catch (err) {
      console.error('Error registering driver:', err);
      throw err;
    }
  }

  async unregisterDriver(driverId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return; // Don't throw if disconnecting
    }

    try {
      await this.connection.invoke('UnregisterDriver', driverId);
    } catch (err) {
      console.error('Error unregistering driver:', err);
    }
  }

  async registerDispatcher(dispatcherId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('RegisterDispatcher', dispatcherId);
    } catch (err) {
      console.error('Error registering dispatcher:', err);
      throw err;
    }
  }

  // Reassign a call - removes driver and makes call available again
  async reassignCall(rideId) {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      throw new Error('SignalR not connected');
    }

    try {
      await this.connection.invoke('CallDriverCancelled', rideId);
    } catch (err) {
      console.error('Error reassigning call:', err);
      throw err;
    }
  }

  isConnected() {
    return this.connection && this.connection.state === signalR.HubConnectionState.Connected;
  }
}

// Export singleton instance
const signalRService = new SignalRService();
export default signalRService;
