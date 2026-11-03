import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Row, Col, Space, Button, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@core/store';
import PageHeader from '@core/components/PageHeader';
import { fetchUserDetail } from '../store/user/userThunks';
import { ROLE_CONFIGS } from '../configs/userConstants';
import UserProfileOverviewCard from '../components/userDetail/UserProfileOverviewCard';
import UserAccountInfoCard from '../components/userDetail/UserAccountInfoCard';
import UserPrivilegesCard from '../components/userDetail/UserPrivilegesCard';

export default function UserDetailPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const { currentUser: user, detailLoading: loading } = useSelector((state) => state.user);

	useEffect(() => {
		if (id) {
			dispatch(fetchUserDetail(id));
		}
	}, [dispatch, id]);

	if (loading) {
		return (
			<div style={{ padding: 40, textAlign: 'center' }}>
				<Spin size="large" tip="Loading user profile..." />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	const primaryRole = user.roles?.[0]?.slug || 'viewer';
	const roleCfg = ROLE_CONFIGS[primaryRole] || ROLE_CONFIGS.viewer;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<PageHeader
				title={`User: ${user.name}`}
				subtitle="View user account profile details, assigned role, and module permissions matrix."
				onBack={() => navigate('/user')}
				breadcrumbs={[{ title: 'Dashboard', href: '/admin/dashboard' }, { title: 'Users', href: '/admin/user' }, { title: user.name || 'User Detail' }]}
				extra={
					<Space wrap>
						<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/user')}>
							Back to Users
						</Button>
						<Link to={`/user/${user.id}/edit`}>
							<Button type="primary" icon={<EditOutlined />}>
								Edit User
							</Button>
						</Link>
					</Space>
				}
			/>

			<UserProfileOverviewCard user={user} roleCfg={roleCfg} />

			<Row gutter={[20, 20]}>
				<Col xs={24} lg={12}>
					<UserAccountInfoCard user={user} />
				</Col>

				<Col xs={24} lg={12}>
					<UserPrivilegesCard user={user} roleCfg={roleCfg} />
				</Col>
			</Row>
		</div>
	);
}
