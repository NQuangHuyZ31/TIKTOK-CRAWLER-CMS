import { Form, Image, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";

function AvatarUpload({ preview, onChange }) {
	return (
		<Form.Item label="Avatar">
			<Upload
				accept="image/*"
				listType="picture-card"
				maxCount={1}
				beforeUpload={onChange}
				showUploadList={false}
			>
				{preview ? (
					<Image
						preview={false}
						src={preview}
						alt="Avatar preview"
						width={96}
						height={96}
						style={{
							objectFit: 'cover',
							borderRadius: 8,
						}}
					/>
				) : (
					<div>
						<PlusOutlined />

						<div style={{ marginTop: 8 }}>
							Upload
						</div>
					</div>
				)}
			</Upload>
		</Form.Item>
	);
}

export default AvatarUpload;