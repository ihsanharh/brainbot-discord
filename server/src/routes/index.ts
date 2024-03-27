import { Router } from 'express';

import { CollectorRoute } from "./_collector";
import { CommandsRoute } from "./_commands";
import { GuildRoute } from "./_guild";
import { InteractionRoute } from "./_interaction";

import V1API from "./v1";

const router: Router = Router();

router.use("/_collector", CollectorRoute);
router.use("/_commands", CommandsRoute);
router.use("/_interaction", InteractionRoute);
router.use("/_guild", GuildRoute);

router.use("/v1", V1API);

export default router;