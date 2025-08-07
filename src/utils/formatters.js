// src/utils/formatters.js
export const formatCurrency = (amount, currency = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
    }).format(amount);
};

export const formatDate = (date) => {
    if (!date) return '';
    // Handles both Firebase Timestamps and JS Date objects
    const dateObj = date.toDate ? date.toDate() : date;
    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(dateObj);
};
