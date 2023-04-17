import { Request, Response, Router, json } from 'express';

import { HttpStatusCode } from "../../typings";
import { verifyPrivateRouting } from "../../utils/middleware";

const SessionRoute: Router = Router();

SessionRoute.use(json());

SessionRoute.post("/", verifyPrivateRouting, async (req: Request, res: Response) => {
	
});

SessionRoute.delete("/", verifyPrivateRouting, async (req: Request, res: Response) => {
	
});

export { SessionRoute };