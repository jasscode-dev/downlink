import axios from 'axios';


export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('Erro na API:', error?.response?.data || error.message);
        return Promise.reject(error);
    },
);
