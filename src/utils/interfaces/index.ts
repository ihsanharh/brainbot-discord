interface AuthorInterface {
	[key: any]: any;
}

interface CommandChoice {
	name: string;
	name_localization: Localizations;
	value: string | number;
}

interface CommandOption {
	type: number;
	name: string;
	name_localizations?: Localizations;
	description: string;
	description_localizations?: Localizations;
	required: boolean;
	choices?: CommandChoice[];
	options?: CommandOption[];
	channel_types?: string[] | number[];
	min_value?: number;
	max_value?: number;
	autocomplete?: boolean;
}

interface CommandPermission {
	author: string[];
	me: string[];
}

interface DatabaseSearch {
	collection: any;
	method: string;
	query?: any;
	unlimited?: boolean,
	values?: any;
}

interface Localizations {
	[language: string]: string;
}

export {
	AuthorInterface,
	CommandChoice,
	CommandOption,
	CommandPermission,
	DatabaseSearch,
	Localizations
};
