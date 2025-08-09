// src/utils/rawbt.js

/**
 * Generates a receipt string in the RawBT command format.
 * @param {object} saleData - The data for the sale.
 * @param {object} companyInfo - Information about the company.
 * @returns {string} The formatted receipt string.
 */
export const generateRawBtReceipt = (saleData, companyInfo) => {
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB');
    const formattedTime = now.toLocaleTimeString('en-US', { hour12: true });

    // Center alignment tag: [C]
    // Left alignment tag: [L]
    // Bold tag: <B>
    // Double height tag: <H2>
    // QR Code tag: <qrcode>
    
    let receipt = '';
    receipt += '[C]<b><H2>SALES RECEIPT</H2></b>\n';
    receipt += `[C]<b>${companyInfo.name}</b>\n`;
    receipt += `[C]${companyInfo.address}\n`;
    receipt += `[C]Phone: ${companyInfo.phone}\n`;
    receipt += '[C]================================\n';
    receipt += `[L]Receipt No: [R]${saleData.receiptNumber || 'N/A'}\n`;
    receipt += `[L]Date: ${formattedDate} [R]Time: ${formattedTime}\n`;
    receipt += `[L]Cashier: [R]${saleData.cashierEmail}\n`;
    receipt += '[C]--------------------------------\n';
    receipt += '[L]<b>ITEM</b>[R]<b>AMOUNT</b>\n';
    receipt += `[L]LPG Gas (${saleData.kgSold} kg)[R]${saleData.revenue.toLocaleString()}\n`;
    receipt += '[C]--------------------------------\n';
    receipt += `[L]<b><H2>TOTAL</H2></b>[R]<b><H2>NGN ${saleData.revenue.toLocaleString()}</H2></b>\n`;
    receipt += '[C]================================\n';
    receipt += `[C]Payment Method: ${saleData.paymentMethod}\n\n`;
    receipt += '[C]Thank you for your patronage!\n';
    receipt += `[C]<qrcode>${companyInfo.website || ''}</qrcode>\n\n\n`;

    return receipt;
};

/**
 * Creates a shareable link for the RawBT app.
 * @param {string} receiptText - The formatted receipt text.
 * @returns {string} The RawBT link.
 */
export const createRawBtLink = (receiptText) => {
    const base64String = btoa(receiptText);
    return `rawbt:${base64String}`;
};
