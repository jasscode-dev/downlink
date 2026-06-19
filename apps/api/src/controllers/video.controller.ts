import type { Request, Response } from "express";
import { videoInputSchema, urlSchema } from "@video-converter/shared/schemas/video.schema.js";
import { videoService } from "../services/video.service.js";
import { getVideoInfo } from "@video-converter/worker/src/services/ytdlp.service.js";

export class VideoController {
    async getInfo(req: Request, res: Response) {
        const url = urlSchema.parse(req.query.url);

        const info = await getVideoInfo(url);
        return res.json({ error: null, data: { info } });
    }

    async create(req: Request, res: Response) {
        const data = videoInputSchema.parse(req.body);

        const video = await videoService.processVideo(data);
        return res.status(201).json({ error: null, data: { video } });
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const video = await videoService.getVideo(id);

        if (!video) {
            return res.status(404).json({ error: "Vídeo não encontrado", data: null });
        }

        return res.json({
            error: null,
            data: {
                video: {
                    ...video,
                    outputFilePath: undefined,
                    downloadUrl: video.status === "completed" ?
                        `api/videos/${video.id}/download` : null,
                }
            }
        });
    }

    async download(req: Request, res: Response) {
        const { id } = req.params;
        const video = await videoService.getVideo(id);

        if (!video) {
            return res.status(404).json({ error: "Vídeo não encontrado", data: null });
        }

        if (video.status !== "completed" || !video.outputFilePath) {
            return res.status(400).json({ error: "O vídeo ainda não está pronto para download.", data: null });
        }

        const fs = await import("fs");
        if (!fs.existsSync(video.outputFilePath)) {
            return res.status(404).json({ error: "Arquivo não encontrado no servidor.", data: null });
        }

        return res.download(video.outputFilePath);
    }
}

export const videoController = new VideoController();
