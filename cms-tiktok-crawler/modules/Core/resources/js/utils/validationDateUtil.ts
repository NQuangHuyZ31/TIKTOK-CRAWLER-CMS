const validateDateUtil = (
	value,
	compareValue,
	operator
) => {
	// No current value -> valid
	if (!value) {
		return {
			isValid: true,
		};
	}

	// Comparison field missing -> skip validation
	if (!compareValue) {
		return {
			isValid: true,
		};
	}

	const currentDate = new Date(value);
	const compareDate = new Date(compareValue);

	if (
		Number.isNaN(currentDate.getTime()) ||
		Number.isNaN(compareDate.getTime())
	) {
		return {
			isValid: false,
		};
	}

	let isValid = true;

	switch (operator) {
		case '>':
			isValid = currentDate > compareDate;
			break;

		case '>=':
			isValid = currentDate >= compareDate;
			break;

		case '<':
			isValid = currentDate < compareDate;
			break;

		case '<=':
			isValid = currentDate <= compareDate;
			break;

		case '=':
			isValid =
				currentDate.getTime() ===
				compareDate.getTime();
			break;

		default:
			isValid = true;
	}

	return {
		isValid,
	};
};

export default validateDateUtil;