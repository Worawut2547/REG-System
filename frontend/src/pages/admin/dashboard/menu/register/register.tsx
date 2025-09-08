// src/pages/dashboard/menu/register.tsx
import React, { useEffect, useState } from 'react';
import { Layout, InputNumber, Select, Button, Table, Space, Popconfirm, message, Typography, TimePicker, Card } from 'antd';
import './register.css';
import { getSubjectAll, getSubjectById } from '../../../../../services/https/subject/subjects';
import { createSection, getSectionsBySubject, deleteSection } from '../../../../../services/https/section/section';
import type { SubjectInterface } from '../../../../../interfaces/Subjects';
import type { SectionInterface } from '../../../../../interfaces/Section';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;
const { Option } = Select;

const wrapperStyle: React.CSSProperties = {
  /* keep your corner-rounding / shadow if you like */
  borderRadius: 8,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  width: '100%',          // fill X
  minHeight: '100vh',     // ใช้พื้นที่เต็มหน้าจอ
  display: 'flex',        // so Header/Content/Footer stack vertically
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  background: '#2e236c',            // ม่วงเข้ม
  color: 'white',
  textAlign: 'center',
  padding: 16,
  fontSize: 20,
};

const contentStyle: React.CSSProperties = {
  background: '#f5f5f5',            // เทาอ่อน
  padding: 24,
  minHeight: 400,
  color: '#333',
  overflowY: 'auto',                // ให้สามารถเลื่อนขึ้นลงได้
};

const footerStyle: React.CSSProperties = {
  background: '#1890ff',            // ฟ้า Ant Design
  color: 'white',
  textAlign: 'center',
  padding: 12,
};

