import {
	APIAttachment,
	APIGuildMember,
	APIInteraction,
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
	APIUser
} from 'discord-api-types/v10';

export * from 'discord-api-types/v10';
export * from "./utils/types"

export type CGuildChannelType = APITextChannel|APINewsChannel|APIGuildVoiceChannel|APIGuildStageVoiceChannel|APIGuildCategoryChannel|APIThreadChannel|APIGuildForumChannel;

export enum OwnResponsePayloadType {
	REQUEST,
	AUTHENTICATION,
	DATABASE_QUERY,
	CACHE,
	DISCORD_API
}

export interface CheckPredictionType {
	tensec_m?: APIMessage;
	helpful_m?: APIMessage;
	prediction: PredictionObject;
}

interface PredictionOutput {
	url: string;
	data: string;
}

export interface PredictionObject {
	status: string;
	created_at: string;
	logs: string;
	metrics: {
		predict_time: number;
	};
	output: PredictionOutput[];
	[k: string]: unknown;
}

export interface OwnResponsePayload {
	m: string; // must be like this: "404: Not Found.", use formatOwnResponse function to format it.
	t: OwnResponsePayloadType; // type of response
	d: unknown;
}

export interface GuildCD
{
	id: string;
	shard_id?: string;
	guild?: string;
}

export interface CollectorData
{
	id: string;
	command: boolean;
	name: string;
	pwd: string;
	time: number | string;
	expand: boolean;
	message?: APIMessage;
	ids: string[];
	collected?: APIInteraction[];
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

export interface command_metadata
{
	name: string;
	name_localizations?:
	{
		[key: string]: string;
	};
	description: string;
	description_localizations?:
	{
		[key: string]: string;
	};
	options?: {[k: string]: any}[];
	default_member_permissions?: string;
	dm_permission?: boolean;
	type?: number | string;
}