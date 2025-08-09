// =======================================================================
// src/api/v1/inventory/inventory.service.js (NEW FILE)
// =======================================================================
const StockIn = require('../../../models/stockIn.model');

const createStockIn = async (stockInData, user) => {
    const stockIn = new StockIn({
        ...stockInData,
        loggedBy: { uid: user.id, email: user.email },
    });
    await stockIn.save();
    return stockIn.toObject();
};

const getStockIns = async () => {
    const records = await StockIn.find({}).sort({ purchaseDate: -1 });
    return records.map(rec => rec.toObject());
};

module.exports = { createStockIn, getStockIns };