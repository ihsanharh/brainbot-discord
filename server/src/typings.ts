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
export * from "./utils/types";

export type CGuildChannelType = APITextChannel|APINewsChannel|APIGuildVoiceChannel|APIGuildStageVoiceChannel|APIGuildCategoryChannel|APIThreadChannel|APIGuildForumChannel;

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