import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RequestAuthCodeBody,
  VerifyAuthCodeBody,
} from "@workspace/api-zod";

const router = Router();

function generateCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateToken(userId: number): string {
  return Buffer.from(`${userId}:${Date.now()}:${Math.random()}`).toString("base64");
}

const tokens = new Map<string, number>();

router.post("/users/auth/request-code", async (req, res) => {
  const parsed = RequestAuthCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { phone } = parsed.data;
  const code = generateCode();

  const existing = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (existing.length === 0) {
    await db.insert(usersTable).values({ phone, verificationCode: code });
  } else {
    await db.update(usersTable).set({ verificationCode: code }).where(eq(usersTable.phone, phone));
  }

  res.json({ success: true, message: "Код отправлен", devCode: code });
});

router.post("/users/auth/verify-code", async (req, res) => {
  const parsed = VerifyAuthCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }
  const { phone, code } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
  if (users.length === 0 || users[0].verificationCode !== code) {
    res.status(401).json({ error: "Неверный код" });
    return;
  }

  const user = users[0];
  const token = generateToken(user.id);
  tokens.set(token, user.id);

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      createdAt: user.createdAt,
      activeListingsCount: 0,
      soldCount: 0,
      purchasedCount: 0,
    },
  });
});

export async function getUserIdFromToken(authHeader: string | undefined): Promise<number | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return tokens.get(token) ?? null;
}

router.get("/users/me", async (req, res) => {
  const userId = await getUserIdFromToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const users = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (users.length === 0) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const user = users[0];

  const { listingsTable, purchaseRequestsTable } = await import("@workspace/db");
  const { and, count } = await import("drizzle-orm");

  const [activeRes] = await db.select({ count: count() }).from(listingsTable)
    .where(and(eq(listingsTable.userId, userId), eq(listingsTable.status, "active")));
  const [soldRes] = await db.select({ count: count() }).from(listingsTable)
    .where(and(eq(listingsTable.userId, userId), eq(listingsTable.status, "sold")));
  const [purchasedRes] = await db.select({ count: count() }).from(listingsTable)
    .where(and(eq(listingsTable.reservedByUserId, userId), eq(listingsTable.status, "reserved")));

  res.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    createdAt: user.createdAt,
    activeListingsCount: Number(activeRes?.count ?? 0),
    soldCount: Number(soldRes?.count ?? 0),
    purchasedCount: Number(purchasedRes?.count ?? 0),
  });
});

export { tokens };
export default router;
