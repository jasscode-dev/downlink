import { redisConnection } from "../config/redis.js";
import type { VideoRecord, VideoStatus } from "@video-converter/shared/types/video.js";


const videoKey = (id: string) => `video:${id}`;

export class VideoStateService {
  async getVideo(id: string): Promise<VideoRecord | null> {
    const raw = await redisConnection.get(videoKey(id));
    return raw ? (JSON.parse(raw) as VideoRecord) : null;
  }

  async update(id: string, patch: Partial<VideoRecord>): Promise<void> {
    const current = await this.getVideo(id);
    if (!current) return;

    const updated: VideoRecord = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await redisConnection.set(videoKey(id), JSON.stringify(updated));
  }

  async setStatus(id: string, status: VideoStatus, progress?: number): Promise<void> {
    await this.update(id, { status, ...(progress !== undefined ? { progress } : {}) });
  }
}

export const videoStateService = new VideoStateService();
