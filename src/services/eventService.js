
const Event = require('../models/Event');

class EventService {
  /**
   * Log an event asynchronously.
   * This method is "fire and forget" to avoid blocking the main request loop.
   */
  async log(eventType, entityType, entityId, userId = null, metadata = {}) {
    try {
      // In a real scaled architecture, this would push to a message queue (RabbitMQ/Kafka)
      // For now, we write directly to Mongo asynchronously
      await Event.create({
        eventType,
        entityType,
        entityId,
        userId,
        metadata
      });
    } catch (error) {
      // access logs or silent fail - do not crash application
      console.error(`Event Tracking Error [${eventType}]:`, error.message);
    }
  }

  /**
   * Get event count for a specific entity in a time window
   */
  async getEventCount(eventType, entityId, minutesAgo = 60) {
    const fromDate = new Date(Date.now() - minutesAgo * 60 * 1000);
    return await Event.countDocuments({
      eventType,
      entityId,
      createdAt: { $gte: fromDate }
    });
  }
}

module.exports = new EventService();
