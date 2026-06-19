import { z } from "zod";

export const createJobSchema = z.object({
  url: z.string().url({ message: "URL inválida" }),
  outputFormat: z.enum(["gif", "mp4"], { message: "Formato inválido" }),
});

export type CreateJobSchemaType = z.infer<typeof createJobSchema>;
