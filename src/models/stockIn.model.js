// =======================================================================
// src/models/stockIn.model.js (NEW FILE)
// =======================================================================
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const stockInSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, default: () => uuidv4(), index: true },
    quantityKg: { type: Number, required: true },
    purchaseDate: { type: Date, required: true },
    supplier: { type: String, default: 'Refinery' },
    loggedBy: { type: { uid: String, email: String }, _id: false, required: true },
  },
  { timestamps: true } // Adds createdAt
);

const StockIn = mongoose.model('StockIn', stockInSchema);
module.exports = StockIn;


// =======================================================================
// src/api/v1/inventory/inventory.validation.js (NEW FILE)
// =======================================================================
const Joi = require('joi');

const createStockInSchema = Joi.object({
    quantityKg: Joi.number().positive().required(),
    purchaseDate: Joi.date().iso().required(),
    supplier: Joi.string().min(2).required(),
});

module.exports = { createStockInSchema };


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

module.exports = { addStockIn, getAllStockIns };


// =======================================================================
// src/api/v1/inventory/inventory.routes.js (NEW FILE)
// =======================================================================
const express = require('express');
const inventoryController = require('./inventory.controller');
const authMiddleware = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { createStockInSchema } = require('./inventory.validation');

const router = express.Router();

router.post(
    '/stock-in',
    authMiddleware('manager'), // Or any role that can log stock
    validate(createStockInSchema),
    inventoryController.addStockIn
);

router.get(
    '/stock-ins',
    authMiddleware('manager'), // Or any role that can view stock
    inventoryController.getAllStockIns
);

module.exports = router;
