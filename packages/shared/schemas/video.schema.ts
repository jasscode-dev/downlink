import { z } from "zod";


export const urlSchema = z.string({ message: "URL é obrigatória" })
  .url("O formato da URL é inválido");

export const videoInputSchema = z.object({
  url: urlSchema,
  outputFormat: z.enum(["gif", "mp4"], { message: "Formato inválido" }),
});



export type VideoInputSchemaType = z.infer<typeof videoInputSchema>;
