export type VideoStatus =
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

export interface VideoInput {
    url: string;
    outputFormat: OutputFormat;
}

export interface VideoProgress {
    stage: VideoStatus;
    percent: number;
    message?: string;
}

export interface VideoRecord {
    id: string;
    url: string;
    outputFormat: OutputFormat;
    status: VideoStatus;
    progress: number;
    sourceTitle?: string;
    outputFilePath?: string;
    errorMessage?: string;
    createdAt: string;
    updatedAt: string;
}

export interface VideoResponse {
    video: VideoRecord;
}
