import React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

export default function DocNotFound() {
	return (
		<div style={{ padding: '60px 20px', textAlign: 'center' }}>
			<Result
				status="404"
				title="Article Not Found"
				subTitle="The requested documentation article does not exist or has been moved."
				extra={
					<Link to="/guideline">
						<Button type="primary">Return to Guidelines Home</Button>
					</Link>
				}
			/>
		</div>
	);
}
