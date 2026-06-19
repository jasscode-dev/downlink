import type { Request, Response } from "express";
import { videoInputSchema } from "@video-converter/shared/schemas/video.schema.js";
import { videoService } from "../services/video.service.js";
import { getVideoInfo } from "@video-converter/worker/src/services/ytdlp.service.js";

export class VideoController {
    async getInfo(req: Request, res: Response) {
        const url = req.query.url as string;
    
        if (!url) {
          return res.status(400).json({ error: "URL é obrigatória" });
        }
    
        try {
          const info = await getVideoInfo(url);
          return res.json({ info });
        } catch (error: any) {
          console.error("Erro ao buscar info do vídeo:", error);
          return res.status(500).json({ error: "Falha ao obter informações do vídeo" });
        }
    }

    async create(req: Request, res: Response) {
        const parsed = videoInputSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const video = await videoService.processVideo(parsed.data);
        return res.status(201).json({ video });
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const video = await videoService.getVideo(id);

        if (!video) {
            return res.status(404).json({ error: "Vídeo não encontrado" });
        }

        return res.json({
            video:
            {
                ...video,
                outputFilePath: undefined,
                downloadUrl: video.status === "completed" ?
                    `api/videos/${video.id}/download` : null,
            }
        });
    }

    async download(req: Request, res: Response) {
        const { id } = req.params;
        const video = await videoService.getVideo(id);

        if (!video) {
            return res.status(404).json({ error: "Vídeo não encontrado" });
        }

        if (video.status !== "completed" || !video.outputFilePath) {
            return res.status(400).json({ error: "O vídeo ainda não está pronto para download." });
        }

        const fs = await import("fs");
        if (!fs.existsSync(video.outputFilePath)) {
            return res.status(404).json({ error: "Arquivo não encontrado no servidor." });
        }

        return res.download(video.outputFilePath);
    }
}

export const videoController = new VideoController();
