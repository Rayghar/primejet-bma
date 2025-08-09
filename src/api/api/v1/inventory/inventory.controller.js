// =======================================================================
// src/api/v1/inventory/inventory.controller.js (NEW FILE)
// =======================================================================
const inventoryService = require('./inventory.service');

const addStockIn = async (req, res, next) => {
    try {
        const record = await inventoryService.createStockIn(req.body, req.user);
        res.status(201).json(record);
    } catch (error) {
        next(error);
    }
};

const getAllStockIns = async (req, res, next) => {
    try {
        const records = await inventoryService.getStockIns();
        res.status(200).json(records);
    } catch (error) {
        next(error);
    }
};
