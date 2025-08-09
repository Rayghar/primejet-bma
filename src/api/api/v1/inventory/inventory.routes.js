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