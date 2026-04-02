import { PubSub } from "../util/pubSub";

export type Notification = {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

/**
 * NotificationManager - Singleton Pattern
 * Manages notification state and provides a simplified interface (Facade Pattern)
 * for showing notifications across the application
 */
class NotificationManager {
  private static instance: NotificationManager;
  private pubsub: PubSub;

  private constructor(pubsub: PubSub) {
    this.pubsub = pubsub;
  }

  /**
   * Get singleton instance of NotificationManager
   */
  static getInstance(pubsub: PubSub): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager(pubsub);
    }
    return NotificationManager.instance;
  }

  /**
   * Facade method to show notification with simplified interface
   */
  show(message: string, type: Notification['type'] = 'info', duration: number = 3000) {
    const notification: Notification = {
      id: `notification-${Date.now()}-${Math.random()}`,
      message,
      type,
      duration
    };

    // Publish notification event using PubSub pattern
    this.pubsub.publish('notification/show', notification);
  }

  /**
   * Convenience methods for different notification types
   */
  success(message: string, duration?: number) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number) {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number) {
    this.show(message, 'warning', duration);
  }

  /**
   * Dismiss a specific notification
   */
  dismiss(id: string) {
    this.pubsub.publish('notification/dismiss', id);
  }
}

export default NotificationManager;
