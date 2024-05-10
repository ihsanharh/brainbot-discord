import { RequestData } from '@discordjs/rest';
import { APIInteraction, Routes } from "discord-api-types/v10";

import { DiscordAppId } from "../utils/config";
import { res } from "../utils/res";

export async function edit_original_response(interaction: APIInteraction | string, payload: RequestData, message_id: string = "@original"): Promise<unknown>
{
	try
	{
		return await res.patch(Routes.webhookMessage(DiscordAppId, (typeof interaction === "object")? interaction.token: interaction, message_id), payload);
	} catch (e: unknown)
    {
		return e;
	}
}

export async function delete_original_response(interaction: APIInteraction | string): Promise<unknown>
{
	try
	{
		return await res.delete(Routes.webhookMessage(DiscordAppId, (typeof interaction === "object")? interaction.token: interaction));
	}
	catch(e: unknown)
    {
		return e;
	}
}

export async function followup_message(interaction: APIInteraction | string, payload: RequestData): Promise<unknown>
{
	try
	{
		return await res.post(`${Routes.webhook(DiscordAppId, (typeof interaction === "object")? interaction.token: interaction)}?wait=true`, payload);
	}
	catch (e: unknown) {
		return e;
	}
}


export async function delete_followup_message(interaction: APIInteraction | string, message_id: string): Promise<unknown>
{
	try
	{
		return await res.delete(Routes.webhookMessage(DiscordAppId, (typeof interaction === "object")? interaction.token: interaction, message_id));
	}
	catch(e: unknown)
	{
		return e;
	}
}