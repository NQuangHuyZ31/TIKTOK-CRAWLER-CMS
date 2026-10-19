const formatCurrency = (value) => {
	let formattedValue = value;

	if (value === null || value === undefined) {
		return '';
	}

	if (typeof formattedValue !== 'number') {
		formattedValue = parseFloat(value);
	}

	if (formattedValue === 0) {
		return '0';
	}

	if (formattedValue < 0) {
		return `-${formatCurrency(-formattedValue)}`;
	}

	if (formattedValue < 1000) {
		return formattedValue.toString();
	}

	if (formattedValue < 1000000) {
		return `${(formattedValue / 1000).toFixed(1)}K`;
	}

	if (formattedValue < 1000000000) {
		return `${(formattedValue / 1000000).toFixed(1)}M`;
	}

	if (formattedValue < 1000000000000) {
		return `${(formattedValue / 1000000000).toFixed(1)}B`;
	}
}

export default formatCurrency;