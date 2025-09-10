// src/pages/student/dashboard/menu/register/addcourse.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Layout, Input, Table, Button, message, Space, Divider, Card, Modal, Typography } from "antd";
import { SearchOutlined, DeleteOutlined, SendOutlined } from "@ant-design/icons";

import { getSubjectAll, getSubjectById } from "../../../../../../services/https/subject/subjects";
import { getNameStudent } from "../../../../../../services/https/student/student";
import { createRegistration, getMyRegistrations } from "../../../../../../services/https/registration/registration";
import type { SubjectInterface } from "../../../../../../interfaces/Subjects";
import type { RegistrationInterface } from "../../../../../../interfaces/Registration";
import AddCourseReview from "./AddCourseReview";

const { Content } = Layout;

// Local types for sections from backend
type SectionLite = { ID?: number; SectionID?: string; Group?: number; DateTeaching?: string; SubjectID?: string };
type SubjectWithSections = SubjectInterface & { Sections?: SectionLite[] };

type Step = "select" | "review" | "done";

type BasketRow = {
  key: string;
  SubjectID: string;
  SubjectName?: string;
  Credit?: number;
  SectionID: number;
  Group?: number;
  Schedule?: string;
  Blocks?: { day: string; start: number; end: number; label: string }[];
};

type Props = { onBack?: () => void, studentId?: string };
const AddCoursePage: React.FC<Props> = ({ onBack, studentId: propStudentId }) => {
  const [studentId] = useState(() => {
    const username = (typeof window !== 'undefined' ? localStorage.getItem('username') : "") || "";
    const sid = (propStudentId && propStudentId.trim()) || username || (typeof window !== 'undefined' ? localStorage.getItem('student_id') : "") || "";
    return String(sid).trim();
  });

  const [step, setStep] = useState<Step>("select");
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [basket, setBasket] = useState<BasketRow[]>([]);
  const [subjectDetail, setSubjectDetail] = useState<SubjectWithSections | null>(null);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);

  // รายการของฉัน ใช้ตรวจซ้ำ/ชน
  const [myRows, setMyRows] = useState<BasketRow[]>([]);
  const [, setMyLoading] = useState(false);

  // modal browse subjects
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseRows, setBrowseRows] = useState<SubjectInterface[]>([]);
  const [browseQuery, setBrowseQuery] = useState("");

  const columnsBasket = useMemo(
    () => [
      { title: "กลุ่ม", dataIndex: "Group", key: "Group", width: 80 },
      { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 120 },
      { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" , width: 240 },
      { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 80  },
      { title: "เวลาเรียน", dataIndex: "Schedule", key: "Schedule", width: 260, render: (t: any) => (<span style={{ whiteSpace: 'pre-line' }}>{String(t || '')}</span>) },
      { key: "remove", width: 80, render: (_: any, record: BasketRow) => (
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemove(record.key)}>
            ลบ
          </Button>
        ),
      },
    ],
    [basket]
  );

  const isRegistered = (sid: string) => myRows.some((r) => (r.SubjectID || "").toUpperCase() === sid.toUpperCase());

  // แปลงข้อความเวลาเรียนให้ขึ้นบรรทัดใหม่เมื่อมีหลายช่วงเวลา
  const normalizeDateTeaching = (val?: string) => {
    const s = String(val || "").trim();
    if (!s) return "";
    if (s.includes(",")) {
      return s.split(",").map(p => p.trim()).filter(Boolean).join("\n");
    }
    return s;
  };

  // no study time normalization needed without section/time data

  const parseScheduleToBlocks = (text?: string) => {
    const lines = String(text || "").split(/\n|,/).map((s) => s.trim()).filter(Boolean);
    type Block = { day: string; start: number; end: number; label: string };
    const blocks: Block[] = [];
    const normDay = (d: string) => {
      const map: Record<string, string> = {
        mon: 'monday', monday: 'monday', 'จันทร์': 'monday',
        tue: 'tuesday', tues: 'tuesday', tuesday: 'tuesday', 'อังคาร': 'tuesday',
        wed: 'wednesday', weds: 'wednesday', wednesday: 'wednesday', 'พุธ': 'wednesday',
        thu: 'thursday', thur: 'thursday', thurs: 'thursday', thursday: 'thursday', 'พฤหัสบดี': 'thursday',
        fri: 'friday', friday: 'friday', 'ศุกร์': 'friday',
        sat: 'saturday', saturday: 'saturday', 'เสาร์': 'saturday',
        sun: 'sunday', sunday: 'sunday', 'อาทิตย์': 'sunday'
      };
      const key = (d || '').toLowerCase();
      return map[key] || key;
    };
    for (const line of lines) {
      const m = line.match(/^([A-Za-zก-๙]+)\s*:??\s*(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
      if (!m) continue;
      const day = normDay(m[1]);
      const h1 = parseInt(m[2], 10), n1 = parseInt(m[3], 10);
      const h2 = parseInt(m[4], 10), n2 = parseInt(m[5], 10);
      const start = h1 * 60 + n1; const end = h2 * 60 + n2;
      if (end > start) blocks.push({ day, start, end, label: `${day}: ${String(h1).padStart(2,'0')}:${String(n1).padStart(2,'0')}-${String(h2).padStart(2,'0')}:${String(n2).padStart(2,'0')}` });
    }
    return blocks;
  };

  const openPickSection = async (codeArg?: string) => {
    const code = (codeArg ?? codeInput ?? "").trim().toUpperCase();
    if (!code) return message.warning("กรุณากรอกรหัสวิชา");
    if (basket.some(b => b.SubjectID === code)) return message.info(`เลือกรหัสวิชา ${code} ไว้แล้วในตะกร้า`);
    if (isRegistered(code)) return message.info(`วิชา ${code} ถูกลงทะเบียนแล้ว`);

    setLoading(true);
    try {
      const full = await getSubjectById(code);
      if (!full) {
        message.warning(`ไม่พบวิชา ${code} ในระบบ`);
        await openBrowseSubjects();
        return;
      }
      setSubjectDetail(full as SubjectWithSections);
      setSectionModalOpen(true);
    } catch (e) {
      console.error(e);
      message.error("โหลดข้อมูลวิชาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value?: string) => {
    const code = (typeof value === "string" ? value : codeInput).trim().toUpperCase();
    setCodeInput(code);
    openPickSection(code);
  };

  const makeRowFromSection = (sub: SubjectWithSections, sec: SectionLite): BasketRow => {
    const sched = normalizeDateTeaching(String(sec.DateTeaching || "").trim());
    const blocks = parseScheduleToBlocks(sched);
    return {
      key: `${sub.SubjectID}-${sec.ID ?? sec.SectionID ?? "0"}`,
      SubjectID: String(sub.SubjectID || ""),
      SubjectName: sub.SubjectName,
      Credit: sub.Credit,
      SectionID: Number(sec.ID ?? 0),
      Group: sec.Group,
      Schedule: sched,
      Blocks: blocks,
    };
  };

  const quickPickSection = (sec: SectionLite) => {
    if (!subjectDetail) return;
    const row = makeRowFromSection(subjectDetail, sec);
    setBasket((prev) => {
      if (prev.some((b) => b.SubjectID === row.SubjectID)) {
        message.info(`เลือกรหัสวิชา ${row.SubjectID} ไว้แล้ว`);
        return prev;
      }
      return [...prev, row];
    });
    setCodeInput("");
    setSectionModalOpen(false);
  };

  const handleRemove = (key: string) => setBasket((prev) => prev.filter((b) => b.key !== key));

  const goReview = () => {
    if (basket.length === 0) return message.warning("ยังไม่ได้เลือกวิชา");
    setStep("review");
  };

  const findConflicts = (rows: BasketRow[]) => {
    type Hit = { a: BasketRow; b: BasketRow; day: string; rangeA: string; rangeB: string };
    const hits: Hit[] = [];
    const byDay: Record<string, { row: BasketRow; start: number; end: number; label: string }[]> = {};
    for (const r of rows) {
      for (const blk of r.Blocks || []) {
        const key = blk.day || "";
        byDay[key] = byDay[key] || [];
        for (const ex of byDay[key]) {
          const overlap = blk.start < ex.end && ex.start < blk.end;
          if (overlap) hits.push({ a: r, b: ex.row, day: key, rangeA: blk.label, rangeB: ex.label });
        }
        byDay[key].push({ row: r, start: blk.start, end: blk.end, label: blk.label });
      }
    }
    return hits;
  };

  const findConflictsWithRegistered = (rows: BasketRow[], registered: BasketRow[]) => {
    type Hit = { a: BasketRow; b: BasketRow; day: string; rangeA: string; rangeB: string };
    const hits: Hit[] = [];
    const regBlocks = registered.flatMap((r) => {
      const src = (r.Blocks && r.Blocks.length > 0) ? r.Blocks : parseScheduleToBlocks(r.Schedule);
      return (src || []).map((b) => ({ row: r, ...b } as any));
    });
    for (const r of rows) {
      const blocks = (r.Blocks && r.Blocks.length > 0) ? r.Blocks : parseScheduleToBlocks(r.Schedule);
      for (const blk of (blocks || [])) {
        for (const ex of regBlocks) {
          if ((blk.day || "").toLowerCase() !== String(ex.day || "").toLowerCase()) continue;
          const overlap = blk.start < ex.end && ex.start < blk.end;
          if (overlap) hits.push({ a: r, b: ex.row, day: blk.day, rangeA: blk.label, rangeB: ex.label });
        }
      }
    }
    return hits;
  };

  const submitBulk = async () => {
    const items = basket.map((b) => ({ SubjectID: b.SubjectID, SectionID: b.SectionID }));
    setLoading(true);
    try {
      // ไม่เรียก bulk (backend ไม่มี) → สร้างทีละรายการแทน
      for (const it of items) {
        const payload: RegistrationInterface = {
          Date: new Date().toISOString(),
          StudentID: studentId,
          SubjectID: it.SubjectID,
          SectionID: it.SectionID,
        };
        await createRegistration(payload);
      }
      message.success("ลงทะเบียนสำเร็จ");
      setBasket([]);
      await reloadMyList();
      setStep("select");
    } catch (e) {
      console.error(e);
      message.error("บันทึกล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (basket.length === 0) return message.warning("ยังไม่ได้เลือกวิชา");
    const dup = basket.filter((b) => isRegistered(b.SubjectID));
    if (dup.length > 0) {
      message.error(`ตารางเรียนชนกัน/ทับซ้อนกัน: พบวิชาซ้ำ ${dup.map((d) => d.SubjectID).join(", ")}`);
      return;
    }
    const conflicts = findConflicts(basket);
    if (conflicts.length > 0) {
      message.error(`ตารางเรียนชนกัน/ทับซ้อนกัน ${conflicts.length} รายการในตะกร้า`);
      return;
    }
    const conflictsWithMine = findConflictsWithRegistered(basket, myRows);
    if (conflictsWithMine.length > 0) {
      message.error(`ตารางเรียนชนกัน/ทับซ้อนกันกับรายวิชาที่ลงทะเบียนแล้ว ${conflictsWithMine.length} รายการ`);
      return;
    }
    await submitBulk();
  };

  const reloadMyList = async () => {
    setMyLoading(true);
    try {
      // ดึงรายการลงทะเบียนจาก endpoint โดยตรง เพื่อให้มีข้อมูลครบ
      const regs = await getMyRegistrations(studentId);
      const baseRows: BasketRow[] = (Array.isArray(regs) ? regs : []).map((r: any) => ({
        key: String(r.ID ?? r.id ?? `${r.SubjectID}-${r.SectionID}-${r.Date}`),
        SubjectID: String(r.SubjectID ?? r.subject_id ?? ''),
        SubjectName: r.SubjectName ?? undefined,
        Credit: r.Credit ?? undefined,
        SectionID: Number(r.SectionID ?? r.section_id ?? 0),
        Group: undefined,
        Schedule: "",
        Blocks: [],
      }));

      // เติมรายละเอียดจากวิชาเพื่อได้ Group/Schedule ครบ
      const uniqueSids = Array.from(new Set(baseRows.map((x) => x.SubjectID).filter(Boolean)));
      const subMap: Record<string, SubjectWithSections | null> = {} as any;
      for (const sid of uniqueSids) {
        try {
          subMap[sid] = (await getSubjectById(sid)) as SubjectWithSections | null;
        } catch {
          subMap[sid] = null;
        }
      }

      const enriched: BasketRow[] = baseRows.map((r) => {
        const sub = subMap[r.SubjectID || ""];
        let groupVal: number | undefined = r.Group;
        let sched = String(r.Schedule || "").trim();
        if (sub) {
          const secExact = (sub.Sections || []).find((s) => Number(s.ID ?? 0) === Number(r.SectionID));
          const secByGroup = secExact || (sub.Sections || []).find((s) => Number(s.Group ?? 0) === Number(r.Group ?? 0));
          const dt = secByGroup?.DateTeaching ? normalizeDateTeaching(String(secByGroup.DateTeaching)) : "";
          if (dt) sched = dt;
          if (!groupVal && secByGroup && typeof secByGroup.Group !== 'undefined') {
            const g = Number(secByGroup.Group);
            if (Number.isFinite(g) && g > 0) groupVal = g;
          }
        }
        const blocks = parseScheduleToBlocks(sched);
        return { ...r, Group: groupVal, Schedule: sched, Blocks: blocks } as BasketRow;
      });

      setMyRows(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => { if (studentId) reloadMyList(); }, [studentId]);

  const openBrowseSubjects = async () => {
    setBrowseLoading(true);
    try {
      const list = await getSubjectAll();
      setBrowseRows(list);
      setBrowseOpen(true);
    } catch (e) {
      console.error(e);
      message.error("โหลดรายการวิชาไม่สำเร็จ");
    } finally {
      setBrowseLoading(false);
    }
  };

  const pickFromBrowse = async (sid: string) => {
    if (isRegistered(sid)) {
      message.info(`วิชา ${sid} ถูกลงทะเบียนแล้ว`);
      return;
    }
    setCodeInput(sid);
    setBrowseOpen(false);
    await openPickSection(sid);
  };

  const filteredBrowseRows = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    if (!q) return browseRows;
    return browseRows.filter((s) => [s.SubjectID, s.SubjectName].join(" ").toLowerCase().includes(q));
  }, [browseRows, browseQuery]);

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Content style={{ padding: 24 }}>
        {step === "select" && (
        <Card style={{ borderRadius: 12 }}>
          <Space align="center" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} size="large">
            <Input.Search
              prefix={<SearchOutlined />}
              placeholder="กรอกรหัสวิชา"
              style={{ width: 420 }}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onSearch={handleSearch}
              enterButton="ค้นหา"
              loading={loading}
              allowClear
            />
            <Button onClick={openBrowseSubjects}>ดูรหัสวิชาทั้งหมด</Button>
          </Space>
          <Divider />
          <Table columns={columnsBasket as any} dataSource={basket} rowKey="key" bordered pagination={false} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <div>
              {onBack && (
                <Button onClick={onBack}>ย้อนกลับ</Button>
              )}
            </div>
            <div>
              <Button type="primary" icon={<SendOutlined />} disabled={basket.length === 0} onClick={goReview}>
                ยืนยันรายวิชา
              </Button>
            </div>
          </div>
        </Card>
        )}
        {step === "review" && (
          <AddCourseReview
            rows={basket}
            loading={loading}
            onBack={() => setStep("select")}
            onSubmit={handleConfirmSubmit}
            registeredRows={myRows}
          />
        )}
      </Content>

      {/* Modal เลือกกลุ่มเรียน */}
      <Modal
        title={subjectDetail ? `เลือกกลุ่มเรียน: ${subjectDetail.SubjectID} - ${subjectDetail.SubjectName}` : "เลือกกลุ่มเรียน"}
        open={sectionModalOpen}
        onCancel={() => setSectionModalOpen(false)}
        footer={null}
        width={900}
      >
        {subjectDetail?.Sections?.length ? (
          <Table
            rowKey={(r: any) => r.ID ?? r.SectionID}
            dataSource={subjectDetail.Sections as any}
            pagination={false}
            columns={[
              { title: "เลือก", key: "pick", width: 90, render: (_: any, s: SectionLite) => (
                  <Button type="link" onClick={() => quickPickSection(s)} disabled={!s.Group || Number(s.Group) === 0}>เลือก</Button>
                ),
              },
              { title: "กลุ่ม", dataIndex: "Group", key: "Group", width: 100 },
              { title: "รหัสวิชา", key: "SubjectID", width: 140, render: () => subjectDetail.SubjectID },
              { title: "ชื่อวิชา", key: "SubjectName", render: () => subjectDetail.SubjectName },
              { title: "เวลาเรียน", key: "Schedule", width: 260, render: (_: any, s: SectionLite) => (
                  <span style={{ whiteSpace: 'pre-line' }}>{normalizeDateTeaching(String(s.DateTeaching || '-'))}</span>
                ) },
            ] as any}
          />
        ) : (
          <Typography.Text>วิชานี้ยังไม่มีกลุ่มเรียน</Typography.Text>
        )}
      </Modal>

      {/* Modal ดูรหัสวิชาทั้งหมด */}
      <Modal title="เลือกรหัสวิชาจากรายการ" open={browseOpen} onCancel={() => setBrowseOpen(false)} footer={null} width={720}>
        <Space style={{ marginBottom: 12, width: "100%", justifyContent: "space-between" }}>
          <Input.Search placeholder="ค้นหา: รหัสวิชา / ชื่อวิชา" allowClear style={{ width: 360 }} onChange={(e) => setBrowseQuery(e.target.value)} />
        </Space>
        <Table dataSource={filteredBrowseRows}
          loading={browseLoading}
          rowKey={(r: SubjectInterface) => String(r.SubjectID || r.SubjectName || "")}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 140 },
            { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" },
            { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 100 },
            { title: "", key: "action", width: 120, render: (_: any, rec: SubjectInterface) => {
                const sid = String(rec.SubjectID || "");
                const inBasket = basket.some((b) => b.SubjectID === sid);
                const disabled = !sid || isRegistered(sid) || inBasket;
                return (
                  <Button type="link" onClick={() => pickFromBrowse(sid)} disabled={disabled}>เลือกวิชานี้</Button>
                );
              }},
          ] as any}
        />
      </Modal>
    </Layout>
  );
};

export default AddCoursePage;
