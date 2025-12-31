export const formatTime = (dateString) => {
    if (!dateString) return '--';
    try {
        const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcString);
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
        const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcString);
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
        const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
        const date = new Date(utcString);
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
 * Format a TimeOnly string (HH:mm:ss) to 12-hour format (e.g., "2:30 PM")
 */
export const formatTimeOnly = (timeString) => {
    if (!timeString) return '--';
    try {
        // Parse time string (format: "HH:mm:ss" or "HH:mm")
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12; // Convert 0 to 12, keep 1-11, convert 13-23
        const minuteStr = minutes.toString().padStart(2, '0');
        return `${hour12}:${minuteStr} ${period}`;
    } catch {
        return '--';
    }
};

/**
 * Format a date string for day label (Today, Tomorrow, or weekday name)
 */
export const formatDayLabel = (dateString) => {
    if (!dateString) return '';

    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const scheduledDate = new Date(utcString);
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
