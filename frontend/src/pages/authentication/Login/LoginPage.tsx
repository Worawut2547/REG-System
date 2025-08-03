import React from 'react';
import { Button, Form, Input, Row, Col, message } from 'antd';
import { useNavigate } from 'react-router-dom';

import { type SignInInterface } from '../../../interfaces/SignIn/SignIn';

//Pictures
import logo from "../../../assets/logo.png"
import userIcon from "../../../assets/user-icon.png"
import lockIcon from "../../../assets/lock-icon.png"

//import LoginPage.css
import "./LoginPage.css"

function LoginPage() {
    const navigate = useNavigate();
    const [messageApi, contextHoider] = message.useMessage();

    const onFinish = async (values: SignInInterface) => {
        console.log(values)
    }

    return (
        <div className="login-container">
            <div className="login-left">
                <img src={logo} alt="Logo" className="login-logo" />
                <Form
                    name="login-form"
                    onFinish={onFinish}
                    layout="vertical"
                    className="login-form"
                >
                    <Form.Item name="username">
                        <Input
                            placeholder="User name"
                            prefix={<img src={userIcon} className="icon" alt="user" />}
                            size="large"
                        >
                        </Input>
                    </Form.Item>

                    <Form.Item name="password">
                        <Input
                            placeholder="Password"
                            prefix={<img src={lockIcon} className="icon" alt="password" />}
                            size="large"
                        >
                        </Input>
                    </Form.Item>

                    <div className="forgot-password">Forgot Password</div>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="login-button">
                            LOGIN
                        </Button>
                    </Form.Item>

                </Form>
            </div>
            {/*
            <div className = "login-right">
                <img src = {building} className = "building-image" alt = "Building" />
            </div>
             */}

        </div>
    )
}


export default LoginPage;