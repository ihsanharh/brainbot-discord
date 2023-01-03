import { Router } from 'express';

import { CollectorRoute } from "./_collector";
import { CommandsRoute } from "./_commands";
import { GuildRoute } from "./_guild";
import { InteractionRoute } from "./_interaction";
import { DatabaseRoute } from "./database";

const router: Router = Router();

router.use("/_collector", CollectorRoute)
router.use("/_commands", CommandsRoute);
router.use("/_guild", GuildRoute);
router.use("/_interaction", InteractionRoute);
router.use("/database", DatabaseRoute);

export default router;