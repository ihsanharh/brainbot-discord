import { Request, Response, Router } from 'express';

import { ApiAuth } from "./auth";
import database from "./database";

const router: Router = Router();

router.use(ApiAuth);
router.use("/database", database);

export default router;