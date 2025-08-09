// src/views/Login.js
import React, { useState } from 'react';
import { signInUser } from '../api/authService'; // Import the new sign-in function
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import { LogIn } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await signInUser(email, password);
            // On success, the onAuthStateChanged listener in AuthContext
            // will automatically handle the state change and redirect.
        } catch (err) {
            // Handle specific Firebase errors for better user feedback
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Login failed. Please check your credentials.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
            console.error("Login Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-4">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">PrimeJet BMA Login</h1>
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                                placeholder="••••••••"
                            />
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
