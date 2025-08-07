import React, { useState, useContext, useMemo } from 'react';
// FIX: Ensured 'App' is capitalized consistently in the import path.
import { AppContext } from '../../app'; 
import { CheckCircle, XCircle, PlusCircle } from 'lucide-react';

const formatNaira = (value) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(value);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const POSView = ({ onBack, plantId, cashierName }) => {
  const { state, dispatch } = useContext(AppContext);
  const [saleType, setSaleType] = useState('Site Sale');
  const [kg, setKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState(state.financials.siteSalePricePerKg);
  const [eodReport, setEodReport] = useState(null);

  React.useEffect(() => {
    setPricePerKg(saleType === 'Site Sale' ? state.financials.siteSalePricePerKg : (state.financials.siteSalePricePerKg + state.financials.deliveryFeePerKg));
  }, [saleType, state.financials]);

  const total = useMemo(() => (parseFloat(kg) || 0) * pricePerKg, [kg, pricePerKg]);

  const handleAddSale = () => {
    if (parseFloat(kg) > 0) {
      const newEntry = {
        id: `SALE-${Date.now()}`,
        type: 'Sales',
        date: new Date().toISOString().split('T')[0],
        plantId: plantId,
        enteredBy: cashierName,
        details: `${kg}kg ${saleType}`,
        amount: total,
        status: 'Pending',
      };
      dispatch({ type: 'ADD_DATA_ENTRY', payload: newEntry });
      setKg('');
      alert('Sale logged for approval!');
    }
  };
  
  const generateEODReport = () => {
      const today = new Date().toISOString().split('T')[0];
      const todaysSales = state.dataEntries.filter(e => e.type === 'Sales' && e.date === today && e.plantId === plantId && e.status === 'Approved');
      const totalSales = todaysSales.reduce((sum, entry) => sum + entry.amount, 0);
      setEodReport({ date: today, totalSales, salesCount: todaysSales.length });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg mx-auto">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">PrimeJet POS</h3>
        <span className="text-sm text-slate-500">{plantId} - {cashierName}</span>
      </div>
      
      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-600">Sale Type</label>
          <select value={saleType} onChange={e => setSaleType(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md">
            <option>Site Sale</option>
            <option>Delivered Sale</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600">LPG Amount (kg)</label>
          <input type="number" value={kg} onChange={e => setKg(e.target.value)} className="mt-1 block w-full p-2 border border-slate-300 rounded-md" placeholder="e.g., 12.5" />
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Price per kg: {formatNaira(pricePerKg)}</p>
          <p className="text-2xl font-bold">Total: {formatNaira(total)}</p>
        </div>
        <div className="flex space-x-2">
            <button onClick={handleAddSale} className="flex-1 bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700">Log Sale</button>
            <button onClick={() => alert('Printing PrimeJet Invoice...')} className="bg-slate-200 px-4 py-2 rounded-lg hover:bg-slate-300">Print Invoice</button>
        </div>
         <button onClick={generateEODReport} className="w-full mt-2 text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">Run End of Day Report</button>
         {eodReport && <div className="mt-4 p-4 bg-slate-50 rounded-md">
            <h4 className="font-bold">End of Day Report ({formatDate(eodReport.date)})</h4>
            <p>Total Approved Sales: {formatNaira(eodReport.totalSales)}</p>
            <p>Number of Transactions: {eodReport.salesCount}</p>
         </div>}
         <button onClick={onBack} className="w-full mt-2 text-sm text-slate-600 hover:text-sky-700">Back to Approval Queue</button>
      </div>
    </div>
  );
};

const DataEntryView = () => {
    const { state, dispatch } = useContext(AppContext);
    const [view, setView] = useState('ApprovalQueue');

    const handleUpdateStatus = (id, status) => {
        dispatch({ type: 'UPDATE_ENTRY_STATUS', payload: { id, status } });
    };
    
    const getStatusChip = (status) => {
        switch(status) {
            case 'Approved': return <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800">Approved</span>;
            case 'Pending': return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Pending</span>;
            case 'Rejected': return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
            default: return <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-800">Unknown</span>;
        }
    };

    if (view === 'POS') return <POSView onBack={() => setView('ApprovalQueue')} plantId="P001" cashierName="Cashier 1" />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900">Data Entry & Approval</h2>
                <div className="flex space-x-2">
                    <button onClick={() => setView('POS')} className="flex items-center text-sm font-medium bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"><PlusCircle className="h-4 w-4 mr-2"/> POS Interface</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Manager's Approval Queue</h3>
                 <div className="overflow-x-auto mt-4">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Details</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200 text-sm">
                            {state.dataEntries.map(entry => (
                                <tr key={entry.id}>
                                    <td className="px-4 py-3">{formatDate(entry.date)}</td>
                                    <td className="px-4 py-3 font-medium">{entry.type}</td>
                                    <td className="px-4 py-3 text-slate-600">{entry.details}</td>
                                    <td className="px-4 py-3">{formatNaira(entry.amount)}</td>
                                    <td className="px-4 py-3">{getStatusChip(entry.status)}</td>
                                    <td className="px-4 py-3">
                                        {entry.status === 'Pending' && <div className="flex space-x-2">
                                            <button onClick={() => handleUpdateStatus(entry.id, 'Approved')} className="p-1 text-emerald-600 hover:bg-emerald-100 rounded-full"><CheckCircle className="h-5 w-5"/></button>
                                            <button onClick={() => handleUpdateStatus(entry.id, 'Rejected')} className="p-1 text-red-600 hover:bg-red-100 rounded-full"><XCircle className="h-5 w-5"/></button>
                                        </div>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DataEntryView;
