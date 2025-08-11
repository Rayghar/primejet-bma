// src/views/02-Operations/Inventory.js (Refactored & Reimagined)
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useCallback
import { getAssets, addCylinder, deleteCylinder, getCylinders, addStockIn, getInventorySummary, getLpgStockInHistory } from '../../api/inventoryService'; // Import new service functions
import { formatCurrency, formatDate } from '../../utils/formatters';
import { getDashboardKpis } from '../../api/analyticsService'; // For currentBulkLpgKg in gauge

import PageTitle from '../../components/shared/PageTitle';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Notification from '../../components/shared/Notification';
import Modal from '../../components/shared/Modal';
import { PlusCircle, Trash2, Factory, Box, Package, AlertTriangle, DollarSign, History } from 'lucide-react'; // Added History icon

// --- StockGauge Component (remains unchanged) ---
const StockGauge = ({ percentage, stockKg }) => {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percentage / 100) * circumference;
    let strokeColor = 'stroke-green-500';
    if (percentage < 50) strokeColor = 'stroke-yellow-500';
    if (percentage < 25) strokeColor = 'stroke-red-500';
    return (
        <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 120 120"><circle className="stroke-current text-gray-200" strokeWidth="10" fill="transparent" r="52" cx="60" cy="60" /><circle className={`stroke-current ${strokeColor} transform -rotate-90 origin-center`} strokeWidth="10" strokeLinecap="round" fill="transparent" r="52" cx="60" cy="60" style={{ strokeDasharray: circumference, strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-in-out' }} /></svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold text-gray-800">{Math.round(stockKg).toLocaleString()}</span><span className="text-sm text-gray-500">kg remaining</span></div>
        </div>
    );
};

