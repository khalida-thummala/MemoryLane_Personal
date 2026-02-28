import axios from 'axios';

// Base API setup
const api = axios.create({
    baseURL: '', // Using proxy defined in vite.config.js
});

// Authentication services
export const authService = {
    login: async (email, password) => {
        const response = await api.post('/api/auth/login', { email, password });
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/api/auth/register', userData);
        return response.data;
    },
    logout: async () => {
        await api.post('/api/auth/logout');
    },
    getProfile: async () => {
        const response = await api.get('/api/auth/profile');
        return response.data;
    }
};

// Memory services
export const memoryService = {
    getMemories: async () => {
        const response = await api.get('/api/memories');
        return response.data;
    },
    getCommunityMemories: async (filter = 'all') => {
        const response = await api.get(`/api/memories/community?filter=${filter}`);
        return response.data;
    },
    likeMemory: async (id) => {
        const response = await api.post(`/api/memories/${id}/like`);
        return response.data;
    },
    commentOnMemory: async (id, text) => {
        const response = await api.post(`/api/memories/${id}/comment`, { text });
        return response.data;
    }
};

// Album services
export const albumService = {
    getAlbums: async () => {
        const response = await api.get('/api/albums');
        return response.data;
    },
    getAlbumById: async (id) => {
        const response = await api.get(`/api/albums/${id}`);
        return response.data;
    },
    createAlbum: async (albumData) => {
        const response = await api.post('/api/albums', albumData);
        return response.data;
    },
    addMemoryToAlbum: async (albumId, memoryId) => {
        const response = await api.post(`/api/albums/${albumId}/memories/${memoryId}`);
        return response.data;
    }
};

// Friend services
export const friendService = {
    searchUsers: async (term) => {
        const response = await api.get(`/api/auth/users/search?search=${encodeURIComponent(term)}`);
        return response.data;
    },
    sendRequest: async (userId) => {
        const response = await api.post(`/api/friends/request/${userId}`);
        return response.data;
    },
    getPendingRequests: async () => {
        const response = await api.get('/api/friends/pending');
        return response.data;
    },
    acceptRequest: async (requestId) => {
        const response = await api.post(`/api/friends/accept/${requestId}`);
        return response.data;
    }
};

export default api;

