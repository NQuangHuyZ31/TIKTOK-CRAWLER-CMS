import React from 'react';
import { Card, Col, Form, Input, InputNumber, Row, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function CrawlerSettingsTab() {
    return (
        <Card
            bordered={false}
            title={
                <span>
                    <RobotOutlined style={{ color: '#722ed1', marginRight: 8 }} />
                    Crawler Engine & Scraper Parameters
                </span>
            }
        >
            <Row gutter={[24, 16]}>
                <Col span={24}>
                    <Form.Item
                        name="crawler_api_url"
                        label="Scraper Backend API URL"
                        rules={[
                            { required: true, message: 'Crawler API URL is required' },
                            { type: 'url', message: 'Enter a valid URL' },
                        ]}
                        extra="Endpoint dispatched when a crawl job session is started."
                    >
                        <Input placeholder="http://127.0.0.1:8000/api/crawler" />
                    </Form.Item>
                </Col>

                <Col span={24} md={8}>
                    <Form.Item
                        name="default_concurrency"
                        label="Default Concurrency Workers"
                        rules={[{ required: true, message: 'Concurrency is required' }]}
                        extra="Number of accounts scraped in parallel."
                    >
                        <InputNumber min={1} max={50} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col span={24} md={8}>
                    <Form.Item
                        name="request_timeout_seconds"
                        label="Request Timeout (Seconds)"
                        rules={[{ required: true, message: 'Timeout is required' }]}
                        extra="Max execution time per network request."
                    >
                        <InputNumber min={5} max={300} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col span={24} md={8}>
                    <Form.Item
                        name="retry_attempts"
                        label="Automatic Retry Attempts"
                        rules={[{ required: true, message: 'Retry attempts required' }]}
                        extra="Retries on transient network failures."
                    >
                        <InputNumber min={0} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col span={24} md={12}>
                    <Form.Item
                        name="max_videos_per_account"
                        label="Max Videos Per Account Run"
                        rules={[{ required: true, message: 'Max videos required' }]}
                        extra="Ceiling limit of video items extracted per profile."
                    >
                        <InputNumber min={1} max={5000} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>

                <Col span={24} md={12}>
                    <Form.Item
                        name="default_proxy"
                        label="Default Proxy Gateway"
                        extra="Optional residential or datacenter proxy string (http://username:password@host:port)."
                    >
                        <Input placeholder="Optional proxy connection string" />
                    </Form.Item>
                </Col>
            </Row>
        </Card>
    );
}