// --- AddCylinderForm Component (remains unchanged) ---
const AddCylinderForm = ({ onSuccess, onError }) => {
    const [formData, setFormData] = useState({ size: '12.5 kg', quantity: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addCylinder(formData);
            onSuccess(`${formData.quantity} x ${formData.size} cylinders added.`);
            setFormData({ size: '12.5 kg', quantity: '' });
        } catch (error) {
            console.error("Add Cylinder Error:", error);
            onError(error.response?.data?.message || 'Failed to add cylinders.');
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <input type="text" name="size" value={formData.size} onChange={handleChange} placeholder="Cylinder Size (e.g., 12.5 kg)" className="w-full p-2 border rounded-md" required />
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Quantity" className="w-full p-2 border rounded-md" required />
            <Button type="submit" disabled={isSubmitting} icon={PlusCircle} className="w-full">Add Batch</Button>
        </form>
    );
};

// --- LogStockInModal Component (remains unchanged) ---
const LogStockInModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        quantityKg: '',
        supplier: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        costPerKg: '',
        targetSalePricePerKg: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (!formData.quantityKg || !formData.supplier || !formData.purchaseDate || !formData.costPerKg || !formData.targetSalePricePerKg) {
            onSuccess('Please fill in all required fields.', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            await addStockIn({
                ...formData,
                quantityKg: parseFloat(formData.quantityKg),
                costPerKg: parseFloat(formData.costPerKg),
                targetSalePricePerKg: parseFloat(formData.targetSalePricePerKg),
            });
            onSuccess(`Successfully logged a stock-in of ${formData.quantityKg} kg.`);
            onClose();
        } catch (error) {
            console.error("Stock-in Error:", error);
            onSuccess(error.response?.data?.message || 'Failed to log stock-in.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal title="Log New Stock-In" onClose={onClose}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity (KG)</label>
                    <input type="number" name="quantityKg" value={formData.quantityKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., 2500" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Cost / kg (₦)</label>
                        <input type="number" name="costPerKg" value={formData.costPerKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., 850" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target Sale Price / kg (₦)</label>
                        <input type="number" name="targetSalePricePerKg" value={formData.targetSalePricePerKg} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., 1100" required />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <input type="text" name="supplier" value={formData.supplier} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                    <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md" required />
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging...' : 'Confirm Stock-In'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

// --- Main Inventory View Component ---
export default function Inventory() {
    const [showStockInModal, setShowStockInModal] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    const [cylinders, setCylinders] = useState([]);
    const [inventorySummary, setInventorySummary] = useState({ currentBulkLpgKg: 0, totalCylinders: 0, lowStockAlert: false, totalFixedAssetsValue: 0, totalLoanPrincipal: 0 }); // Initialize all fields
    const [stockInHistory, setStockInHistory] = useState([]); // New state for stock-in history
    const [loading, setLoading] = useState(true);

    // Function to fetch all data for the Inventory screen, wrapped in useCallback
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedCylinders = await getCylinders();
            const invSummary = await getInventorySummary(); // Fetch comprehensive inventory summary
            const lpgHistory = await getLpgStockInHistory(); // Fetch new LPG stock-in history
            
            setCylinders(fetchedCylinders);
            setInventorySummary(invSummary);
            setStockInHistory(lpgHistory);
        } catch (error) {
            console.error('Failed to fetch inventory data:', error);
            handleError('Failed to load inventory data.');
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array for useCallback means fetchData is stable

    // Fetch data on component mount and whenever a change occurs (e.g., after adding/removing)
    useEffect(() => {
        fetchData();
    }, [fetchData]); // fetchData is now a stable dependency

    // Memoized calculation for the stock gauge percentage
    const bulkStockPercentage = useMemo(() => {
        const maxCapacity = 20000; // Assuming a fixed max capacity for the gauge, or fetch from config
        return maxCapacity > 0 ? (inventorySummary.currentBulkLpgKg / maxCapacity) * 100 : 0;
    }, [inventorySummary.currentBulkLpgKg]);
    
    // Notification handlers
    const handleSuccess = (message) => {
        setNotification({ show: true, message, type: 'success' });
        setShowStockInModal(false); // Close modal on success
        fetchData(); // Re-fetch all data to update the lists and summaries
    };
    
    const handleError = (msg) => setNotification({ show: true, message: msg, type: 'error' });

    // Handler for removing a cylinder batch
    const handleRemoveCylinder = async (cylinderId, cylinderName) => {
        if (window.confirm(`Are you sure you want to remove the cylinder batch "${cylinderName}"?`)) {
            try {
                await deleteCylinder(cylinderId);
                handleSuccess(`Cylinder batch "${cylinderName}" removed.`);
            } catch (error) {
                console.error("Remove Cylinder Error:", error);
                handleError(error.response?.data?.message || 'Failed to remove cylinder.');
            }
        }
    };

    return (
        <>
            <Notification notification={notification} setNotification={setNotification} />
            {showStockInModal && <LogStockInModal onClose={() => setShowStockInModal(false)} onSuccess={handleSuccess} />}
            
            <div className="flex justify-between items-center">
                <PageTitle title="Inventory Command Center" subtitle="Live tracking of bulk LPG and company assets." />
                <Button onClick={() => setShowStockInModal(true)} icon={PlusCircle}>Log Stock-In</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bulk LPG Stock Overview */}
                <div className="lg:col-span-1">
                    <Card className="flex flex-col items-center justify-center p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><Factory className="mr-2 text-indigo-500" />Bulk LPG Stock</h3>
                        {loading ? <p>Calculating...</p> : (
                            <>
                                <StockGauge percentage={bulkStockPercentage} stockKg={inventorySummary.currentBulkLpgKg} />
                                {inventorySummary.lowStockAlert && (
                                    <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md flex items-center text-sm font-semibold">
                                        <AlertTriangle size={18} className="mr-2" />
                                        <span>LOW STOCK ALERT: Below threshold!</span>
                                    </div>
                                )}
                                <div className="mt-4 space-y-2 text-sm w-full">
                                    <div className="flex justify-between">
                                        <span>Total Cylinders:</span>
                                        <span className="font-semibold">{inventorySummary.totalCylinders.toLocaleString()}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </Card>
                </div>
                
                {/* Cylinder Assets Table */}
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><Package className="mr-2 text-sky-500" />Cylinder Assets (Total Owned)</h3>
                        {loading ? <p>Loading cylinder data...</p> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="p-4 text-sm font-semibold text-gray-600">Cylinder Size</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Total Quantity</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cylinders.length > 0 ? cylinders.map(row => (
                                            <tr key={row.id} className="border-b hover:bg-gray-50">
                                                <td className="p-4 font-medium">{row.size}</td>
                                                <td className="p-4 text-right font-semibold">{row.quantity.toLocaleString()}</td>
                                                <td className="p-4 text-right">
                                                    <Button onClick={() => handleRemoveCylinder(row.id, row.size)} variant="danger" icon={Trash2} />
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="3" className="text-center p-4 text-gray-500">No cylinders recorded.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="border-t mt-4 pt-4">
                             <h4 className="text-lg font-semibold text-gray-700 mb-4">Add New Cylinder Batch</h4>
                             <AddCylinderForm onSuccess={handleSuccess} onError={handleError} />
                        </div>
                    </Card>
                </div>

                {/* LPG Stock-In History & Profitability */}
                <div className="lg:col-span-3"> {/* Span full width */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><History className="mr-2 text-blue-500" />LPG Stock-In History & Profitability</h3>
                        {loading ? <p>Loading stock-in history...</p> : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50">
                                            <th className="p-2">Date</th>
                                            <th className="p-2">Supplier</th>
                                            <th className="p-2">Quantity (Kg)</th>
                                            <th className="p-2 text-right">Cost (₦/kg)</th>
                                            <th className="p-2 text-right">Expected Revenue</th>
                                            <th className="p-2 text-right">Actual Revenue</th>
                                            <th className="p-2 text-right">Profit/Loss</th>
                                            <th className="p-2 text-right">Profit Margin (%)</th>
                                            <th className="p-2">Sales Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stockInHistory.length > 0 ? stockInHistory.map(batch => (
                                            <tr key={batch.id} className="border-b hover:bg-gray-50">
                                                <td className="p-2">{formatDate(batch.purchaseDate)}</td>
                                                <td className="p-2">{batch.supplier}</td>
                                                <td className="p-2">{batch.quantityKg.toLocaleString()}</td>
                                                <td className="p-2 text-right">{formatCurrency(batch.costPerKg)}</td>
                                                <td className="p-2 text-right">{formatCurrency(batch.expectedRevenue)}</td>
                                                <td className="p-2 text-right">{formatCurrency(batch.estimatedActualRevenue)}</td>
                                                <td className={`p-2 text-right font-semibold ${batch.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatCurrency(batch.profitLoss)}
                                                </td>
                                                <td className={`p-2 text-right font-semibold ${batch.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {batch.profitMargin.toFixed(1)}%
                                                </td>
                                                <td className="p-2">
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${batch.salesProgress}%` }}></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan="9" className="text-center p-4 text-gray-500">No LPG stock-in history found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Financial Assets & Liabilities Overview (from AssetAndLoan, but relevant here) */}
                <div className="lg:col-span-3"> {/* Span full width */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><DollarSign className="mr-2 text-green-500" />Financial Assets & Liabilities Overview</h3>
                        {loading ? <p>Loading financial data...</p> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Total Fixed Assets Value:</p>
                                    <p className="text-2xl font-bold text-gray-800">{formatCurrency(inventorySummary.totalFixedAssetsValue || 0)}</p>
                                </div>
                                <div className="bg-red-50 p-4 rounded-lg">
                                    <p className="text-sm text-gray-600">Total Loan Principal:</p>
                                    <p className="text-2xl font-bold text-red-600">{formatCurrency(inventorySummary.totalLoanPrincipal || 0)}</p>
                                </div>
                            </div>
                        )}
                        <p className="text-sm text-gray-500 mt-4">For detailed asset and loan management, please visit the Financials : Assets & Loans section.</p>
                    </Card>
                </div>
            </div>
        </>
    );
}