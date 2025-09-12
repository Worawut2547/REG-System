import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // ✅ ADD
import name_white from "../../../assets/name_white.png";
import shortLogo from "../../../assets/logo_white.png";
import { type AdminInterface } from '../../../interfaces/Admin'

/* ---------- page components ---------- */
import MainPage from './menu/mainpage/mainpage';
import RegisterPage from './menu/register/register';
import CoursePage from './menu/course/course';
import GradePage from './menu/grade/grade';
import ScorePage from './menu/score/score';
import PaymentPage from './menu/payment/payment';
import StudentPage from './menu/student/mainpage';
import TeacherPage from './menu/teacher/mainpage';
import ReportPage from './menu/report/report';
import GraduatePage from './menu/graduate/graduate';
import CurriculumPage from './menu/curriculum/curriculum';
import PasswordPage from './menu/passwordchange/passwordchange';

import './dashboard.css';

import {
  HomeOutlined,
  ScheduleOutlined,
  BookOutlined,
  UserOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  ReadOutlined,
  ContactsOutlined,
  SolutionOutlined,
  ApartmentOutlined,
  FormOutlined,
  ExclamationCircleOutlined,
  BankOutlined,
} from '@ant-design/icons';

import { Button, Layout, Menu, Col, Row } from 'antd';
import { getNameAdmin } from '../../../services/https/admin/admin';
const { Header, Sider, Content } = Layout;

