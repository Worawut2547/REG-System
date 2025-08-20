import { useEffect, useState } from "react";
import { Card, Divider, Descriptions, Button, Space, Upload, Avatar } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { type StudentInterface } from "../../../../../../interfaces/Student";
import { getNameStudent } from "../../../../../../services/https/student/student";


interface ShowNameStudentProps {
    onEdit?: () => void;
}

export const ShowStudentProfile: React.FC<ShowNameStudentProps> = () => {

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
        <Card>
            <h2>ข้อมูลนักศึกษา</h2>
            <Divider />
            <div style={{ display: "flex", gap: 32 }}>

                {/* ฝั่งซ้าย: Avatar + Upload */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Upload
                        showUploadList={false}
                        beforeUpload={beforeUpload}
                        accept="image/*"
                    >
                        <Avatar
                            size={230}
                            src={imageUrl}
                            icon={<UserOutlined />}
                            style={{ cursor: "pointer", border: "2px solid #eee" }}
                        />
                        <div style={{ marginTop: 8, color: "#1890ff", cursor: "pointer" }}>
                            <PlusOutlined /> อัปโหลดรูปโปรไฟล์
                        </div>
                    </Upload>
                </div>

                {/* ฝั่งขวา: Descriptions แบบ 1 column */}
                <Descriptions column={1} bordered style={{ flex: 1 }}>
                    <Descriptions.Item label="รหัสนักศึกษา">{student?.StudentID}</Descriptions.Item>
                    <Descriptions.Item label="ชื่อ">{student?.FirstName} {student?.LastName}</Descriptions.Item>
                    <Descriptions.Item label="เลขบัตรประชาชน">{student?.CitizenID}</Descriptions.Item>
                    <Descriptions.Item label="เบอร์โทร">{student?.Phone}</Descriptions.Item>
                    <Descriptions.Item label="อีเมล">{student?.Email}</Descriptions.Item>
                    <Descriptions.Item label="คณะ">{student?.FacultyName}</Descriptions.Item>
                    <Descriptions.Item label="สาขา">{student?.MajorName}</Descriptions.Item>
                    <Descriptions.Item label="ระดับการศึกษา">{student?.Degree}</Descriptions.Item>
                    <Descriptions.Item label="สถานะทางการศึกษา">{student?.StatusStudent}</Descriptions.Item>
                </Descriptions>
            </div>

            <Space style={{ marginTop: 16 }}>
                <Button type="primary">
                    เเก้ไข
                </Button>
            </Space>
        </Card>
    );
};
