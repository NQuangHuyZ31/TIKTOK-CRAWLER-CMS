const splitWords = (value: string): string[] =>
	(value || '')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.trim()
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean);

const capitalize = (word: string): string =>
	word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '';

/**
 * Convert string to StudlyCase / PascalCase (e.g. "audit_log" -> "AuditLog").
 */
export function toStudlyCase(value: string): string {
	return splitWords(value).map(capitalize).join('');
}

/**
 * Convert string to Headline Case (e.g. "audit_log" -> "Audit Log").
 */
export function toHeadlineCase(value: string): string {
	return splitWords(value).map(capitalize).join(' ');
}

/**
 * Convert string to kebab-case (e.g. "audit_log" -> "audit-log").
 */
export function toKebabCase(value: string): string {
	return splitWords(value)
		.map((part) => part.toLowerCase())
		.join('-');
}

/**
 * Convert string to snake_case (e.g. "audit-log" -> "audit_log").
 */
export function toSnakeCase(value: string): string {
	return splitWords(value)
		.map((part) => part.toLowerCase())
		.join('_');
}
