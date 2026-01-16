// Data Sync Utility for Real-Time Synchronization
// Uses LocalStorage events for cross-tab communication (works without WebSocket)

// Storage key for sync notifications
const SYNC_NOTIFICATION_KEY = 'glen_sync_notification';
const LAST_SYNC_KEY = 'glen_last_sync_time';

/**
 * Trigger a sync notification to all open tabs
 * Call this after admin creates/updates tickets or technicians
 */
export const triggerDataSync = (
  type: 'ticket_created' | 'ticket_updated' | 'technician_added' | 'general_refresh',
  data?: { ticketId?: string; technicianId?: string }
): void => {
  const notification = {
    type,
    timestamp: Date.now(),
    data,
  };
  localStorage.setItem(SYNC_NOTIFICATION_KEY, JSON.stringify(notification));
  // Immediately dispatch a storage event so current tab also reacts
  window.dispatchEvent(new StorageEvent('storage', { key: SYNC_NOTIFICATION_KEY }));
};

/**
 * Listen for sync notifications from other tabs
 * Returns cleanup function
 */
export const listenForDataSync = (
  onSync: (notification: { type: string; timestamp: number; data?: any }) => void
): (() => void) => {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === SYNC_NOTIFICATION_KEY && event.newValue) {
      try {
        const notification = JSON.parse(event.newValue);
        // Ignore events older than 5 seconds to prevent loops
        if (Date.now() - notification.timestamp < 5000) {
          onSync(notification);
        }
      } catch (e) {
        console.error('Failed to parse sync notification:', e);
      }
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
};

/**
 * Get timestamp of last sync
 */
export const getLastSyncTime = (): number | null => {
  const stored = localStorage.getItem(LAST_SYNC_KEY);
  return stored ? parseInt(stored, 10) : null;
};

/**
 * Update last sync timestamp
 */
export const updateLastSyncTime = (): void => {
  localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
};

/**
 * Force immediate sync by triggering refresh
 */
export const forceRefresh = (): void => {
  triggerDataSync('general_refresh');
  window.location.reload();
};
