import { useEffect, useState } from "react";
import { Card, Divider, Descriptions, Button, Space, Upload, Avatar } from "antd";
import { PlusOutlined, UserOutlined } from "@ant-design/icons";
import { getNameTeacher } from "../../../../../../services/https/teacher/teacher";
import type { TeacherInterface } from "../../../../../../interfaces/Teacher";


interface ShowNameTeacherProps {
    onEdit?: () => void;
}

export const ShowTeacherProfile: React.FC<ShowNameTeacherProps> = () => {

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
        <Card>
            <h2>ข้อมูลอาจารย์</h2>
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
                    <Descriptions.Item label="รหัสประจำตัว">{teacher?.TeacherID}</Descriptions.Item>
                    <Descriptions.Item label="ตำเเหน่งทางวิชาการ">{teacher?.Position}</Descriptions.Item>
                    <Descriptions.Item label="ชื่อ">{teacher?.FirstName} {teacher?.LastName}</Descriptions.Item>
                    <Descriptions.Item label="เลขบัตรประชาชน">{teacher?.CitizenID}</Descriptions.Item>
                    <Descriptions.Item label="เบอร์โทร">{teacher?.Phone}</Descriptions.Item>
                    <Descriptions.Item label="อีเมล">{teacher?.Email}</Descriptions.Item>
                    <Descriptions.Item label="คณะ">{teacher?.FacultyName}</Descriptions.Item>
                    <Descriptions.Item label="สาขา">{teacher?.MajorName}</Descriptions.Item>
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
