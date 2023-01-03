import Sessions, { Session } from "../schemas/session";
const CachedSessions: Map<string, string> = new Map<string, string>();
const ActiveSessions: Map<string, string> = new Map<string, string>();

/*
 * to be implemented.
 */

export async function createSession(user: string): Promise<Session|string>
{
	try
	{
		
		const new_session = await (new Sessions({
			user: user,
			agent: "userAgent"
		})).save() as Session;
		
		CachedSessions.set(new_session.user, new_session._id);
		
		return new_session;
	}
	catch(error: unknown)
	{
		console.error(error);
		return "failed init a new session.";
	}
}

export async function deleteSession(id: string)
{
	if (ActiveSessions.has(id)) ActiveSessions.delete(id);
	await Sessions.findOneAndDelete({ _id: id });
}

export async function getSessions(): Promise<string[]>
{
	return Array.from(ActiveSessions.values());
}

export async function updateSession(): Promise<any>
{}
