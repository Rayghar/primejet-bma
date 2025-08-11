// src/components/layout/Sidebar.js
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NAV_ITEMS, USER_ROLES } from '../../utils/constants'; // USER_ROLES is imported but not directly used in NavItem's logic
import { ChevronsLeft, ChevronsRight, LogOut } from 'lucide-react';

/**
 * NavItem component represents a single clickable item in the sidebar.
 * It conditionally renders based on the user's role.
 * @param {object} props
 * @param {object} props.item - The navigation item object (id, icon, label, module, roles).
 * @param {string} props.activeView - The currently active view ID.
 * @param {function} props.setActiveView - Function to set the active view.
 * @param {boolean} props.isExpanded - Whether the sidebar is expanded or collapsed.
 */
const NavItem = ({ item, activeView, setActiveView, isExpanded }) => {
    const { user } = useAuth();

    // Debug 12: Log the user object and item roles for each NavItem
    console.log(`[NavItem Debug] Item: ${item.label}, User Role: ${user?.role}, Allowed Roles: ${item.roles ? item.roles.join(', ') : 'All'}`);

    // Determine if the current user has permission to view this navigation item.
    // If item.roles is not defined, it means the item is accessible to all authenticated users.
    // FIX: Convert both user.role and item.roles to lowercase for case-insensitive comparison.
    const canView = !item.roles || (user && item.roles.map(role => role.toLowerCase()).includes(user.role.toLowerCase()));

    // Debug 13: Log the result of canView
    console.log(`[NavItem Debug] Item: ${item.label}, Can View: ${canView}`);

    if (!canView) {
        return null; // Don't render the item if the user doesn't have the required role
    }

    return (
        <li className="px-4 py-1">
            <button
                onClick={() => setActiveView(item.id)}
                className={`flex items-center p-2 text-sm rounded-lg transition-colors duration-200 w-full text-left 
                    ${activeView === item.id ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`
                }
            >
                {/* Dynamically render the Lucide icon */}
                <item.icon size={20} />
                {/* Only show the label if the sidebar is expanded */}
                {isExpanded && <span className="ml-4 font-medium">{item.label}</span>}
            </button>
        </li>
    );
};

/**
 * Sidebar component for application navigation.
 * Manages its expanded/collapsed state and displays navigation items based on user roles.
 * @param {object} props
 * @param {string} props.activeView - The currently active view ID.
 * @param {function} props.setActiveView - Function to set the active view.
 */
export default function Sidebar({ activeView, setActiveView }) {
  const { user, logout } = useAuth(); // Get user and logout function from AuthContext
  const [isExpanded, setIsExpanded] = useState(true); // State for sidebar expansion
  
  // Debug 14: Log the user object received by Sidebar
  console.log('[Sidebar Debug] User object:', user);

  // Get unique module names to group navigation items
  const modules = [...new Set(NAV_ITEMS.map(item => item.module))];

  /**
   * Handles the logout action.
   * Calls the logout function from the AuthContext, which clears the JWT and user state.
   */
  const handleLogout = () => {
    logout();
    // The App component (parent) will detect the change in user state (user becomes null)
    // and automatically redirect to the Login page.
  };

    return (
        <aside 
            className={`flex flex-col h-screen bg-white shadow-lg transition-all duration-300 ease-in-out 
                ${isExpanded ? 'w-64' : 'w-20'} flex-shrink-0` // flex-shrink-0 prevents it from shrinking too much
            }
        >
            <div className="flex items-center justify-between p-4 border-b">
                {isExpanded && <span className="text-xl font-bold text-gray-800">PrimeJet BMA</span>}
                <button 
                    onClick={() => setIsExpanded(!isExpanded)} 
                    className="p-2 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {/* Toggle icon based on expanded state */}
                    {isExpanded ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
                </button>
            </div>
            <nav className="flex-1 overflow-y-auto custom-scrollbar"> {/* Added custom-scrollbar for better UX */}
                {modules.map(module => (
                    <div key={module} className="mb-2"> {/* Added margin-bottom for spacing */}
                        {isExpanded && (
                            <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {module}
                            </h3>
                        )}
                        <ul>
                            {NAV_ITEMS
                                .filter(item => item.module === module)
                                .map(item => (
                                    <NavItem 
                                        key={item.id} 
                                        item={item} 
                                        activeView={activeView} 
                                        setActiveView={setActiveView} 
                                        isExpanded={isExpanded} 
                                    />
                                ))
                            }
                        </ul>
                    </div>
                ))}
            </nav>
            <div className="p-4 border-t">
                {user && ( // Only show user info if a user is logged in
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                             {/* User's initial or avatar */}
                             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                {user.email ? user.email[0].toUpperCase() : 'A'}
                            </div>
                            {isExpanded && (
                                <div className="ml-3 overflow-hidden"> {/* Added overflow-hidden to truncate long emails */}
                                    <p className="text-sm font-semibold text-gray-800">{user.role || 'User'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                                </div>
                            )}
                        </div>
                        {isExpanded && (
                             <button 
                                onClick={handleLogout} 
                                className="p-2 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500" 
                                title="Logout"
                                aria-label="Logout"
                            >
                                <LogOut size={20} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </aside>
    );
}