import React, { useState, useEffect, useContext, useRef } from 'react';
import { SocketContext } from '../../contexts/SocketContext';
import { getActiveChatThreads, getChatHistory, sendMessage } from '../../api/customerService';
import PageTitle from '../../components/shared/PageTitle';
import { Send, User, MessageSquare, Search, Paperclip, Check, CheckCheck } from 'lucide-react';

export default function SupportDesk() {
    const { socket } = useContext(SocketContext);
    const [threads, setThreads] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const scrollRef = useRef(null);

    // Initial Load
    useEffect(() => {
        loadThreads();
    }, []);

    // Real-Time Listener
    useEffect(() => {
        if (!socket) return;
        
        socket.on('receive_message', (msg) => {
            // If viewing this chat, append message
            if (activeChat && msg.senderId === activeChat.userId) {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
            }
            // Always refresh threads to update last message/timestamp
            loadThreads();
        });

        return () => socket.off('receive_message');
    }, [socket, activeChat]);

    const loadThreads = async () => {
        try {
            const data = await getActiveChatThreads();
            setThreads(data);
        } catch (e) {
            console.error("Chat Error", e);
        }
    };

    const handleSelectChat = async (thread) => {
        setActiveChat(thread);
        try {
            const history = await getChatHistory(thread.chatId);
            setMessages(history);
            scrollToBottom();
        } catch (e) {
            setMessages([]);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeChat) return;

        const tempMsg = {
            id: Date.now(),
            text: input,
            senderRole: 'admin',
            createdAt: new Date().toISOString(),
            status: 'sent'
        };

        // Optimistic UI Update
        setMessages(prev => [...prev, tempMsg]);
        setInput('');
        scrollToBottom();

        try {
            await sendMessage(activeChat.chatId, tempMsg.text, activeChat.userId);
            // In a real app, you'd update the message ID/status with the server response
        } catch (e) {
            alert('Message failed to send');
        }
    };

    const scrollToBottom = () => {
        setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    // Filter threads
    const filteredThreads = threads.filter(t => 
        t.userName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            <PageTitle title="Support Desk" subtitle="Customer Assistance & Issue Resolution" />
            
            <div className="flex flex-1 glass-card p-0 overflow-hidden border-0">
                {/* SIDEBAR: Threads */}
                <div className="w-80 border-r border-white/5 bg-black/20 flex flex-col">
                    <div className="p-4 border-b border-white/5">
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Search conversations..." 
                                className="glass-input w-full py-2 pl-9 text-xs"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                        {filteredThreads.map(thread => (
                            <div 
                                key={thread.userId}
                                onClick={() => handleSelectChat(thread)}
                                className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-all ${
                                    activeChat?.userId === thread.userId ? 'bg-blue-600/10 border-l-2 border-l-blue-500' : ''
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-sm font-semibold ${activeChat?.userId === thread.userId ? 'text-white' : 'text-gray-300'}`}>
                                        {thread.userName}
                                    </span>
                                    <span className="text-[10px] text-gray-500">
                                        {new Date(thread.lastMessageAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500 truncate w-4/5">{thread.lastMessage}</p>
                                    {thread.unreadCount > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {thread.unreadCount}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* MAIN: Chat Area */}
                <div className="flex-1 flex flex-col bg-[#0f1218]">
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-white/5 bg-white/5 backdrop-blur-md flex justify-between items-center">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3 border border-white/10">
                                        {activeChat.userName[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">{activeChat.userName}</h3>
                                        <div className="flex items-center">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                                            <p className="text-xs text-green-400">Online</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button className="glass-button-secondary px-3 py-1 text-xs">View Order</button>
                                    <button className="glass-button-secondary px-3 py-1 text-xs text-red-300 border-red-500/30 hover:bg-red-500/10">End Chat</button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {messages.map((msg, i) => {
                                    const isMe = msg.senderRole === 'admin';
                                    return (
                                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-lg ${
                                                isMe 
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : 'bg-[#1e293b] text-gray-200 border border-white/5 rounded-tl-none'
                                            }`}>
                                                <p>{msg.text}</p>
                                                <div className={`flex justify-end items-center mt-1 space-x-1 text-[10px] ${isMe ? 'text-blue-200' : 'text-gray-500'}`}>
                                                    <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                    {isMe && (msg.status === 'read' ? <CheckCheck size={12}/> : <Check size={12}/>)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-black/20 border-t border-white/5">
                                <form onSubmit={handleSend} className="flex items-center gap-2">
                                    <button type="button" className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors">
                                        <Paperclip size={20} />
                                    </button>
                                    <input 
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your message..." 
                                        className="glass-input flex-1 py-3 px-4 rounded-full"
                                    />
                                    <button 
                                        type="submit" 
                                        disabled={!input.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <MessageSquare size={32} className="opacity-50" />
                            </div>
                            <p className="text-sm">Select a conversation to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}