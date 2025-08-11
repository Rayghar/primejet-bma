// src/views/Login.js
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth'; // Import the useAuth hook
import Button from '../components/shared/Button';
import Card from '../components/shared/Card';
import { LogIn } from 'lucide-react'; // Icon for the login button

export default function Login() {
    // State variables for email, password, error messages, and loading status
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Access the login function from the AuthContext via the useAuth hook
    const { login } = useAuth();

    /**
     * Handles the form submission for user login.
     * Prevents default form submission, sets loading state, attempts login,
     * handles success/error, and clears loading state.
     * @param {Event} e - The form submission event.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default browser form submission
        setError(''); // Clear any previous error messages
        setLoading(true); // Set loading state to true

        try {
            // Attempt to log in using the login function from AuthContext.
            // This function handles the API call to the backend and JWT storage.
            await login(email, password);
            // On successful login, the AuthContext will update, and the App component
            // will automatically handle the redirection to the dashboard.
        } catch (err) {
            // Handle login errors.
            // err.response?.data?.message is used to get the error message from the backend API response.
            // A fallback generic message is provided if the specific error message is not available.
            console.error("Login Error:", err);
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false); // Always clear loading state after the attempt
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 font-sans">
            <div className="w-full max-w-md p-4">
                <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">PrimeJet BMA Login</h1>
                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                                placeholder="you@example.com"
                                autoComplete="username" // For browser autofill
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                required
                                placeholder="••••••••"
                                autoComplete="current-password" // For browser autofill
                            />
                        </div>
                        {/* Display error message if present */}
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