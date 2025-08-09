const Joi = require('joi');

const createDailyLogSchema = Joi.object({
    type: Joi.string().valid('sale', 'expense').required(),
    branchId: Joi.string().required(),
    date: Joi.date().iso().required(),
    
    // Conditional validation based on type
    kgSold: Joi.number().when('type', { is: 'sale', then: Joi.required() }),
    revenue: Joi.number().when('type', { is: 'sale', then: Joi.required() }),
    saleType: Joi.string().when('type', { is: 'sale', then: Joi.required() }),
    
    amount: Joi.number().when('type', { is: 'expense', then: Joi.required() }),
    category: Joi.string().when('type', { is: 'expense', then: Joi.required() }),
    description: Joi.string().when('type', { is: 'expense', then: Joi.required() }),
});

const updateLogStatusSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
});

module.exports = { createDailyLogSchema, updateLogStatusSchema };
