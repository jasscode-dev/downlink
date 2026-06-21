import fs from "node:fs/promises";
import path from "node:path";

const DOWNLOADS_DIR = path.resolve(process.cwd(), "../../storage/downloads");
const MAX_FILE_AGE_MS = 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 15 * 60 * 1000;

export function startCleanupJob() {
  console.log("[cleanup] Job de limpeza automática iniciado.");

  setInterval(async () => {
    try {
      const files = await fs.readdir(DOWNLOADS_DIR);
      const now = Date.now();

      let deletedCount = 0;

      for (const file of files) {
        if (file === ".gitkeep") continue;

        const filePath = path.join(DOWNLOADS_DIR, file);
        const stats = await fs.stat(filePath);


        if (now - stats.mtimeMs > MAX_FILE_AGE_MS) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

    } catch (error: any) {
      console.error("[cleanup] Erro ao executar a limpeza:", error.message);
    }
  }, CLEANUP_INTERVAL_MS);
}
