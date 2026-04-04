import { Router } from "express";
import { db, listingsTable, purchaseRequestsTable, usersTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/stats/summary", async (_req, res) => {
  const [totalListings] = await db.select({ count: count() }).from(listingsTable);
  const [activeListings] = await db.select({ count: count() }).from(listingsTable)
    .where(sql`status = 'active'`);
  const [totalRequests] = await db.select({ count: count() }).from(purchaseRequestsTable);
  const [openRequests] = await db.select({ count: count() }).from(purchaseRequestsTable)
    .where(sql`status = 'open'`);
  const [totalUsers] = await db.select({ count: count() }).from(usersTable);

  const topWasteRows = await db.execute(sql`
    SELECT waste_type, COUNT(*) as cnt
    FROM listings
    GROUP BY waste_type
    ORDER BY cnt DESC
    LIMIT 1
  `);

  const topWasteType = (topWasteRows as { rows: Array<{waste_type: string}> }).rows[0]?.waste_type ?? null;

  res.json({
    totalListings: Number(totalListings?.count ?? 0),
    activeListings: Number(activeListings?.count ?? 0),
    totalRequests: Number(totalRequests?.count ?? 0),
    openRequests: Number(openRequests?.count ?? 0),
    totalUsers: Number(totalUsers?.count ?? 0),
    topWasteType,
  });
});

export default router;
