import { OwnResponsePayloadType, OwnResponsePayload } from "../typings";
import { formatOwnResponse } from "../utils/functions";
import { HttpStatusCode } from "../utils/types/http";
import * as responses from "../constants/responses";

/**
 * format response before sending it to client.
 * @param {string[]} argv - args for @ params on response string
 * @param {OwnResponsePayloadType} type - the type of this response
 * @param {string} r_str - path of the response string
 * @param {unknown} data - the data to be sent
 * @returns {OwnResponsePayload} formatted response
 * @example
 * asOwnResponse([`${HttpStatusCode.OK}`], OwnResponsePayloadType.REQUEST, "Common.Found", {data:true});
 * // will results: 
 * // {
 * //   m: "200: Found.",
 * //   t: 0,
 * //   d: {
 * //     data: true
 * //   }
 * // }
 */
export function asOwnResponse(argv: string[], type: OwnResponsePayloadType, r_str?: string, data?: unknown): OwnResponsePayload
{
	var m, d;
	
	if (data) d = data;
	if (r_str)
	{
		let r_str_s = r_str?.split(".");
		let get_str = {...responses}?.[r_str_s?.[0]]?.[r_str_s?.[1]];
		
		if (get_str) m = formatOwnResponse(get_str, argv);
		else m = formatOwnResponse(r_str, argv);
	}
	
	return <OwnResponsePayload>{
		m,
		t: type,
		d
	}
}