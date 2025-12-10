/**
 * Centralized date/time formatting utilities
 * All date display functions should use these helpers to ensure consistent formatting
 */

/**
 * Format a date string to display time only (e.g., "2:30 PM")
 */
export const formatTime = (dateString) => {
    if (!dateString) return '--';
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return '--';
    }
};

/**
 * Format a date string to display date and time (e.g., "Dec 4, 2:30 PM")
 */
export const formatDateTime = (dateString) => {
    if (!dateString) return '--';
    try {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return '--';
    }
};

/**
 * Format a date string to display date only (e.g., "Dec 4, 2025")
 */
export const formatDate = (dateString) => {
    if (!dateString) return '--';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return '--';
    }
};

/**
 * Format a date string for day label (Today, Tomorrow, or weekday name)
 */
export const formatDayLabel = (dateString) => {
    if (!dateString) return '';

    const scheduledDate = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isSameDay = (d1, d2) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

    if (isSameDay(scheduledDate, today)) {
        return 'Today';
    } else if (isSameDay(scheduledDate, tomorrow)) {
        return 'Tomorrow';
    } else {
        return scheduledDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
};
