// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS } from '../../utils/constants';
import { ChevronsLeft, ChevronsRight, LogIn } from 'lucide-react';

const NavItem = ({ item, activeView, setActiveView, isExpanded }) => (
    <li className="px-4 py-1">
        <a href="#" onClick={(e) => { e.preventDefault(); setActiveView(item.id); }}
            className={`flex items-center p-2 text-sm rounded-lg transition-colors duration-200 ${activeView === item.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>
            <item.icon size={20} />
            {isExpanded && <span className="ml-4 font-medium">{item.label}</span>}
        </a>
    </li>
);

export default function Sidebar({ activeView, setActiveView }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const { user } = useAuth();
    const modules = [...new Set(NAV_ITEMS.map(item => item.module))];

    const canView = (item) => !item.roles || (user && item.roles.includes(user.role));

    return (
        <aside className={`flex flex-col h-screen bg-white shadow-lg transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}>
            <div className="flex items-center justify-between p-4 border-b">
                {isExpanded && <span className="text-xl font-bold text-gray-800">PrimeJet BMA</span>}
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-lg hover:bg-gray-200">
                    {isExpanded ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
                {modules.map(module => (
                     <div key={module}>
                        {isExpanded && <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{module}</h3>}
                        <ul>
                            {NAV_ITEMS.filter(item => item.module === module && canView(item)).map(item => (
                                <NavItem key={item.id} item={item} activeView={activeView} setActiveView={setActiveView} isExpanded={isExpanded} />
                            ))}
                        </ul>
                     </div>
                ))}
            </nav>
            <div className="p-4 border-t">
                {user && (
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                            {user.email ? user.email[0].toUpperCase() : 'P'}
                        </div>
                        {isExpanded && (
                            <div className="ml-3">
                                <p className="text-sm font-semibold text-gray-800">{user.role || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}