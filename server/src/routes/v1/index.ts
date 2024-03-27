import { Request, Response, Router } from 'express';

import { ApiAuth } from "./auth";
import cache from "./cache";
import database from "./database";

/**
 * New API interface.
 * - all route will always return an application/json, so make sure to accept this content-type on the client side
 * - most route is also protected with authorization
 * 
 * NOTE: status code is crucial. Do not do checking directly on response body, instead check for the response status code first. 
 */

const router: Router = Router();

/**
 * unprotected route 
 */
router.use("/cache", cache);

/**
 * protected route, need Authorization header
 */
router.use(ApiAuth);
router.use("/database", database);

export default router;