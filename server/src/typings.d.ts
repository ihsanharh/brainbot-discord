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

export enum OwnResponsePayloadType
{
	REQUEST,
	AUTHENTICATION,
	DATABASE_QUERY,
	CACHE,
	DISCORD_API
}

export interface InteractionResponse
{
	body: Readable | string,
	headers: unknown;
}

export interface PredictionLimit
{
	today: number;
	daily_quota: number | string;
	last_timestamp: number;
}

export interface CheckPredictionType
{
	tensec_m?: APIMessage;
	helpful_m?: APIMessage;
	nsfw_found?: boolean;
	prediction: PredictionObject;
}

interface PredictionOutput
{
	url: string;
	data: string;
}

export interface PredictionObject
{
	status: string;
	created_at: string;
	error: string;
	logs: string;
	metrics: {
		predict_time: number;
	};
	output: PredictionOutput[];
	[k: string]: unknown;
}

export interface PredictionRequestJson
{
	_?: {
		num_outputs: number;
		height: number;
		width: number;
	},
	model: string;
	exist?: boolean;
	name?: string;
	tag_name?: string;
	version?: string;
	default?: PredictionRequestJsonDefault;
}

export interface PredictionRequestJsonDefault
{
	apply_watermark?: boolean;
	guidance_scale?: number;
	high_noise_frac?: number;
	lora_scale?: number;
	negative_prompt?: string;
	num_inference_steps?: number;
	num_inference_steps_prior?: number;
	num_outputs?: number;
	output_format?: string;
	width?: number;
	height?: number;
	prompt?: string;
	prompt_strength?: number;
	refine?: string;
	scheduler?: string;
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