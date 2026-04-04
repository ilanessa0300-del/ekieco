import { pgTable, text, serial, integer, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const purchaseRequestsTable = pgTable("purchase_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  wasteType: text("waste_type").notNull(),
  volume: text("volume").notNull(),
  description: text("description"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
  status: text("status").notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequestsTable).omit({ id: true, createdAt: true, status: true });
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;
export type PurchaseRequest = typeof purchaseRequestsTable.$inferSelect;
