import { Router } from 'express';

import { CollectorRoute } from "./_collector";
import { CommandsRoute } from "./_commands";
import { CacheRoute } from "./_cache";
import { GuildRoute } from "./_guild";
import { InteractionRoute } from "./_interaction";
import { SessionRoute } from "./_sessions";
import { DatabaseRoute } from "./database";

import V1API from "./v1";

const router: Router = Router();

router.use("/_collector", CollectorRoute)
router.use("/_commands", CommandsRoute);
router.use("/_cache", CacheRoute);
router.use("/_guild", GuildRoute);
router.use("/_interaction", InteractionRoute);
router.use("/_sessions", SessionRoute);
router.use("/database", DatabaseRoute);

router.use("/v1", V1API);

export default router;