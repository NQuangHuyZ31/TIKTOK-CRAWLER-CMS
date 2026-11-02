import React from 'react';
import { Col, Row } from 'antd';
import {
	HeartOutlined,
	UserAddOutlined,
	UserOutlined,
	VideoCameraOutlined,
} from '@ant-design/icons';
import CardKPI from '@core/components/CardKPI';
import { formatNumber } from '@core/utils/formatNumber';

interface AccountKpiSectionProps {
	account: any;
}

export default function AccountKpiSection({ account }: AccountKpiSectionProps) {
	return (
		<Row gutter={[16, 16]}>
			<Col xs={24} sm={12} md={6}>
				<CardKPI
					title="Followers"
					value={formatNumber(account?.followers_count || 0)}
					icon={<UserAddOutlined />}
					color="#1677ff"
				/>
			</Col>
			<Col xs={24} sm={12} md={6}>
				<CardKPI
					title="Following"
					value={formatNumber(account?.following_count || 0)}
					icon={<UserOutlined />}
					color="#52c41a"
				/>
			</Col>
			<Col xs={24} sm={12} md={6}>
				<CardKPI
					title="Total Likes"
					value={formatNumber(account?.likes_count || 0)}
					icon={<HeartOutlined />}
					color="#fa8c16"
				/>
			</Col>
			<Col xs={24} sm={12} md={6}>
				<CardKPI
					title="Total Videos"
					value={formatNumber(account?.video_count || 0)}
					icon={<VideoCameraOutlined />}
					color="#722ed1"
				/>
			</Col>
		</Row>
	);
}
