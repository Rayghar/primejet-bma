// =======================================================================
// src/models/dailyLog.model.js (NEW FILE)
// =======================================================================
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const dailyLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, default: () => uuidv4(), index: true },
    type: { type: String, enum: ['sale', 'expense'], required: true },
    branchId: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    
    // Sale-specific fields
    kgSold: { type: Number, required: function() { return this.type === 'sale'; } },
    revenue: { type: Number, required: function() { return this.type === 'sale'; } },
    saleType: { type: String, required: function() { return this.type === 'sale'; } },

    // Expense-specific fields
    amount: { type: Number, required: function() { return this.type === 'expense'; } },
    category: { type: String, required: function() { return this.type === 'expense'; } },
    description: { type: String, required: function() { return this.type === 'expense'; } },

    // Audit fields
    submittedBy: { type: { uid: String, email: String }, _id: false, required: true },
    reviewedBy: { type: { uid: String, email: String }, _id: false },
    reviewedAt: { type: Date },
  },
  { timestamps: true } // Adds createdAt (submittedAt) and updatedAt
);

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
module.exports = DailyLog;
