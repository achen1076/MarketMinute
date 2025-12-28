import { z } from "zod";

export const GetAlertsInputSchema = z.object({
  userId: z.string().min(1),
  unreadOnly: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export type GetAlertsInput = z.infer<typeof GetAlertsInputSchema>;

export const AlertItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  message: z.string(),
  symbol: z.string().optional(),
  severity: z.enum(["info", "warning", "critical"]),
  read: z.boolean(),
  createdAt: z.string(),
});

export const GetAlertsOutputSchema = z.object({
  alerts: z.array(AlertItemSchema),
  unreadCount: z.number(),
  asOf: z.string(),
});

export type GetAlertsOutput = z.infer<typeof GetAlertsOutputSchema>;

export const GetAlertsToolSpec = {
  name: "get_alerts",
  description:
    "Get the user's alerts and notifications about their watched stocks.",
  inputSchema: GetAlertsInputSchema,
  outputSchema: GetAlertsOutputSchema,
} as const;
