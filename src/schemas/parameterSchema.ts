
import * as z from "zod";
import { PARAMETER_TYPES } from "@/constants/parameterTypes";

export const parameterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(PARAMETER_TYPES),
});

export type ParameterFormData = z.infer<typeof parameterSchema>;
