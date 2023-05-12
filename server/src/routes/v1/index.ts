import { Request, Response, Router } from 'express';

import database from "./database";

const router: Router = Router();

router.use("/database", database);
router.all("/", async (req: Request, res: Response) => {
	return res.send("<p>BrainBot's API.</p>");
});

export default router;