import { Router } from 'express';

import { CollectorRoute } from "./_collector";
import { CommandsRoute } from "./_commands";
import { RuntimeRoute } from "./_runtime";
import { InteractionRoute } from "./_interaction";

import V1API from "./v1";

const router: Router = Router();

router.use("/_collector", CollectorRoute);
router.use("/_commands", CommandsRoute);
router.use("/_itr_", InteractionRoute);
router.use("/__rntm", RuntimeRoute);

router.use("/v1", V1API);

export default router;