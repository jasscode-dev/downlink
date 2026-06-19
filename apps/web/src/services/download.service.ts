import { api } from './api';
import type { CreateJobInput, JobResponse } from '../../../../packages/shared/types/job';

export const downloadService = {

    createJob: async (data: CreateJobInput): Promise<JobResponse> => {
        const response = await api.post('/api/jobs', data);
        console.log(response.data)
        return response.data;
    },


    getJobStatus: async (jobId: string): Promise<JobResponse> => {
        const response = await api.get(`/api/jobs/${jobId}`);
        console.log("response", response.data)
        return response.data;
    }
};
