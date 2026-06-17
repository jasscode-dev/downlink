import { spawn } from "node:child_process";
import path from "node:path";
import ffmpegStatic from "ffmpeg-static";

export interface DownloadResult {
  filePath: string;
  title: string;
}

const DOWNLOADS_DIR = path.resolve(process.cwd(), "../../storage/downloads");


export function downloadVideo(
  url: string,
  jobId: string,
  onProgress: (percent: number) => void,
): Promise<DownloadResult> {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(DOWNLOADS_DIR, `${jobId}.%(ext)s`);

    const ytDlp = spawn("yt-dlp", [
      url,
      "-o", outputTemplate,
      "--ffmpeg-location", (ffmpegStatic as unknown as string) || "",
      "--print", "after_move:filepath",
      "--newline",
    ]);

    let finalPath = "";
    let title = "";

    ytDlp.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();

      // yt-dlp imprime algo como "[download]  42.0% of 10.00MiB"
      const progressMatch = text.match(/(\d+(?:\.\d+)?)%/);
      if (progressMatch) {
        onProgress(parseFloat(progressMatch[1]));
      }

      // Captura o caminho final do arquivo impresso pelo --print
      if (text.trim().startsWith("/") || text.trim().match(/^[A-Za-z]:\\/)) {
        finalPath = text.trim();
      }
    });

    ytDlp.stderr.on("data", (chunk: Buffer) => {
      console.error(`[yt-dlp][${jobId}] ${chunk.toString()}`);
    });

    ytDlp.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp finalizou com código ${code}`));
      }
      resolve({ filePath: finalPath, title });
    });

    ytDlp.on("error", reject);
  });
}
