declare global {
	namespace NodeJS {
		interface ProcessEnv {
			[k: string]: string | undefined;
		}
	}
}

export {}