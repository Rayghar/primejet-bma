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