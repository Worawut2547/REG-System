import React from 'react';
import { Layout, Button, Form, Input, message, Typography, Card, Avatar } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2'
import { changePassword } from '../../../../../services/auth/change';
import './passwordchange.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const wrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #fff 0%, #f5f5f5 100%)',
};

const headerStyle: React.CSSProperties = {
  background: '#2e236c',
  color: 'white',
  textAlign: 'center',
  padding: 16,
  fontSize: 22,
  letterSpacing: 1,
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  paddingTop: '0px',
  minHeight: '80vh',
};

const cardStyle: React.CSSProperties = {
  maxWidth: 480,
  width: '100%',
  borderRadius: 16,
  boxShadow: '0 8px 32px rgba(44, 44, 84, 0.10)',
  padding: '32px 32px 24px 32px',
  background: '#fff',
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',
  color: 'white',
  textAlign: 'center',
  padding: 12,
};

const PasswordChange: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    if (values.NewPassword !== values.ConfirmPassword) {
      message.error("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    const payload = {
      OldPassword: values.OldPassword,
      NewPassword: values.NewPassword,
    };

    try {
      await changePassword(payload);
      Swal.fire({
        icon: "success",
        title: "สำเร็จ",
        text: "เปลี่ยนรหัสผ่านสำเร็จ",
        confirmButtonColor: "#3085d6",
      });
    }
    catch (error) {
      Swal.fire({
        icon: "error",
        title: "ผิดพลาด",
        text: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
      });
    }
    finally {
      form.resetFields();
    }
  };

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>เปลี่ยนรหัสผ่าน</Header>
      <Content style={contentStyle}>
        <Card style={cardStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
            <Avatar size={64} icon={<UserOutlined />} style={{ background: '#2e236c', marginBottom: 8 }} />
            <Title level={3} style={{ margin: 0 }}>เปลี่ยนรหัสผ่าน</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              กรุณากรอกรหัสผ่านใหม่ที่ปลอดภัยและยืนยันรหัสผ่านอีกครั้ง
            </Text>
          </div>
          <Form
            form={form}
            name="change-password-form"
            layout="vertical"
            onFinish={onFinish}
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="OldPassword"
              label="รหัสผ่านปัจจุบัน"
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่านปัจจุบัน' }]}
            >
              <Input.Password
                placeholder="รหัสผ่านปัจจุบัน"
                prefix={<LockOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="NewPassword"
              label="รหัสผ่านใหม่"
              rules={[
                { required: true, message: 'กรุณากรอกรหัสผ่านใหม่' },
                { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
              ]}
              tooltip="รหัสผ่านควรมีตัวอักษร ตัวเลข และสัญลักษณ์พิเศษเพื่อความปลอดภัย"
            >
              <Input.Password
                placeholder="รหัสผ่านใหม่"
                prefix={<LockOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="ConfirmPassword"
              label="ยืนยันรหัสผ่านใหม่"
              dependencies={['NewPassword']}
              rules={[
                { required: true, message: 'กรุณายืนยันรหัสผ่านใหม่' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('NewPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('รหัสผ่านไม่ตรงกัน'));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="ยืนยันรหัสผ่านใหม่"
                prefix={<LockOutlined />}
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" style={{ borderRadius: 8 }}>
                เปลี่ยนรหัสผ่าน
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
      <Footer style={footerStyle}>Footer © 2025</Footer>
    </Layout>
  );
};

export default PasswordChange;