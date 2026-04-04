import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import listingsRouter from "./listings";
import purchaseRequestsRouter from "./purchase_requests";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(listingsRouter);
router.use(purchaseRequestsRouter);
router.use(statsRouter);

export default router;
