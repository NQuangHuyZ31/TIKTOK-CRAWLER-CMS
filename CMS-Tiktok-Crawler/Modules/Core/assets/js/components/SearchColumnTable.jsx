import { SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Space } from 'antd';
import { useState } from 'react';
import validateDateUtil from '@modules/Core/assets/js/utils/validationDateUtil';

const SearchColumnTable = (column, params, setParams, type) => ({
	...column,

	filterDropdown: ({
		setSelectedKeys,
		selectedKeys,
		confirm,
		clearFilters,
	}) => {
		const [error, setError] = useState('');

		const onSearch = () => {
			const value = selectedKeys[0] ?? '';

			if (column.search_rule && column.search_rule.compare_with) {
				const {
					compare_with,
					operator,
					message,
				} = column.search_rule;

				const validated = validateDateUtil(
					value,
					params[compare_with],
					operator
				);

				if (!validated.isValid) {
					setError(
						message ?? 'Invalid date'
					);

					return;
				}
			}

			setError('');

			setParams((prev) => ({
				...prev,
				[column.dataIndex]: value,
			}));

			confirm();
		};

		return (
			<div style={{ padding: 8 }}>
				{error && (
					<Alert
						type="error"
						title={error}
						showIcon
						style={{
							marginBottom: 8,
						}}
					/>
				)}

				<Input
					type={type ?? 'text'}
					placeholder={`Search ${column.title}`}
					value={selectedKeys[0] ?? ''}
					onChange={(e) => {
						setSelectedKeys(
							e.target.value
								? [e.target.value]
								: []
						);

						setError('');
					}}
					onPressEnter={onSearch}
				/>

				<Space style={{ marginTop: 8 }}>
					<Button
						type="primary"
						onClick={onSearch}
					>
						Search
					</Button>

					<Button
						onClick={() => {
							clearFilters();
							setError('');

							setParams((prev) => ({
								...prev,
								[column.dataIndex]: '',
							}));

							confirm();
						}}
					>
						Reset
					</Button>
				</Space>
			</div>
		);
	},

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