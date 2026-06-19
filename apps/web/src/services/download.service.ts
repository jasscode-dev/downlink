import { api } from './api';
import type { CreateJobInput, JobResponse } from '../../../../packages/shared/types/job';

export const downloadService = {

    createJob: async (data: CreateJobInput): Promise<JobResponse> => {
        const response = await api.post('/api/jobs', data);
        return response.data;
    },

    getVideoInfo: async (url: string) => {
        const response = await api.get(`/api/info?url=${encodeURIComponent(url)}`);
        return response.data.info;
    },


    getJobStatus: async (jobId: string): Promise<JobResponse> => {
        const response = await api.get(`/api/jobs/${jobId}`);
        return response.data;
    }
};
