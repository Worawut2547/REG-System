import React, { useEffect, useState } from 'react';
import { Layout, Button, Spin, Result, message } from 'antd';
import { SmileOutlined } from '@ant-design/icons';
import { getNameStudent } from '../../../../../services/https/student/student';
import { createGraduation, getMyGraduation } from '../../../../../services/https/graduation/graduation';
import type { StudentInterface } from '../../../../../interfaces/Student';
import type { GraduationInterface, CreateGraduationInput } from '../../../../../interfaces/Graduation';

const { Content } = Layout;

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',
  padding: 24,
  minHeight: 400,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const labelStyle: React.CSSProperties = {
  backgroundColor: '#2e236c',
  color: 'white',
  fontWeight: 'bold',
  padding: '12px 16px',
  textAlign: 'right',
  borderRadius: '4px',
  userSelect: 'none',
};

const valueStyle: React.CSSProperties = {
  backgroundColor: '#f0f2f5',
  padding: '12px 16px',
  borderRadius: '4px',
  minHeight: 40,
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
};

const gridRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '180px 1fr',
  gap: 12,
  alignItems: 'center',
};

const statusMap: Record<string, string> = {
  "10": "กำลังศึกษาอยู่",
  "20": "แจ้งจบการศึกษา",
  "30": "สำเร็จการศึกษา",
  "40": "ไม่อนุมัติให้สำเร็จการศึกษา",
  "00": "สิ้นสภาพการศึกษา",
};

type GraduateData = {
  fullname: string;
  studentId: string;
  faculty: string;
  majorName: string;
  status: string;
  rejectReason?: string;
};

const GraduateStatus: React.FC = () => {
  const [data, setData] = useState<GraduateData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [graduated, setGraduated] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      const username = localStorage.getItem("username");
      if (!username) return;

      try {
        setLoading(true);
        const grad: GraduationInterface | null = await getMyGraduation();

        if (grad) {
          setData({
            fullname: grad.fullName,
            studentId: grad.StudentID,
            faculty: '', // ถ้าอยากเติมคณะจาก getNameStudent
            majorName: grad.curriculum,
            status: grad.statusStudent,
            rejectReason: grad.reason,
          });
        } else {
          const student: StudentInterface | null = await getNameStudent(username);
          if (student) {
            setData({
              fullname: `${student.FirstName ?? ''} ${student.LastName ?? ''}`.trim(),
              studentId: student.StudentID ?? '',
              faculty: student.FacultyName ?? '',
              majorName: student.MajorName ?? '',
              status: statusMap[student.StatusStudentID ?? ''] ?? 'รอตรวจสอบ',
              rejectReason: student.RejectReason ?? '',
            });
          }
        }
      } catch (err) {
        console.error(err);
        message.error("ไม่สามารถโหลดข้อมูลนักศึกษาได้");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleGraduationClick = async () => {
    if (!data) return;

    try {
      setSubmitting(true);
      // สร้าง ISO string
      const payload: CreateGraduationInput = {
        StudentID: data.studentId,
        Date: new Date().toISOString(), // ✅ ส่งเป็น string
      };

      await createGraduation(payload);
      message.success("แจ้งจบการศึกษาสำเร็จ 🎓");
      setGraduated(true);
      setData(prev => prev ? { ...prev, status: "แจ้งจบการศึกษา" } : prev);
    } catch (err: any) {
      console.error("Failed to create graduation:", err);
      message.error(err?.response?.data?.error || "แจ้งจบล้มเหลว");
    } finally {
      setSubmitting(false);
    }
  };


  {
    loading ? (
      <div style={{ textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" />
      </div>
    ) : (
      <Content style={contentStyle}> ... </Content>
    )
  }


  if (!data) return <Content style={contentStyle}>ไม่พบข้อมูลนักศึกษา</Content>;

  if (graduated)
    return (
      <Content style={contentStyle}>
        <Result
          icon={<SmileOutlined />}
          title="🎓 แจ้งจบการศึกษาสำเร็จแล้ว!"
          extra={<Button type="primary" onClick={() => setGraduated(false)}>กลับหน้าหลัก</Button>}
        />
      </Content>
    );

  return (
    <Content style={contentStyle}>
      <div style={gridRowStyle}>
        <div style={labelStyle}>ชื่อ-นามสกุล</div>
        <div style={valueStyle}>{data.fullname}</div>
      </div>

      <div style={gridRowStyle}>
        <div style={labelStyle}>รหัสนักศึกษา</div>
        <div style={valueStyle}>{data.studentId}</div>
      </div>

      <div style={gridRowStyle}>
        <div style={labelStyle}>คณะ</div>
        <div style={valueStyle}>{data.faculty}</div>
      </div>

      <div style={gridRowStyle}>
        <div style={labelStyle}>สาขา/โครงสร้างหลักสูตร</div>
        <div style={{ ...valueStyle, backgroundColor: '#2e236c', color: 'white' }}>{data.majorName}</div>
      </div>

      <div style={gridRowStyle}>
        <div style={labelStyle}>สถานะ</div>
        <div style={valueStyle}>
          {data.status}
          {data.status === "ไม่อนุมัติให้สำเร็จการศึกษา" && data.rejectReason && (
            <div style={{ marginTop: 8, color: 'red', fontWeight: 'bold' }}>
              เหตุผล: {data.rejectReason}
            </div>
          )}
        </div>
      </div>

      {data.status === "กำลังศึกษาอยู่" && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Button type="primary" size="large" onClick={handleGraduationClick} loading={submitting}>
            แจ้งจบการศึกษา
          </Button>
        </div>
      )}
    </Content>
  );
};

export default GraduateStatus;

