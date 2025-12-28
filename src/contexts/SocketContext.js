import React, { createContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getCurrentUser } from '../api/authService';

export const SocketContext = createContext();

const SOCKET_URL = 'https://primejet-backend.onrender.com';

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineDrivers, setOnlineDrivers] = useState([]);
    const [incomingOrders, setIncomingOrders] = useState([]);
    const [activeChats, setActiveChats] = useState([]);

    useEffect(() => {
        const user = getCurrentUser();
        if (user && !socket) {
            // Initialize Socket Connection
            const newSocket = io(SOCKET_URL, {
                query: { userId: user.id, role: 'admin' }, // Identify as Admin
                transports: ['websocket'],
                reconnectionAttempts: 5
            });

            newSocket.on('connect', () => {
                console.log('🟢 Connected to PrimeJet Realtime Network');
            });

            // 1. Live Driver Tracking (Logistics Map)
            newSocket.on('driver_location_update', (data) => {
                // data = { driverId, lat, lng, ... }
                setOnlineDrivers(prev => {
                    const index = prev.findIndex(d => d.id === data.driverId);
                    if (index > -1) {
                        // Update existing driver position
                        const updated = [...prev];
                        updated[index] = { ...updated[index], ...data };
                        return updated;
                    }
                    // Add new driver to map
                    return [...prev, data];
                });
            });

            // 2. Incoming Orders (Dispatch Hub)
            newSocket.on('order_created', (order) => {
                setIncomingOrders(prev => [order, ...prev]);
                // Optional: Trigger Audio Notification here
            });

            // 3. Customer Support (Live Chat)
            newSocket.on('receive_message', (msg) => {
                // We update this state so the Chat Sidebar shows "New Message" badge
                setActiveChats(prev => {
                    const exists = prev.find(c => c.userId === msg.senderId);
                    if(exists) return prev.map(c => c.userId === msg.senderId ? {...c, lastMessage: msg.text, unread: true} : c);
                    return prev; 
                });
            });

            setSocket(newSocket);

            return () => newSocket.disconnect();
        }
    }, [socket]); // Run once on mount if user exists

    return (
        <SocketContext.Provider value={{ socket, onlineDrivers, incomingOrders, activeChats }}>
            {children}
        </SocketContext.Provider>
    );
};