import type { Request, Response } from "express";
import { getVideoInfo } from "@video-converter/worker/src/services/ytdlp.service.js";
export class InfoController {
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
}

export const infoController = new InfoController();
