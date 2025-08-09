// src/components/shared/ErrorBoundary.js
import React from 'react';
import { logAppEvent } from '../../services/loggingService';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    // This lifecycle method is triggered when a descendant component throws an error.
    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    // This lifecycle method is for logging the error information.
    componentDidCatch(error, errorInfo) {
        logAppEvent('ERROR', 'Uncaught application error', {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
        });
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div className="flex items-center justify-center h-screen bg-gray-100 text-center">
                    <div>
                        <h1 className="text-2xl font-bold text-red-600">Something went wrong.</h1>
                        <p className="text-gray-700 mt-2">
                            An unexpected error has occurred. The development team has been notified.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
