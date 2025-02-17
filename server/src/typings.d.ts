import {
	APIAttachment,
	APIGuildMember,
	APIInteraction,
	APIInteractionResponse,
	APIMessage,
	APIPartialChannel,
	APIRole,
	APITextChannel,
	APINewsChannel,
	APIGuildVoiceChannel,
	APIGuildStageVoiceChannel,
	APIGuildCategoryChannel,
	APIThreadChannel,
	APIGuildForumChannel,
	APIUser,
	ComponentType,
	RESTPostAPIApplicationCommandsJSONBody
} from 'discord-api-types/v10';
import { Readable } from 'stream';

export type CGuildChannelType = APITextChannel|APINewsChannel|APIGuildVoiceChannel|APIGuildStageVoiceChannel|APIGuildCategoryChannel|APIThreadChannel|APIGuildForumChannel;

export type ActionId = "DATABASE"|"CACHE"|"COLLECTOR";

export const enum OwnResponsePayloadType
{
	REQUEST,
	AUTHENTICATION,
	DATABASE_QUERY,
	CACHE,
	DISCORD_API
}

export const enum ActionDataOp
{
	FIND_ONE,
	GET_ONE,
	CREATE_ONE,
	UPDATE_ONE,

	FIND,
	GET,
	CREATE,
	UPDATE,
	
	COLLECT,
	END,
	RESULT
}

interface ActionData
{
	op: ActionDataOp;
	params: unknown;
}

export interface Action
{
	id: ActionId;
	data: ActionData;
}

export interface InteractionResponse
{
	body: Readable | string,
	headers: unknown;
}

export interface OwnResponsePayload
{
	m: string; // must be like this: "404: Not Found.", use formatOwnResponse function to format it.
	t: OwnResponsePayloadType; // type of response
	d: unknown;
}

export interface CollectorDatatimeout
{
	hours?: number | string;
	minutes?: number | string;
	seconds?: number | string;
	milliseconds?: number | string;
}

export interface CollectorData
{
	id: string;
	filename: string;
	pwd: string;
	component_ids: string[];
	time: number | string | CollectorDatatimeout;
	expand_on_click?: boolean;
	message?: APIMessage;
	collected?: APIInteraction[];
	component_types?: ComponentType[];
}

export interface getOptionsReturnValues extends Object
{
	user: APIUser;
	member: APIGuildMember;
	role: APIRole;
	channel: APIPartialChannel;
	attachment: APIAttachment;
	message: APIMessage;
}

export type command_metadata = RESTPostAPIApplicationCommandsJSONBody;