import { useEffect, useState } from "react";
import { Card, Col, Row, Button, Upload, Avatar } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { type StudentInterface } from "../../../../../../interfaces/Student";
import { getNameStudent } from "../../../../../../services/https/student/student";


interface ShowNameStudentProps {
    onEdit?: () => void;
}

export const ShowStudentProfile: React.FC<ShowNameStudentProps> = ({ onEdit }) => {

    const [username, setUsername] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [student, setStudents] = useState<StudentInterface>();

    useEffect(() => {
        const username = localStorage.getItem("username");

        if (username) {
            setUsername(username);

            getNameStudent(username)
                .then((student) => {
                    console.log("API response:", student);
                    setStudents(student);
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
                            {student?.FirstName} {student?.LastName}
                        </h2>
                        <p style={{ margin: 0 }}>รหัสนักศึกษา: {student?.StudentID}</p>
                        <p style={{ margin: 0 }}>สำนักวิชา: {student?.FacultyName}</p>
                        <p style={{ margin: 0 }}>สาขาวิชา: {student?.MajorName}</p>
                        <p style={{ margin: 0 }}>หลักสูตร: {student?.CurriculumName}</p>
                        <p style={{ margin: 0 }}>เกรดเฉลี่ย: {student?.GPAX}</p>
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
                    <Col span={12}><b>รหัสนักศึกษา:</b> {student?.StudentID}</Col>
                    <Col span={12}><b>หลักสูตร:</b> {student?.CurriculumName}</Col>
                    <Col span={12}><b>สำนักวิชา:</b> {student?.FacultyName}</Col>
                    <Col span={12}><b>สาขา:</b> {student?.MajorName}</Col>
                    <Col span={12}><b>ระดับการศึกษา:</b> {student?.Degree}</Col>
                    <Col span={12}><b>สถานะการศึกษา:</b> {student?.StatusStudent}</Col>
                    <Col span={12}><b>เกรดเฉลี่ย:</b> {student?.GPAX}</Col>
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
                    <Col span={12}><b>เลขบัตรประชาชน:</b> {student?.CitizenID}</Col>
                    <Col span={12}><b>เบอร์โทร:</b> {student?.Phone}</Col>
                    <Col span={12}><b>อีเมล:</b> {student?.Email}</Col>
                    <Col span={12}><b>วันเกิด:</b> {student?.BirthDay}</Col>
                    <Col span={12}><b>ศาสนา:</b> {student?.Religion}</Col>
                    <Col span={12}><b>สัญชาติ:</b> {student?.Nationality}</Col>
                    <Col span={12}><b>เชื้อชาติ:</b> {student?.Ethnicity}</Col>
                    <Col span={12}><b>ผู้ปกครอง:</b> {student?.Parent}</Col>
                    <Col span={24}><b>ที่อยู่:</b> {student?.Address}</Col>
                </Row>
            </Card>
        </div>
    );
};