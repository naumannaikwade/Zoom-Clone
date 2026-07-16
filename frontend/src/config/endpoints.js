/*
 * Endpoint switch
 * Keep one pair active and comment out the other pair.
 */

// Local development
// const DEFAULT_API_BASE_URL = 'http://localhost:5000/api';
// const DEFAULT_SOCKET_URL = 'http://localhost:5000';

// Render deployment
const DEFAULT_API_BASE_URL = 'https://xzoomclone-backend.onrender.com/api';
const DEFAULT_SOCKET_URL = 'https://xzoomclone-backend.onrender.com';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || DEFAULT_SOCKET_URL;
