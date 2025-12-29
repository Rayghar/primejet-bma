import React, { createContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../hooks/useAuth'; // ✅ USE HOOK INSTEAD OF LOCALSTORAGE

export const SocketContext = createContext();

// ✅ PRODUCTION URL
//const SOCKET_URL = 'https://primejet-backend.onrender.com'; 
const SOCKET_URL = 'http://localhost:3000';
export const SocketProvider = ({ children }) => {
    const { user } = useAuth(); // ✅ Reactive: Updates immediately when you login
    const [socket, setSocket] = useState(null);
    const [onlineDrivers, setOnlineDrivers] = useState([]);
    const [incomingOrders, setIncomingOrders] = useState([]);
    const [activeChats, setActiveChats] = useState([]);

    useEffect(() => {
        // 1. Connect when User logs in
        if (user && !socket) {
            console.log("🔌 [Socket] Initializing connection for:", user.email);
            
            const newSocket = io(SOCKET_URL, {
                query: { userId: user.id, role: 'admin' },
                transports: ['websocket'],
                reconnectionAttempts: 5
            });

            newSocket.on('connect', () => console.log('🟢 [Socket] Connected! ID:', newSocket.id));
            
            newSocket.on('driver_location_update', (data) => {
                setOnlineDrivers(prev => {
                    const index = prev.findIndex(d => d.id === data.driverId);
                    if (index > -1) {
                        const updated = [...prev];
                        updated[index] = { ...updated[index], ...data };
                        return updated;
                    }
                    return [...prev, data];
                });
            });

            newSocket.on('order_created', (order) => setIncomingOrders(prev => [order, ...prev]));
            
            setSocket(newSocket);

            // Cleanup on unmount or logout
            return () => {
                console.log("🔴 [Socket] Disconnecting...");
                newSocket.disconnect();
            };
        }
        
        // 2. Disconnect when User logs out
        if (!user && socket) {
            socket.disconnect();
            setSocket(null);
        }
    }, [user, socket]); // ✅ Re-run this logic whenever 'user' changes

    return (
        <SocketContext.Provider value={{ socket, onlineDrivers, incomingOrders, activeChats }}>
            {children}
        </SocketContext.Provider>
    );
};