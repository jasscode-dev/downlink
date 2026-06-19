export type JobStatus =
    | "queued"
    | "downloading"
    | "converting"
    | "completed"
    | "failed";

export type OutputFormat = "gif" | "mp4";

export interface VideoInfo {
    title: string;
    thumbnailUrl: string;
    duration?: number;
}

export interface CreateJobInput {
    url: string;
    outputFormat: OutputFormat;
}

export interface JobProgress {
    stage: JobStatus;
    percent: number;
    message?: string;
}

export interface JobRecord {
    id: string;
    url: string;
    outputFormat: OutputFormat;
    status: JobStatus;
    progress: number;
    sourceTitle?: string;
    outputFilePath?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface JobResponse {
    job: JobRecord;
}
