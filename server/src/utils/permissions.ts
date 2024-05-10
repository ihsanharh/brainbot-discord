import { APIGuildMember, APIRole, APIOverwrite, PermissionFlagsBits } from 'discord-api-types/v10';
import { CGuildChannelType } from '../typings';

import { getGuildRoles } from './functions';

/**
 * snippets from discord docs
 * https://discord.com/developers/docs/topics/permissions
 */

function ALL(): bigint
{
    return Object.values(PermissionFlagsBits).reduce((prev: bigint, curr: bigint) => prev | curr);
}

export function from_string(permissions: string): bigint
{
	let bits = 0n;
	let split_perms = permissions.split("|");

	split_perms.forEach((perm: string) => {
		bits |= BigInt(PermissionFlagsBits[perm as keyof typeof PermissionFlagsBits]);
	});

	return bits;
}

export async function compute_base_permissions(member: APIGuildMember, guild_id: string): Promise<bigint>
{
    var permission: bigint = 0n;
    const guild_roles = await getGuildRoles(guild_id);

    if (guild_roles) permission = BigInt(guild_roles.filter((role: APIRole) => role.id === guild_id)[0].permissions);
    if (guild_roles) guild_roles.forEach((role: APIRole) => {
        if (member.roles.includes(role.id)) permission |= BigInt(role.permissions);
    });

    if ((permission & PermissionFlagsBits.Administrator) == PermissionFlagsBits.Administrator) return ALL();

    return permission;
}

export async function compute_overwrites(base_permissions: bigint, member: APIGuildMember, channel: CGuildChannelType): Promise<bigint>
{
    if ((base_permissions & PermissionFlagsBits.Administrator) == PermissionFlagsBits.Administrator) return ALL();

    var permissions = base_permissions;
    let allow: bigint = 0n, deny: bigint = 0n;

    if (!channel.permission_overwrites) return permissions;

    const overwrite_everyone = channel.permission_overwrites?.filter((overwrite: APIOverwrite) => overwrite.id === channel.guild_id)[0];
    if (overwrite_everyone)
    {
        permissions &= ~BigInt(overwrite_everyone.deny);
        permissions |= BigInt(overwrite_everyone.allow);
    }

    channel.permission_overwrites.forEach((overwrite: APIOverwrite) => {
        if (member.roles.includes(overwrite.id))
        {
            allow |= BigInt(overwrite.allow);
            deny |= BigInt(overwrite.deny);
        }
    });

    permissions &= ~deny;
    permissions |= allow;

    const overwrite_member = channel.permission_overwrites.filter((overwrite: APIOverwrite) => overwrite.id === member.user?.id)[0];
    if (overwrite_member)
    {
        permissions &= ~BigInt(overwrite_member.deny);
        permissions |= BigInt(overwrite_member.allow);
    }

    return permissions;
}

export async function compute_permission(member: APIGuildMember, channel: CGuildChannelType): Promise<bigint>
{
    const base_permissions = await compute_base_permissions(member, channel.guild_id as string);
    return compute_overwrites(base_permissions, member, channel);
}