import { z } from "zod";

export const videoInputSchema = z.object({
  url: z.string().url({ message: "URL inválida" }),
  outputFormat: z.enum(["gif", "mp4"], { message: "Formato inválido" }),
});

export type VideoInputSchemaType = z.infer<typeof videoInputSchema>;
