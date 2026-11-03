import { useState, useEffect, useMemo } from 'react';
import { formatNumber } from '../../utils/formatNumber';
import type { NumericPreset } from '../NumericRangeFilter';

export function useNumericRangeFilter(
	value?: string,
	presets: NumericPreset[] = [],
	onChange?: (value: string | undefined) => void
) {
	const [open, setOpen] = useState(false);
	const [customMin, setCustomMin] = useState<number | null>(null);
	const [customMax, setCustomMax] = useState<number | null>(null);

	useEffect(() => {
		if (!value) {
			setCustomMin(null);
			setCustomMax(null);
			return;
		}
		if (value.includes('..')) {
			const parts = value.split('..');
			setCustomMin(parts[0] ? Number(parts[0]) : null);
			setCustomMax(parts[1] ? Number(parts[1]) : null);
		} else if (value.startsWith('>=')) {
			setCustomMin(Number(value.replace('>=', '')));
			setCustomMax(null);
		} else if (value.startsWith('<=')) {
			setCustomMin(null);
			setCustomMax(Number(value.replace('<=', '')));
		} else if (value.startsWith('<')) {
			setCustomMin(null);
			setCustomMax(Number(value.replace('<', '')));
		} else if (value.startsWith('>')) {
			setCustomMin(Number(value.replace('>', '')));
			setCustomMax(null);
		}
	}, [value]);

	const displayLabel = useMemo(() => {
		if (!value) return null;
		const matchingPreset = presets.find((p) => p.value === value);
		if (matchingPreset) return matchingPreset.label;

		if (value.includes('..')) {
			const [min, max] = value.split('..');
			return `${formatNumber(min)} - ${formatNumber(max)}`;
		}
		if (value.startsWith('>=')) return `≥ ${formatNumber(value.replace('>=', ''))}`;
		if (value.startsWith('<=')) return `≤ ${formatNumber(value.replace('<=', ''))}`;
		if (value.startsWith('<')) return `< ${formatNumber(value.replace('<', ''))}`;
		if (value.startsWith('>')) return `> ${formatNumber(value.replace('>', ''))}`;
		return value;
	}, [value, presets]);

	const handleApplyCustom = () => {
		let finalVal: string | undefined;
		if (customMin !== null && customMax !== null) {
			finalVal = `${Math.min(customMin, customMax)}..${Math.max(customMin, customMax)}`;
		} else if (customMin !== null) {
			finalVal = `>=${customMin}`;
		} else if (customMax !== null) {
			finalVal = `<=${customMax}`;
		}
		onChange?.(finalVal);
		setOpen(false);
	};

	const handleClear = (e?: React.MouseEvent) => {
		e?.stopPropagation();
		setCustomMin(null);
		setCustomMax(null);
		onChange?.(undefined);
		setOpen(false);
	};

	return {
		open,
		setOpen,
		customMin,
		setCustomMin,
		customMax,
		setCustomMax,
		displayLabel,
		handleApplyCustom,
		handleClear,
	};
}
