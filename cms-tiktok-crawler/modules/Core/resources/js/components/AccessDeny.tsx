import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function () {
	const navigate = useNavigate();

	return (
		<Result
			status="403"
			title="403 - Access Denied"
			subTitle="You do not have the required role to access this section."
			extra={
				<Button type="primary" onClick={() => navigate('/dashboard')}>
					Back to Dashboard
				</Button>
			}
		/>
	);
}
