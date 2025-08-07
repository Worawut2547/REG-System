import { Button, Form, Input, Col, Row, message } from 'antd';
import { useNavigate } from 'react-router-dom';

// สำหรับจัดการข้อมูลการ Login
import SignIn from '../../../services/auth/auth';

//Pictures
import logo from "../../../assets/logo.png"
import userIcon from "../../../assets/user-icon.png"
import lockIcon from "../../../assets/lock-icon.png"
import building from "../../../assets/building.png"

import "./LoginPage.css"

function LoginPage() {
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            const response = await SignIn(values);
            console.log("Login response:", response);
            /*console.log("FirstName:", response.FirstName);
            console.log("LastName:", response.LastName);
            console.log("Token:", response.token);
            console.log("Token Type:", response.token_type);*/

            // บันทึก token ลง localStorage
            localStorage.setItem("firstname", response.FirstName);
            localStorage.setItem("lastname", response.LastName);
            localStorage.setItem("role", response.Role);
            localStorage.setItem("username", response.Username);
            localStorage.setItem("token", response.token);
            localStorage.setItem("token_type", response.token_type);

            // แสดงข้อความ
            message.success("Login success");

            // ส่งไปยัง path ตาม role
            const role = response.Role.toLowerCase();
            if (role === "student") {
                navigate("/student/dashboard");
            } else if (role === "teacher") {
                navigate("/teacher/dashboard");
            } else if (role === "admin") {
                navigate("/admin/dashboard");
            } else {
                message.error("Unauthorized role");
            }
        } catch (err) {
            console.error(err);
            message.error("Login failed. Please check your credentials.");
        }
    };

    return (
        <div className="login-container">
            <Row style={{ height: '100vh' }} align="middle" justify="center">
                <Col span={12} style={{ display: 'center', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="login-left">
                        <img src={logo} alt="Logo" className="login-logo" style={{ maxWidth: '200px', height: 'auto' }} />
                        <Form
                            name="login-form"
                            onFinish={onFinish}
                            layout="vertical"
                            className="login-form"
                        >
                            <Form.Item
                                name="username"
                                rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
                            >
                                <Input
                                    placeholder="User name"
                                    prefix={<img src={userIcon} className="icon" alt="user" />}
                                    size="small"
                                />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
                            >
                                <Input.Password
                                    placeholder="Password"
                                    prefix={<img src={lockIcon} className="icon" alt="password" />}
                                    size="small"
                                />
                            </Form.Item>
                            <Button color="default" variant="text" style={{ color: "#fd0000ff", fontSize: "14px", marginBottom: "5px" }}>
                                Forgot Password
                            </Button>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" className="login-button" size="small">
                                    LOGIN
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Col>
                <Col span={12} push={7} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div className="login-right">
                        <img src={building} className="building-image" alt="Building" style={{ maxWidth: '400px', height: 'auto' }} />
                    </div>
                </Col>
            </Row>
        </div>
    )
}

export default LoginPage;
