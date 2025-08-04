import React from 'react';
import { Button, Form, Input , Col, Row} from 'antd';
import { useNavigate } from 'react-router-dom';
import { type SignInInterface } from '../../../interfaces/SignIn';

//Pictures
import logo from "../../../assets/logo.png"
import userIcon from "../../../assets/user-icon.png"
import lockIcon from "../../../assets/lock-icon.png"
import building from "../../../assets/building.png"
//import LoginPage.css
import "./LoginPage.css"

function LoginPage() {

    const onFinish = async (values: SignInInterface) => {
        console.log(values)
    }
    const navigate = useNavigate();

    const handleClick = (action: string) => {
        if(action === 'login'){
            navigate('/dashboard');
        }
        
    };

    return (
        <div className="login-container">
            <Row style={{ height: '100vh' }} align="middle" justify="center">
                <Col span={12} style={{ display: 'center', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="login-left">
                        <img src={logo} alt="Logo" className="login-logo" style={{ maxWidth: '200px', height: 'auto' }}/>
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
                                    size="small"
                                >
                                </Input>
                            </Form.Item>

                            <Form.Item name="password">
                                <Input
                                    placeholder="Password"
                                    prefix={<img src={lockIcon} className="icon" alt="password" />}
                                    size="small"
                                >
                                </Input>
                            </Form.Item>
                            <Button color="default" variant="text" style = {{color: "#fd0000ff", fontSize: "14px", marginBottom: "5px" }}>
                                    Forgot Password
                            </Button>
                            <Form.Item>
                                    <Button onClick={() => handleClick('login')} type="primary" htmlType="submit" className="login-button" size="small">
                                    LOGIN
                                    </Button>
                            </Form.Item>
                        </Form>
                    </div>
                </Col>
                <Col span={12}  push={7} style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <div className = "login-right">
                        <img src = {building} className = "building-image" alt = "Building" style={{ maxWidth: '400px', height: 'auto' }} />
                    </div>
                </Col>
            </Row>

        </div>
    )
}


export default LoginPage;