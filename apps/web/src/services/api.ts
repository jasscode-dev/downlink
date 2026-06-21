import axios from 'axios';
import toast from 'react-hot-toast';


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
        toast.error(error?.response?.data?.error || error.message);
        return Promise.reject(error);
    },
);