const Register: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectInterface[]>([]);
  const [sections, setSections] = useState<SectionInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // controlled states (match addtype.tsx style)
  const [subjectId, setSubjectId] = useState<string>('');
  const [groupVal, setGroupVal] = useState<number | null>(null);
  const [slots, setSlots] = useState<Array<{ day?: string; time?: [any, any] }>>([{}]);

  // load subjects
  const loadSubjects = async () => {
    try {
      setLoading(true);
      const list = await getSubjectAll();
      setSubjects(list);
    } catch (e) {
      message.error('โหลดรายวิชาไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // load sections for selected subject
  const loadSections = async (sid?: string) => {
    const s = (sid ?? subjectId ?? '').trim();
    if (!s) { setSections([]); return; }
    try {
      const list = await getSectionsBySubject(s);
      setSections(list);
    } catch {
      const detail: any = await getSubjectById(s);
      const arr = Array.isArray(detail?.Sections) ? detail.Sections : (Array.isArray(detail?.sections) ? detail.sections : []);
      setSections(arr);
    }
  };

  useEffect(() => { loadSubjects(); }, []);
  useEffect(() => { if (subjectId) loadSections(subjectId); }, [subjectId]);

  const onSubmit = async () => {
    if (!subjectId) { message.warning('กรุณาเลือกวิชา'); return; }
    if (groupVal == null) { message.warning('กรุณาระบุกลุ่มเรียน'); return; }

    // Frontend guard: prevent duplicate group in the same subject
    if (sections.some((s) => Number(s.Group ?? 0) === Number(groupVal))) {
      message.error('กลุ่มเรียนนี้มีอยู่แล้วในวิชาที่เลือก');
      return;
    }

    // sort slots by day-of-week and start time
    const dayOrder: Record<string, number> = {
      Mon: 1, Monday: 1,
      Tue: 2, Tuesday: 2,
      Wed: 3, Wednesday: 3,
      Thu: 4, Thursday: 4,
      Fri: 5, Friday: 5,
      Sat: 6, Saturday: 6,
      Sun: 7, Sunday: 7,
    };
    const toMinutes = (t: any | undefined) => {
      if (!t) return 0;
      const hh = Number(t.format?.('HH') ?? 0);
      const mm = Number(t.format?.('mm') ?? 0);
      return hh * 60 + mm;
    };
    const valid = slots.filter(s => s.day && Array.isArray(s.time) && (s.time as any[]).length === 2);
    if (valid.length === 0) {
      message.warning('กรุณาเลือกวันและเวลาเรียนอย่างน้อย 1 ช่วง');
      return;
    }
    valid.sort((a, b) => {
      const da = dayOrder[String(a.day!) as keyof typeof dayOrder] ?? 99;
      const db = dayOrder[String(b.day!) as keyof typeof dayOrder] ?? 99;
      if (da !== db) return da - db;
      const sa = toMinutes((a.time as any[])[0]);
      const sb = toMinutes((b.time as any[])[0]);
      return sa - sb;
    });
    const fmt = (d: string | undefined, r: any[] | undefined) => {
      if (!d || !r || r.length !== 2) return '';
      return `${d}: ${r[0]?.format('HH:mm')}-${r[1]?.format('HH:mm')}`;
    };
    const dateTeaching = valid
      .map(s => fmt(s.day, s.time as any[]))
      .filter(Boolean)
      .join(', ');
    const payload: SectionInterface = {
      SubjectID: subjectId,
      Group: groupVal ?? undefined,
      DateTeaching: dateTeaching,
    };
    try {
      setSubmitting(true);
      await createSection(payload);
      message.success('สร้าง Section สำเร็จ');
      setGroupVal(null);
      setSlots([{}]);
      await loadSections(subjectId);
    } catch (e: any) {
      message.error(e?.response?.data?.error || e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (row: SectionInterface) => {
    try {
      if (!row.SectionID) return;
      await deleteSection(row.SectionID);
      message.success('ลบ Section สำเร็จ');
      await loadSections();
    } catch (e: any) {
      message.error(e?.response?.data?.error || e?.message || 'ลบไม่สำเร็จ');
    }
  };

  const columns = [
    { title: 'SectionID', dataIndex: 'SectionID', key: 'SectionID' },
    { title: 'Group', dataIndex: 'Group', key: 'Group' },
    { title: 'เวลาเรียน', dataIndex: 'DateTeaching', key: 'DateTeaching' },
    {
      title: 'การทำงาน',
      key: 'action',
      render: (_: any, record: SectionInterface) => (
        <Space>
          <Popconfirm title='ยืนยันลบ?' onConfirm={() => onDelete(record)}>
            <Button danger size='small'>ลบ</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={wrapperStyle}>
      <Header style={headerStyle}>จัดการ Section</Header>
      <Content style={contentStyle}>
        <Card title='เพิ่ม Section' style={{ borderRadius: 8, marginBottom: 16 }}>
          <Space direction='vertical' style={{ width: '100%' }} size='middle'>
            <div>
              <Typography.Text strong>วิชา</Typography.Text>
              <Select
                showSearch
                placeholder='เลือกรายวิชา'
                loading={loading}
                style={{ width: '100%', marginTop: 6 }}
                value={subjectId || undefined}
                onChange={(v) => setSubjectId(v)}
                filterOption={(input, option) => {
                  const txt = String((option as any)?.label ?? (option as any)?.value ?? '');
                  return txt.toLowerCase().includes(input.toLowerCase());
                }}
              >
                {subjects.map((s) => (
                  <Option key={s.SubjectID} value={s.SubjectID} label={`${s.SubjectID} - ${s.SubjectName}`}>
                    {s.SubjectID} - {s.SubjectName}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Typography.Text strong>กลุ่มเรียน (ตัวเลข) <span style={{ color: 'red' }}>*</span></Typography.Text>
              <InputNumber
                style={{ width: '100%', marginTop: 6 }}
                min={1}
                max={99}
                placeholder='เช่น 1'
                value={groupVal ?? undefined}
                onChange={(v) => setGroupVal(v as number)}
                status={groupVal == null ? 'error' : undefined as any}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography.Text strong>วันและเวลาเรียน</Typography.Text>
                <Button type='dashed' onClick={() => setSlots(prev => [...prev, {}])} size='small'>+ เพิ่มวัน/เวลา</Button>
              </div>
              <div style={{ marginTop: 8 }}>
                {slots.map((slot, idx) => (
                  <Space key={idx} align='baseline' style={{ display: 'flex', marginBottom: 8 }}>
                    <Select placeholder='เลือกวัน' style={{ minWidth: 160 }} value={slot.day} onChange={(v) => {
                      const next = [...slots]; next[idx] = { ...next[idx], day: v }; setSlots(next);
                    }}>
                      <Select.Option value='Monday'>Monday</Select.Option>
                      <Select.Option value='Tuesday'>Tuesday</Select.Option>
                      <Select.Option value='Wednesday'>Wednesday</Select.Option>
                      <Select.Option value='Thursday'>Thursday</Select.Option>
                      <Select.Option value='Friday'>Friday</Select.Option>
                      <Select.Option value='Saturday'>Saturday</Select.Option>
                      <Select.Option value='Sunday'>Sunday</Select.Option>
                    </Select>
                    <TimePicker.RangePicker format='HH:mm' minuteStep={5} value={slot.time as any} onChange={(v) => {
                      const next = [...slots]; next[idx] = { ...next[idx], time: v as any } as any; setSlots(next);
                    }}/>
                    <Button danger onClick={() => setSlots(prev => prev.filter((_, i) => i !== idx))}>ลบ</Button>
                  </Space>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type='primary' onClick={onSubmit} loading={submitting}>บันทึก</Button>
            </div>
          </Space>
        </Card>

        <div style={{ background: '#fff', borderRadius: 8, padding: 16 }}>
          <Title level={4} style={{ marginTop: 0 }}>รายการ Section ของวิชาที่เลือก</Title>
          <Table
            rowKey={(r) => String(r.ID ?? r.SectionID)}
            dataSource={sections}
            columns={columns}
            pagination={{ pageSize: 8 }}
          />
        </div>
      </Content>
      <Footer style={footerStyle}>Arcanatech University © 2025</Footer>
    </Layout>
  );
};

export default Register;
