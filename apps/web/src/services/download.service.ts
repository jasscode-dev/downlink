import { api } from './api';
import type { VideoInput, VideoResponse } from '../../../../packages/shared/types/video';

export const downloadService = {

    processVideo: async (data: VideoInput): Promise<VideoResponse> => {
        const response = await api.post('/api/videos', data);
        return response.data.data;
    },

    getVideoInfo: async (url: string) => {
        const response = await api.get(`/api/videos/info?url=${encodeURIComponent(url)}`);
        return response.data.data;
    },


    getVideoStatus: async (videoId: string): Promise<VideoResponse> => {
        const response = await api.get(`/api/videos/${videoId}`);
        return response.data.data;
    }
};
