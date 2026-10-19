import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Space } from 'antd';
import { useState } from 'react';
import validateDateUtil from '@core/utils/validationDateUtil';

function SearchDropdown({ column, type, setParams, dispatch, params, dropdownProps }) {
	const {
		setSelectedKeys,
		selectedKeys,
		confirm,
		clearFilters,
	} = dropdownProps;
	const [error, setError] = useState('');

	const onSearch = () => {
		const value = selectedKeys[0] ?? '';

		if (column.search_rule?.compare_with) {
			const { compare_with, operator, message } = column.search_rule;
			const validated = validateDateUtil(value, params[compare_with], operator);

			if (!validated.isValid) {
				setError(message ?? 'Invalid date');
				return;
			}
		}

		setError('');
		dispatch(setParams({ [column.dataIndex]: value }));
		confirm();
	};

	return (
		<div style={{ padding: 8 }}>
			{error && <Alert type="error" title={error} showIcon style={{ marginBottom: 8 }} />}
			<Input
				type={type ?? 'text'}
				placeholder={`Search ${column.title}`}
				value={selectedKeys[0] ?? ''}
				onChange={(event) => {
					setSelectedKeys(event.target.value ? [event.target.value] : []);
					setError('');
				}}
				onPressEnter={onSearch}
			/>
			<Space style={{ marginTop: 8 }}>
				<Button type="primary" onClick={onSearch}>Search</Button>
				<Button
					onClick={() => {
						clearFilters();
						setError('');
						dispatch(setParams({ [column.dataIndex]: '' }));
						confirm();
					}}
				>
					Reset
				</Button>
			</Space>
		</div>
	);
}

const SearchColumnTable = (column, type, setParams, dispatch, params = {}) => ({
	...column,

	filterDropdown: (dropdownProps) => (
		<SearchDropdown
			column={column}
			type={type}
			setParams={setParams}
			dispatch={dispatch}
			params={params}
			dropdownProps={dropdownProps}
		/>
	),

	filterIcon: (filtered) => (
		<SearchOutlined
			style={{
				color: filtered
					? '#1677ff'
					: undefined,
			}}
		/>
	),
});

export default SearchColumnTable;