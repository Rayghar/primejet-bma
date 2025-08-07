// src/views/Login.js
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import { LogIn } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">PrimeJet BMA Login</h1>
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label>Email Address</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full p-3 border rounded-md" required />
                        </div>
                        <div>
                            <label>Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full p-3 border rounded-md" required />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <div>
                            <Button type="submit" disabled={loading} className="w-full" icon={LogIn}>
                                {loading ? 'Logging in...' : 'Login'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
