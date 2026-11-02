/**
 * Clean and parse comma, semicolon, or newline separated usernames or URLs.
 */
export function extractCleanUsernames(text?: string): string[] {
	if (!text) return [];
	const items = text
		.split(/[\n,;]+/)
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			const match = entry.match(/tiktok\.com\/@([a-zA-Z0-9._]+)/);
			if (match && match[1]) {
				return match[1];
			}
			return entry.replace(/^@+/, '').trim();
		})
		.filter(Boolean);

	return Array.from(new Set(items));
}

/**
 * Clean and parse comma, semicolon, or newline separated URLs.
 */
export function extractCleanUrls(text?: string): string[] {
	if (!text) return [];
	const items = text
		.split(/[\n,;]+/)
		.map((entry) => entry.trim())
		.filter(Boolean);

	return Array.from(new Set(items));
}
