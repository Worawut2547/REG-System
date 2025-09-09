import { useEffect, useState } from "react";
import { Card, Col, Row, Button, Upload, Avatar } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";

import type { TeacherInterface } from "../../../../../../interfaces/Teacher";
import { getNameTeacher } from "../../../../../../services/https/teacher/teacher";


interface ShowNameTeacherProps {
    onEdit?: () => void;
}

export const ShowTeacherProfile: React.FC<ShowNameTeacherProps> = ({ onEdit }) => {

    const [username, setUsername] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [teacher, setTeachers] = useState<TeacherInterface>();

    useEffect(() => {
        const username = localStorage.getItem("username");

        if (username) {
            setUsername(username);

            getNameTeacher(username)
                .then((teacher) => {
                    console.log("API response:", teacher);
                    setTeachers(teacher);
                })
                .catch((err) => console.error(err));

            // โหลดรูปโปรไฟล์จาก localStorage
            const saveImage = localStorage.getItem(`profileImage_${username}`);
            if (saveImage) {
                setImageUrl(saveImage);
            }
        }

    }, []);


    const beforeUpload = (file: File) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result as string;
            setImageUrl(base64);

            // เซฟรูปลง localStorage ตาม username
            if (username) {
                //เก็บรูปลง localStorage
                localStorage.setItem(`profileImage_${username}`, base64)
            }

        };
        return false; // prevent auto upload
    };

    return (
        <div style={{ padding: 24 }}>
            {/* Header Profile */}
            <Card
                style={{
                    marginBottom: 24,
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
            >
                <Row gutter={16} align="middle">
                    {/* รูปโปรไฟล์ */}
                    <Col>
                        <Upload showUploadList={false} beforeUpload={beforeUpload} accept="image/*">
                            <Avatar
                                size={120}
                                src={imageUrl}
                                icon={<UserOutlined />}
                                style={{
                                    cursor: "pointer",
                                    border: "3px solid #eee",
                                }}
                            />
                            <div style={{ marginTop: 8, color: "#1890ff", cursor: "pointer" }}>
                                <PlusOutlined /> อัปโหลดรูปโปรไฟล์
                            </div>
                        </Upload>
                    </Col>

                    {/* ข้อมูลหลัก */}
                    <Col flex="auto">
                        <h2 style={{ marginBottom: 8, color: "#3B0A57" }}>
                            {teacher?.FirstName} {teacher?.LastName}
                        </h2>
                        <p style={{ margin: 0 }}>รหัสอาจารย์: {teacher?.TeacherID}</p>
                        <p style={{ margin: 0 }}>{teacher?.MajorName} - {teacher?.FacultyName}</p>
                    </Col>

                    {/* ปุ่มแก้ไข */}
                    <Col>
                        <Button type="primary" onClick={onEdit}>
                            แก้ไขโปรไฟล์
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Academic Info */}
            <Card
                title="ข้อมูลการศึกษา"
                style={{
                    marginBottom: 24,
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
            >
                <Row gutter={[16, 16]}>
                    <Col span={12}><b>รหัสอาจารย์:</b> {teacher?.TeacherID}</Col>
                    <Col span={12}><b>ตำเเหน่งทางวิชาการ:</b> {teacher?.Position}</Col>
                    <Col span={12}><b>สำนักวิชา:</b> {teacher?.FacultyName}</Col>
                    <Col span={12}><b>สาขา:</b> {teacher?.MajorName}</Col>
                </Row>
            </Card>

            {/* Personal Info */}
            <Card
                title="ข้อมูลส่วนตัว"
                style={{
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                }}
            >
                <Row gutter={[16, 16]}>
                    <Col span={12}><b>เลขบัตรประชาชน:</b> {teacher?.CitizenID}</Col>
                    <Col span={12}><b>เบอร์โทร:</b> {teacher?.Phone}</Col>
                    <Col span={12}><b>อีเมล:</b> {teacher?.Email}</Col>
                    <Col span={12}><b>วันเกิด:</b> {teacher?.BirthDay}</Col>
                    <Col span={12}><b>ศาสนา:</b> {teacher?.Religion}</Col>
                    <Col span={12}><b>สัญชาติ:</b> {teacher?.Nationality}</Col>
                    <Col span={12}><b>เชื้อชาติ:</b> {teacher?.Ethnicity}</Col>
                    <Col span={24}><b>ที่อยู่:</b> {teacher?.Address}</Col>
                </Row>
            </Card>
        </div>
    );
};