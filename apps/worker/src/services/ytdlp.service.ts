import { spawn } from "node:child_process";
import path from "node:path";



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
      "--print", "after_move:filepath",
      "--newline",
    ]);

    let finalPath = "";
    let title = "";

    ytDlp.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();


      const progressMatch = text.match(/(\d+(?:\.\d+)?)%/);
      if (progressMatch) {
        onProgress(parseFloat(progressMatch[1]));
      }


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
