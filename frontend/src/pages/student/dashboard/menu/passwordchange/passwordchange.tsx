import React from 'react';
import { Layout, Button, Form, Input, Typography, Card, Avatar } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import { changePassword } from '../../../../../services/auth/change';
import './passwordchange.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const wrapperStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f9f9fb 0%, #f1f2f7 100%)',
};

const headerStyle: React.CSSProperties = {
  background: '#2e236c',
  color: 'white',
  textAlign: 'center',
  padding: 16,
  fontSize: 22,
  letterSpacing: 1,
  fontWeight: 600,
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '80vh',
  padding: '24px',
};

const cardStyle: React.CSSProperties = {
  maxWidth: 480,
  width: '100%',
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(46, 35, 108, 0.15)',
  padding: '32px',
  background: '#fff',
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',
  color: 'white',
  textAlign: 'center',
  padding: 12,
  fontSize: 14,
};

const PasswordChange: React.FC = () => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    if (values.NewPassword !== values.ConfirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน',
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const payload = {
      OldPassword: values.OldPassword,
      NewPassword: values.NewPassword,
    };

    try {
      await changePassword(payload);
      Swal.fire({
        icon: 'success',
        title: 'สำเร็จ',
        text: 'เปลี่ยนรหัสผ่านสำเร็จ',
        confirmButtonColor: "#3085d6",
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'ผิดพลาด',
        text: 'เปลี่ยนรหัสผ่านไม่สำเร็จ',
      });
    } finally {
      form.resetFields();
    }
  };

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>เปลี่ยนรหัสผ่าน</Header>
      <Content style={contentStyle}>
        <Card style={cardStyle}>
          {/* ส่วนหัว */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <Avatar
              size={72}
              icon={<UserOutlined />}
              style={{
                background: '#2e236c',
                marginBottom: 12,
              }}
            />
            <Title level={3} style={{ margin: 0 }}>
              เปลี่ยนรหัสผ่าน
            </Title>
            <Text type="secondary" style={{ fontSize: 14, textAlign: 'center' }}>
              กรุณากรอกรหัสผ่านปัจจุบันและตั้งรหัสผ่านใหม่เพื่อความปลอดภัย
            </Text>
          </div>

          {/* ฟอร์ม */}
          <Form
            form={form}
            name="change-password-form"
            layout="vertical"
            onFinish={onFinish}
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
                { min: 8, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' },
              ]}
              tooltip="ควรมีตัวอักษร ตัวเลข และสัญลักษณ์พิเศษ"
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
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                style={{
                  borderRadius: 8,
                  backgroundColor: '#1890ff',
                  borderBlockColor: '#1890ff'
                }}
              >
                เปลี่ยนรหัสผ่าน
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
      <Footer style={footerStyle}>footer © 2025</Footer>
    </Layout>
  );
};

export default PasswordChange;