const AdminDashboardpage: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<string>('หน้าหลัก');
  const [student, setStudent] = useState<AdminInterface | null>(null);

  const navigate = useNavigate();
  const location = useLocation(); // ✅ ADD

  // ✅ ADD: map ชื่อเมนู ↔ slug สำหรับใช้ใน URL
  const keyToSlug: Record<string, string> = {
    'หน้าหลัก': 'home',
    'ลงทะเบียนเรียน': 'register',
    'วิชาที่เปิดสอน': 'course',
    'ผลการเรียน': 'grade',
    'คะแนน': 'score',
    'ใบแจ้งยอดชำระ': 'payment',
    'นักศึกษา': 'student',
    'อาจารย์': 'teacher',
    'คำร้อง': 'report',
    'แจ้งจบการศึกษา': 'graduate',
    'หลักสูตร': 'curriculum',
    'เปลี่ยนรหัสผ่าน': 'password',
  };
  const slugToKey: Record<string, string> = Object.fromEntries( // ✅ ADD
    Object.entries(keyToSlug).map(([k, v]) => [v, k])
  );

  useEffect(() => {
    // ดึง username จาก localStorage
    const username = localStorage.getItem("username");
    
    if(username){
      getNameAdmin(username)
      .then(setStudent)
      .catch(console.error)
    }
    else{
      console.error("Username is missing!");
    }
  }, []);

  // ✅ ADD: sync activePage จาก query ?tab=... ทุกครั้งที่ URL เปลี่ยน
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') ?? 'home';
    const key = slugToKey[tab] ?? 'หน้าหลัก';
    setActivePage(key);
  }, [location.search, slugToKey]); 

  const handleMenuClick = (e: { key: string }) => {
    if (e.key === 'ออกจากระบบ') {
      navigate('/');
    } else {
      setActivePage(e.key);
      // ✅ ADD: อัปเดต URL ให้สอดคล้อง (ไม่ hardcode path ใช้ path ปัจจุบัน)
      const slug = keyToSlug[e.key] ?? 'home';
      navigate({ pathname: location.pathname, search: `?tab=${slug}` });
    }
  };

  // ---------- render page by key ----------
  const renderContent = () => {
    switch (activePage) {
      case 'ลงทะเบียนเรียน':
        return <RegisterPage />;
      case 'วิชาที่เปิดสอน':
        return <CoursePage />;
      case 'ผลการเรียน':
        return <GradePage />;
      case 'คะแนน':
        return <ScorePage />;
      case 'ใบแจ้งยอดชำระ':
        return <PaymentPage />;
      case 'นักศึกษา':
        return <StudentPage />;
      case 'อาจารย์':
        return <TeacherPage />;
      case 'คำร้อง':
        return <ReportPage />;
      case 'แจ้งจบการศึกษา':
        return <GraduatePage />;
      case 'หลักสูตร':
        return <CurriculumPage />;
      case 'เปลี่ยนรหัสผ่าน':
        return <PasswordPage />;
      case 'หน้าหลัก':
      default:
        return <MainPage />;
    }
  };

  return (
    <Layout>
      {/* Sider */}
      <Sider
        className='side'
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        collapsedWidth={80}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          overflowY: 'auto',   /* ⭐ เลื่อนเมนูยาว ๆ ได้ */
          zIndex: 99,
        }}
      >
        {/* logo block */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '10vh',
            padding: '16px',
            position: 'relative',
            background: '#2e236c', /* สีพื้นหลังของ logo block */
          }}
        >
          <img
            src={name_white}
            alt="full-logo"
            style={{
              position: 'absolute',
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.3s ease',
              maxWidth: '160px',
              height: 'auto',
            }}
          />
          <img
            src={shortLogo}
            alt="short-logo"
            style={{
              position: 'absolute',
              opacity: collapsed ? 1 : 0,
              transition: 'opacity 0.3s ease',
              maxWidth: '40px',
              height: 'auto',
            }}
          />
        </div>

        {/* menu */}
        <Menu
          className="custom-menu"
          style={{ backgroundColor: '#2e236c' }}
          mode="inline"
          selectedKeys={[activePage]}             // ✅ ADD (แทน defaultSelectedKeys)
          onClick={handleMenuClick}
          items={[
            { key: 'หน้าหลัก', icon: <HomeOutlined />, label: 'หน้าหลัก' },
            { key: 'ลงทะเบียนเรียน', icon: <ScheduleOutlined />, label: 'ลงทะเบียนเรียน' },
            { key: 'วิชาที่เปิดสอน', icon: <BookOutlined />, label: 'วิชาที่เปิดสอน' },
            { key: 'ผลการเรียน', icon: <ReadOutlined />, label: 'ผลการเรียน' },
            { key: 'คะแนน', icon: <SolutionOutlined />, label: 'คะแนน' },
            { key: 'ใบแจ้งยอดชำระ', icon: <BankOutlined />, label: 'ใบแจ้งยอดชำระ' },
            { key: 'นักศึกษา', icon: <UserOutlined />, label: 'นักศึกษา' },
            { key: 'อาจารย์', icon: <ContactsOutlined />, label: 'อาจารย์' },
            { key: 'คำร้อง', icon: <ExclamationCircleOutlined />, label: 'คำร้อง' },
            { key: 'แจ้งจบการศึกษา', icon: <FormOutlined />, label: 'แจ้งจบการศึกษา' },
            { key: 'หลักสูตร', icon: <ApartmentOutlined />, label: 'หลักสูตร' },
            { key: 'เปลี่ยนรหัสผ่าน', icon: <LockOutlined />, label: 'เปลี่ยนรหัสผ่าน' },
            { key: 'ออกจากระบบ', icon: <LogoutOutlined />, label: 'ออกจากระบบ' },
          ]}
        />
      </Sider>

      {/* Main layout */}
      <Layout>
        <Header
            style={{
              position: 'fixed',
              top: 0,
              left: collapsed ? 80 : 240, /* เว้นให้พอดีกับ Sider */
              width: `calc(100% - ${collapsed ? 80 : 240}px)`,
              height: 64,
              zIndex: 100,
              backgroundColor: '#ffffffff'
            }}
          >
          <Row>
            <Col span={6} pull={1}>
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', width: 64, height: 64 }}
              />
            </Col>
            <Col
              span={6}
              push={17}
              style={{
                position: 'fixed',
                display: 'flex',              // ใช้ flexbox
                justifyContent: 'center',     // จัดข้อความให้อยู่กลางแนวนอน
                alignItems: 'center',         // จัดข้อความให้อยู่กลางแนวตั้ง
                textAlign: 'center',          // จัดข้อความให้อยู่กลางในแนวตั้ง
              }}
            >
              <div className="name">
                {student &&  (
                  <h1 className="name-text">
                    ยินดีต้อนรับคุณ {student.FirstName} {student.LastName}
                  </h1>
                )}
              </div>
            </Col>

          </Row>
        </Header>

        <Content
          style={{
          position: 'absolute',
          top: 64,                          /* สูงเท่า Header */
          left: collapsed ? 80 : 240,       /* เว้น Sider */
          width: `calc(100% - ${collapsed ? 80 : 240}px)`,
          height: 'calc(100vh - 64px)',     /* พอดีกับจอ */
          padding: 24,
          overflowY: 'auto',                /* ⭐ เลื่อนแค่ตรงนี้ */
        }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboardpage;
