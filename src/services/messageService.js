import { apiRequest } from '../config/apiConfig';
import config from '../config/apiConfig';

class MessageService {
  // Get messages for a specific driver (today's messages first)
  async getDriverMessages(driverId, todayOnly = true) {
    try {
      const endpoint = todayOnly 
        ? config.ENDPOINTS.MESSAGES.GET_TODAY_MESSAGES
        : config.ENDPOINTS.MESSAGES.GET_ALL_MESSAGES;
      
      return await apiRequest(`${endpoint}/${driverId}`, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to get driver messages:', error);
      throw error;
    }
  }

  // Get full message history for a driver
  async getDriverMessageHistory(driverId) {
    return this.getDriverMessages(driverId, false);
  }

  // Send message to a specific driver using Communication structure
  async sendMessageToDriver(driverId, message, callId = null) {
    try {
      const communication = {
        message: callId ? `Call #${callId}: ${message}` : message,
        driverId: parseInt(driverId),
        from: 'dispatcher',
        date: new Date().toISOString(),
        read: false
      };

      return await apiRequest(config.ENDPOINTS.MESSAGES.SEND_MESSAGE, {
        method: 'POST',
        body: JSON.stringify(communication)
      });
    } catch (error) {
      console.error('Failed to send message to driver:', error);
      throw error;
    }
  }

  // Get all communications (for dispatcher view)
  async getAllCommunications() {
    try {
      return await apiRequest(config.ENDPOINTS.MESSAGES.GET_ALL_MESSAGES, {
        method: 'GET'
      });
    } catch (error) {
      console.error('Failed to get all communications:', error);
      throw error;
    }
  }

  // Mark specific messages as read
  async markMessagesAsRead(messageIds) {
    try {
      return await apiRequest(config.ENDPOINTS.MESSAGES.MARK_READ, {
        method: 'POST',
        body: JSON.stringify(messageIds)
      });
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
      throw error;
    }
  }

  // Get unread message count for a specific driver
  async getUnreadCount(driverId) {
    try {
      const result = await apiRequest(`${config.ENDPOINTS.MESSAGES.GET_UNREAD_COUNT}/${driverId}`, {
        method: 'GET'
      });
      return result.count || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  // Driver ride management functions using API config endpoints
  async assignCallToDriver(rideId, driverId) {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.ASSIGN, {
        method: 'POST',
        body: JSON.stringify({
          rideId: parseInt(rideId),
          driverId: parseInt(driverId)
        })
      });
    } catch (error) {
      console.error('Failed to assign ride to driver:', error);
      throw error;
    }
  }

  async updateCallStatus(rideId, status) {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.UPDATE_STATUS, {
        method: 'PUT',
        body: JSON.stringify({ 
          rideId: parseInt(rideId),
          status 
        })
      });
    } catch (error) {
      console.error('Failed to update ride status:', error);
      throw error;
    }
  }

  async cancelCall(rideId, reason = '') {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.CANCEL, {
        method: 'POST',
        body: JSON.stringify({ 
          rideId: parseInt(rideId),
          reason 
        })
      });
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      throw error;
    }
  }

  async reassignCall(rideId, newDriverId, reason = '') {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.REASSIGN, {
        method: 'POST',
        body: JSON.stringify({ 
          rideId: parseInt(rideId),
          newDriverId: parseInt(newDriverId),
          reason 
        })
      });
    } catch (error) {
      console.error('Failed to reassign ride:', error);
      throw error;
    }
  }

  // New pickup and dropoff functions
  async pickupCustomer(rideId, driverId, location) {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.PICKUP, {
        method: 'POST',
        body: JSON.stringify({
          rideId: parseInt(rideId),
          driverId: parseInt(driverId),
          location,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to record pickup:', error);
      throw error;
    }
  }

  async dropoffCustomer(rideId, driverId, location) {
    try {
      return await apiRequest(config.ENDPOINTS.RIDES.DROPOFF, {
        method: 'POST',
        body: JSON.stringify({
          rideId: parseInt(rideId),
          driverId: parseInt(driverId),
          location,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Failed to record dropoff:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService();