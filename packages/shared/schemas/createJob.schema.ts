import { z } from "zod";

export const outputFormatSchema = z.enum(["gif"]);

export const createJobSchema = z.object({
  url: z.string().url({ message: "URL inválida" }),
  outputFormat: outputFormatSchema.optional(),
});

export type CreateJobSchemaType = z.infer<typeof createJobSchema>;
