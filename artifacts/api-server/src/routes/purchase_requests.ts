import { Router } from "express";
import { db, purchaseRequestsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreatePurchaseRequestBody,
  GetPurchaseRequestsQueryParams,
  RespondToPurchaseRequestParams,
} from "@workspace/api-zod";
import { getUserIdFromToken } from "./users";

const router = Router();

router.get("/purchase-requests", async (req, res) => {
  const parsed = GetPurchaseRequestsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let conditions: ReturnType<typeof eq>[] = [];
  if (params.wasteType) conditions.push(eq(purchaseRequestsTable.wasteType, params.wasteType));

  const rows = conditions.length > 0
    ? await db.select().from(purchaseRequestsTable).where(and(...conditions)).orderBy(purchaseRequestsTable.createdAt)
    : await db.select().from(purchaseRequestsTable).orderBy(purchaseRequestsTable.createdAt);

  const usersMap = new Map<number, string>();
  for (const r of rows) {
    if (!usersMap.has(r.userId)) {
      const u = await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
      if (u.length > 0) usersMap.set(r.userId, u[0].phone);
    }
  }

  res.json(rows.map(r => ({ ...r, userPhone: usersMap.get(r.userId) ?? "" })));
});

router.post("/purchase-requests", async (req, res) => {
  const userId = await getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const parsed = CreatePurchaseRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const [inserted] = await db.insert(purchaseRequestsTable).values({
    userId,
    title: data.title,
    wasteType: data.wasteType,
    volume: data.volume,
    description: data.description,
    lat: data.lat,
    lng: data.lng,
    address: data.address,
    status: "open",
  }).returning();

  const u = await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  res.status(201).json({ ...inserted, userPhone: u[0]?.phone ?? "" });
});

router.post("/purchase-requests/:id/respond", async (req, res) => {
  const parsed = RespondToPurchaseRequestParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const userId = await getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [updated] = await db.update(purchaseRequestsTable)
    .set({ status: "responded" })
    .where(and(eq(purchaseRequestsTable.id, parsed.data.id), eq(purchaseRequestsTable.status, "open")))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Request not found or already responded" });
    return;
  }

  const u = await db.select({ phone: usersTable.phone }).from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
  res.json({ ...updated, userPhone: u[0]?.phone ?? "" });
});

export default router;
