// src/pages/authentication/ForgotPage.tsx
import { Button, Form, Input, Col, Row } from 'antd';
import Swal from 'sweetalert2';

import { resetPassword } from '../../../services/auth/change';
//Pictures
import logo from "../../../assets/logo.png";
import lockIcon from "../../../assets/lock-icon.png";
import userIcon from "../../../assets/user-icon.png";
//import building from "../../../assets/building.png";

import './ForgotPage.css'


function ForgotPage({ onBack }: { onBack: () => void }) {

    const onForgotSubmit = async (values: any) => {
        // ตรวจสอบรหัสผ่านใหม่ตรงกับการยืนยันรหัสผ่าน
        if (values.NewPassword !== values.ConfirmPassword) {
            Swal.fire({
                icon: "error",
                title: "ผิดพลาด",
                text: "รหัสผ่านใหม่เเละการยืนยันไม่ตรงกัน"
            })
            return
        }

        // สร้าง payload สำหรับ backend
        const payload = {
            Username: values.Username,
            NewPassword: values.NewPassword,
        };

        try {
            await resetPassword(payload);
            Swal.fire({
                icon: "success",
                title: "สำเร็จ",
                text: "เปลี่ยนรหัสผ่านสำเร็จ",
                confirmButtonColor: "#3085d6",
            });
        }
        catch (error) {
            console.error("เกิดข้อผิดพลาดในการแก้ไขนักศึกษา:", error);
            Swal.fire({
                icon: "error",
                title: "ผิดพลาด",
                text: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
            });
        }
    };

    const [form] = Form.useForm();
    return (
        <div className="forgot-container">
            <Row style={{ height: '100vh' }} align="middle" justify="center">
                <Col span={12} style={{ display: 'center', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="forgot-left">
                        <img
                            src={logo}
                            alt="Logo"
                            className="forgot-logo"
                            style={{ maxWidth: '200px', height: 'auto' }}
                        />
                        <Form
                            form={form}
                            name="change-password-form"
                            onFinish={onForgotSubmit}
                            layout="vertical"
                            className="forgot-form"
                        >
                            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                                เปลี่ยนรหัสผ่าน
                            </h2>

                            {/* Username */}
                            <Form.Item
                                name="Username"
                                rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
                            >
                                <Input
                                    placeholder="User name"
                                    prefix={<img src={userIcon} className="icon" alt="user" />}
                                    size="small"
                                />
                            </Form.Item>

                            {/* New Password */}
                            <Form.Item
                                name="NewPassword"
                                rules={[
                                    { required: true, message: 'กรุณากรอกรหัสผ่านใหม่' },
                                    { min: 6, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' }
                                ]}
                            >
                                <Input.Password
                                    placeholder="รหัสผ่านใหม่"
                                    prefix={<img src={lockIcon} className="icon" alt="new password" />}
                                    size="small"
                                />
                            </Form.Item>

                            {/* Confirm New Password */}
                            <Form.Item
                                name="ConfirmPassword"
                                rules={[{ required: true, message: 'กรุณายืนยันรหัสผ่านใหม่' }]}
                            >
                                <Input.Password
                                    placeholder="ยืนยันรหัสผ่านใหม่"
                                    prefix={<img src={lockIcon} className="icon" alt="confirm password" />}
                                    size="small"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    className="forgot-button"
                                    size="small"
                                >
                                    เปลี่ยนรหัสผ่าน
                                </Button>
                            </Form.Item>

                            <div style={{ textAlign: "center" }}>
                                <Button
                                    color="default"
                                    variant="text"
                                    style={{ color: "#1677ff", fontSize: "14px" }}
                                    onClick={onBack}
                                >
                                    กลับไปหน้า Login
                                </Button>
                            </div>
                        </Form>
                    </div>
                </Col>
                {/* building}
                <Col span={12} push={7} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div className="forgot-right">
                        <img
                            src={building}
                            className="building-image"
                            alt="Building"
                            style={{ maxWidth: '400px', height: 'auto' }}
                        />
                    </div>
                </Col>
                {*/}
            </Row>
        </div>
    );

}

export default ForgotPage;
