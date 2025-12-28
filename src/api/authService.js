import apiClient from './apiClient';

export const signInUser = async (email, password) => {
    console.log("🔵 [AuthService] Sending Login Request...");
    
    // Hits V1 Auth Endpoint
    const response = await apiClient.post('/auth/login', { email, password });
    
    console.log("🟢 [AuthService] Server Response:", response.data);

    const data = response.data;
    
    // 1. Extract Token
    const token = data.token || data.data?.token;

    // 2. Extract or Construct User Object
    // The backend sends 'userId', 'role', 'name' at the root level.
    // We need to bundle them into a 'user' object for the frontend to use.
    let user = data.user || data.data?.user;

    if (!user && data.userId) {
        console.log("⚠️ [AuthService] Flat response detected. Constructing user object...");
        user = {
            id: data.userId,
            name: data.name,
            role: data.role,
            email: email, // Backend didn't return email in flat response, so we use the input
            photoUrl: data.photoUrl
        };
    }

    // 3. Save & Return
    if (token && user) {
        console.log("✅ [AuthService] Token & User found. Saving to Storage.");
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Return a normalized structure that AuthContext expects
        return {
            token: token,
            user: user
        };
    } else {
        console.error("🔴 [AuthService] Critical Failure: Parsing login data failed.", data);
        throw new Error("Login failed: Invalid server response format.");
    }
};

export const logoutUser = () => {
    console.log("👋 [AuthService] Logging out...");
    localStorage.clear();
    window.location.href = '/';
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
};