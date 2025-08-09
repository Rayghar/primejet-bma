// src/services/inventoryService.js (Connects to NEW backend endpoints)
import http from './httpService';

const addStockIn = (stockInData) => http.post('/inventory/stock-in', stockInData);
const getStockIns = () => http.get('/inventory/stock-ins');

const inventoryService = { addStockIn, getStockIns };
export default inventoryService;