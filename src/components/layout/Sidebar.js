// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
// CORRECTED: This import is sufficient. The local declaration below should be removed.
import { NAV_ITEMS } from '../../utils/constants';
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../api/firebase';

const NavItem = ({ item, activeView, setActiveView, isExpanded }) => {
    const { user } = useAuth();
    // Check if the user's role is included in the item's allowed roles.
    const canView = !item.roles || (user && item.roles.includes(user.role));

    if (!canView) return null;

    return (
        <li className="px-4 py-1">
            <button
                onClick={() => setActiveView(item.id)}
                className={`flex items-center p-2 text-sm rounded-lg transition-colors duration-200 w-full text-left ${activeView === item.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
            >
                <item.icon size={20} />
                {isExpanded && <span className="ml-4 font-medium">{item.label}</span>}
            </button>
        </li>
    );
};

export default function Sidebar({ activeView, setActiveView }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const { user } = useAuth();
    
    const modules = [...new Set(NAV_ITEMS.map(item => item.module))];

    // Function to handle user logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            // The onAuthStateChanged listener in AuthContext will handle the redirect
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

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
                            {NAV_ITEMS
                                .filter(item => item.module === module)
                                .map(item => (
                                    <NavItem key={item.id} item={item} activeView={activeView} setActiveView={setActiveView} isExpanded={isExpanded} />
                                ))
                            }
                        </ul>
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t">
                {user && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                {user.email ? user.email[0].toUpperCase() : 'A'}
                            </div>
                            {isExpanded && (
                                <div className="ml-3">
                                    <p className="text-sm font-semibold text-gray-800">{user.role || 'User'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                                </div>
                            )}
                        </div>
                        {isExpanded && (
                             <button onClick={handleLogout} className="p-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600" title="Logout">
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}