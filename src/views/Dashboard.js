import React, { useContext } from 'react';
import { AppContext } from '../app';
import { Flame, TrendingUp, Truck, Users, Target } from 'lucide-react';

const formatNumber = (value) => new Intl.NumberFormat('en-US').format(value);

const StatCard = ({ title, value, icon, target }) => {
  const IconComponent = icon;
  const percentage = target ? (value / target * 100) : 0;
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-slate-500">
          <h3 className="text-sm font-medium">{title}</h3>
          <IconComponent className="h-5 w-5" />
        </div>
        <p className="mt-2 text-2xl font-bold text-slate-900">{typeof value === 'number' ? formatNumber(value) : value}</p>
      </div>
      {target && <div className="mt-2">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
          <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${Math.min(percentage, 100)}%` }}></div>
        </div>
      </div>}
    </div>
  );
};

const DashboardView = () => {
    const { state } = useContext(AppContext);
    const { plants } = state;

    const kpis = {
      dailySalesKg: 3000, 
      targetDailySalesKg: 3000,
      quarterlySalesKg: 217593,
      targetQuarterlySalesKg: 217593,
      activeDeliveries: 12,
    };
    const okrs = {
      quarterlySalesGrowth: 10.5,
      targetQuarterlySalesGrowth: 10.0,
      generatorConversions: 45,
      targetGeneratorConversions: 50,
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Plant Status (Real-time)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {plants.map(plant => (
                        <div key={plant.id} className="border p-4 rounded-lg">
                            <div className="flex justify-between items-center">
                                <h4 className="font-semibold">{plant.name}</h4>
                                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                    plant.status === 'Operational' ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-amber-100 text-amber-800'
                                }`}>{plant.status}</span>
                            </div>
                            <p className="text-3xl font-bold mt-2">{plant.outputKg} <span className="text-base font-medium text-slate-500">kg/day</span></p>
                            <p className={`text-sm ${plant.uptime < 99.999 ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                                Uptime: {plant.uptime.toFixed(3)}%
                            </p>
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Key Performance Indicators (KPIs)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Daily Sales (All Plants)" value={`${formatNumber(kpis.dailySalesKg)} kg`} icon={Flame} target={kpis.targetDailySalesKg}/>
                    <StatCard title="Quarterly Sales" value={`${formatNumber(kpis.quarterlySalesKg)} kg`} icon={TrendingUp} target={kpis.targetQuarterlySalesKg}/>
                    <StatCard title="Active Deliveries" value={kpis.activeDeliveries} icon={Truck}/>
                </div>
            </div>
             <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Objectives & Key Results (OKRs)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Quarterly Sales Growth" value={`${okrs.quarterlySalesGrowth}%`} icon={TrendingUp} target={okrs.targetQuarterlySalesGrowth}/>
                    <StatCard title="Generator Conversions (Qtr)" value={okrs.generatorConversions} icon={Users} target={okrs.targetGeneratorConversions}/>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
