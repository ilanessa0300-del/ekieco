import { pgTable, text, serial, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const listingsTable = pgTable("listings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  wasteType: text("waste_type").notNull(),
  volume: text("volume").notNull(),
  description: text("description"),
  photoUrl: text("photo_url"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  address: text("address"),
  status: text("status").notNull().default("active"),
  isVip: boolean("is_vip").notNull().default(false),
  reservedByUserId: integer("reserved_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({ id: true, createdAt: true, status: true });
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
