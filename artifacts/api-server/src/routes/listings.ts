import { Router } from "express";
import { db, listingsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateListingBody,
  GetListingsQueryParams,
  GetListingParams,
  ReserveListingParams,
} from "@workspace/api-zod";
import { getUserIdFromToken } from "./users";

const router = Router();

router.get("/listings", async (req, res) => {
  const parsed = GetListingsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let conditions: ReturnType<typeof eq>[] = [];
  if (params.wasteType) conditions.push(eq(listingsTable.wasteType, params.wasteType));
  if (params.isVip !== undefined) conditions.push(eq(listingsTable.isVip, params.isVip));

  const rows = conditions.length > 0
    ? await db.select().from(listingsTable).where(and(...conditions)).orderBy(listingsTable.createdAt)
    : await db.select().from(listingsTable).orderBy(listingsTable.createdAt);

  const userIds = [...new Set(rows.map(r => r.userId))];
  const usersMap = new Map<number, string>();
  if (userIds.length > 0) {
    for (const uid of userIds) {
      const u = await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, uid)).limit(1);
      if (u.length > 0) usersMap.set(uid, u[0].phone);
    }
  }

  const result = rows.map(r => ({ ...r, userPhone: usersMap.get(r.userId) ?? "" }));
  res.json(result);
});

router.get("/listings/:id", async (req, res) => {
  const parsed = GetListingParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const rows = await db.select().from(listingsTable).where(eq(listingsTable.id, parsed.data.id)).limit(1);
  if (rows.length === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const r = rows[0];
  const u = await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
  res.json({ ...r, userPhone: u[0]?.phone ?? "" });
});

router.post("/listings", async (req, res) => {
  const userId = await getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const [inserted] = await db.insert(listingsTable).values({
    userId,
    wasteType: data.wasteType,
    volume: data.volume,
    description: data.description,
    photoUrl: data.photoUrl,
    lat: data.lat,
    lng: data.lng,
    address: data.address,
    isVip: data.isVip ?? false,
    status: "active",
  }).returning();

  const u = await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.status(201).json({ ...inserted, userPhone: u[0]?.phone ?? "" });
});

router.post("/listings/:id/reserve", async (req, res) => {
  const parsed = ReserveListingParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const userId = await getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [updated] = await db.update(listingsTable)
    .set({ status: "reserved", reservedByUserId: userId })
    .where(and(eq(listingsTable.id, parsed.data.id), eq(listingsTable.status, "active")))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Listing not found or already reserved" });
    return;
  }

  const u = await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
  res.json({ ...updated, userPhone: u[0]?.phone ?? "" });
});

export default router;
