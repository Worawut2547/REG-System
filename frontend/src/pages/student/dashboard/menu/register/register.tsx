// src/pages/student/dashboard/menu/register/RegistrationPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Layout, Input, Table, Button, message, Typography, Space, Divider, Card, Modal, Tag, Popconfirm } from "antd";
import { SearchOutlined, DeleteOutlined, SendOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { getSubjectById, getSubjectAll } from "../../../../../services/https/subject/subjects";
import { createRegistrationBulk, createRegistration, getMyRegistrations, deleteRegistration } from "../../../../../services/https/registration/registration";
import type { SubjectInterface, SectionInterface } from "../../../../../interfaces/Subjects";
import type { RegistrationInterface } from "../../../../../interfaces/Registration";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

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
  Remark?: string;
  RegistrationID?: number | string;
  InternalID?: number;
};

const RegistrationPage: React.FC = () => {
  // ใช้ StudentID ที่มีอยู่จริงใน seed เป็นค่าเริ่มต้น เพื่อให้บันทึก/ดึงรายการได้
  const [studentId] = useState(() => {
    const sid = localStorage.getItem("student_id") || "B6616052";
    if (!localStorage.getItem("student_id")) localStorage.setItem("student_id", sid);
    return sid;
  });

  const [step, setStep] = useState<Step>("select");
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [basket, setBasket] = useState<BasketRow[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [subjectDetail, setSubjectDetail] = useState<SubjectInterface | null>(null);

  const [myRows, setMyRows] = useState<BasketRow[]>([]);
  const [myLoading, setMyLoading] = useState(false);
  const [mode, setMode] = useState<"add" | "drop">("add");
  const [dropSelected, setDropSelected] = useState<(string | number)[]>([]);

  // Modal เลือกจากรายการวิชาที่มีอยู่ในระบบ (ช่วยเลี่ยง 404)
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseRows, setBrowseRows] = useState<SubjectInterface[]>([]);
  const [browseQuery, setBrowseQuery] = useState("");

  const columnsBasket = useMemo(
    () => [
      { title: "กลุ่มเรียน", dataIndex: "Group", key: "Group", width: 80 },
      { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 100 },
      { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" , width: 240 },
      { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 80  },
      { title: "เวลาเรียน", dataIndex: "Schedule", key: "Schedule", width: 240 },
      { title: "หมายเหตุ", dataIndex: "Remark", key: "Remark", width: 240, },
      { key: "remove", width: 100, render: (_: any, record: BasketRow) => (
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleRemove(record.key)}>
            ลบ
          </Button>
        ),
      },
    ],
    [basket]
  );

  // ตัวช่วยเช็คลงทะเบียนแล้ว
  const isRegistered = (sid: string) => myRows.some((r) => (r.SubjectID || "").toUpperCase() === sid.toUpperCase());

  // ค้นหาแล้วเปิด modal เลือกกลุ่ม
  const openPickSection = async () => {
    const code = (codeInput || "").trim().toUpperCase();
    if (!code) return message.warning("กรุณากรอกรหัสวิชา");
    if (basket.some(b => b.SubjectID === code)) return message.info(`เลือกรหัสวิชา ${code} ไว้แล้วในตะกร้า`);
    if (isRegistered(code)) return message.info(`วิชา ${code} ถูกลงทะเบียนแล้ว`);

    setLoading(true);
    try {
      const sub = await getSubjectById(code);
      if (!sub) {
        message.warning(`ไม่พบวิชา ${code} ในระบบ`);
        // เสนอเปิดรายการวิชาทั้งหมดให้เลือกแทน
        await openBrowseSubjects();
        return;
      }
      if (!sub.Sections || sub.Sections.length === 0) return message.warning("วิชานี้ยังไม่มีกลุ่มเรียน");

      setSubjectDetail(sub);
      setModalOpen(true);
    } catch (e) {
      console.error(e);
      message.error("โหลดข้อมูลวิชาไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ✅ รองรับ “กด Enter” และกดปุ่มค้นหา
  const handleSearch = (value?: string) => {
    if (typeof value === "string") setCodeInput(value);
    openPickSection();
  };

  const makeRowFromSection = (sub: SubjectInterface, sec: SectionInterface): BasketRow => {
    const schedule =
      sec.DateTeaching
        ? dayjs(sec.DateTeaching).isValid()
          ? dayjs(sec.DateTeaching).format("YYYY-MM-DD HH:mm")
          : String(sec.DateTeaching)
        : (sub.StudyTimes || [])
            .map((t) => `${t.day ?? ""} ${dayjs(t.start_at).format("HH:mm")}-${dayjs(t.end_at).format("HH:mm")}`)
            .join(", ");

    const blocks = (sub.StudyTimes || [])
      .map((t) => {
        const start = dayjs(t.start_at);
        const end = dayjs(t.end_at);
        if (!start.isValid() || !end.isValid()) return null;
        return {
          day: String(t.day ?? ""),
          start: start.hour() * 60 + start.minute(),
          end: end.hour() * 60 + end.minute(),
          label: `${t.day ?? ""} ${start.format("HH:mm")}-${end.format("HH:mm")}`,
        };
      })
      .filter(Boolean) as { day: string; start: number; end: number; label: string }[];

    return {
      key: `${sub.SubjectID}-${sec.SectionID}`,
      SubjectID: sub.SubjectID,
      SubjectName: sub.SubjectName,
      Credit: sub.Credit,
      SectionID: sec.SectionID,
      Group: sec.Group,
      Schedule: schedule,
      Blocks: blocks,
    };
  };

  const quickPickSection = (sec: SectionInterface) => {
    if (!subjectDetail) return;
    if (isRegistered(subjectDetail.SubjectID)) {
      message.info(`วิชา ${subjectDetail.SubjectID} ถูกลงทะเบียนแล้ว`);
      return;
    }
    const row = makeRowFromSection(subjectDetail, sec);
    setBasket((prev) => {
      if (prev.some((b) => b.SubjectID === row.SubjectID)) {
        message.info(`เลือกรหัสวิชา ${row.SubjectID} ไว้แล้ว`);
        return prev;
      }
      return [...prev, row];
    });
    setCodeInput("");
    setModalOpen(false);
  };

  const handleRemove = (key: string) => setBasket((prev) => prev.filter((b) => b.key !== key));

  const goReview = () => {
    if (basket.length === 0) return message.warning("ยังไม่ได้เลือกวิชา");
    setStep("review");
  };

  const submitBulk = async () => {
    const items = basket.map((b) => ({ SubjectID: b.SubjectID, SectionID: b.SectionID }));
    setLoading(true);
    try {
      await createRegistrationBulk(studentId, items);
      message.success("ลงทะเบียนสำเร็จ");
      setBasket([]);
      await reloadMyList();
      // แสดงหน้า "ลดรายวิชา" ทันทีหลังบันทึก
      setMode("drop");
      setStep("select");
    } catch (e) {
      try {
        // fallback ยิงทีละรายการ
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
        setMode("drop");
        setStep("select");
      } catch (e2) {
        console.error(e2);
        message.error("บันทึกล้มเหลว");
      }
    } finally {
      setLoading(false);
    }
  };

  const reloadMyList = async () => {
    setMyLoading(true);
    try {
      const regs = await getMyRegistrations(studentId);
      const rows: BasketRow[] = regs.map((r: any) => {
        const internalId: number | undefined = typeof r.ID === 'number' ? r.ID : (typeof r.id === 'number' ? r.id : undefined);
        const regId = r.RegistrationID ?? r.registration_id ?? internalId;
        const subjId = r.SubjectID ?? r.subject_id;
        const secId = r.SectionID ?? r.section_id;
        const dateVal = r.Date ?? r.date;
        return {
          key: String(internalId ?? regId ?? `${subjId}-${secId ?? ""}-${dateVal}`),
          SubjectID: subjId,
          SubjectName: r.Subject?.SubjectName ?? r.subject?.subject_name ?? "",
          Credit: r.Subject?.Credit ?? r.subject?.credit ?? undefined,
          SectionID: secId ?? 0,
          Group: r.Section?.Group ?? r.section?.group,
          Schedule: dayjs(dateVal).isValid() ? dayjs(dateVal).format("YYYY-MM-DD HH:mm") : "",
          RegistrationID: regId,
          InternalID: internalId,
        } as BasketRow;
      });
      setMyRows(rows);
      // เคลียร์สิ่งที่เลือกไว้ เพื่อกันคีย์ค้างจากรายการเก่า
      setDropSelected([]);
    } catch (e) {
      console.error(e);
      message.error("โหลดรายการของฉันล้มเหลว");
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => {
    // โหลดรายวิชาที่ลงทะเบียนไว้แล้วเมื่อเข้าเพจ
    reloadMyList();
  }, []);

  useEffect(() => {
    if (mode === "drop") reloadMyList();
  }, [mode]);

  const handleDrop = async (row: BasketRow) => {
    if (!row.RegistrationID) return message.warning("ไม่พบรหัสการลงทะเบียนของรายการนี้");
    try {
      setMyLoading(true);
      await deleteRegistration(row.RegistrationID);
      message.success("ลดรายวิชาแล้ว");
      await reloadMyList();
    } catch (e) {
      console.error(e);
      message.error("ลดรายวิชาล้มเหลว");
    } finally {
      setMyLoading(false);
    }
  };
  
  const confirmDropSelected = () => {
    if (dropSelected.length === 0) return;
    const selSet = new Set(dropSelected.map((k) => String(k)));
    const selectedRows = myRows.filter((r) => selSet.has(String(r.InternalID ?? r.RegistrationID ?? r.key)));
    Modal.confirm({
      title: "ยืนยันการลดรายวิชา",
      content: (
        <div>
          จำนวน {dropSelected.length} รายการ
          <ul style={{ marginTop: 8 }}>
            {selectedRows.slice(0, 8).map((r) => (
              <li key={String(r.RegistrationID ?? r.key)}>
                {r.SubjectID} - {r.SubjectName}
              </li>
            ))}
            {selectedRows.length > 8 && (
              <li>...และอีก {selectedRows.length - 8} รายการ</li>
            )}
          </ul>
        </div>
      ),
      okText: "ยืนยันลด",
      cancelText: "ยกเลิก",
      onOk: async () => {
        setMyLoading(true);
        try {
          const selSet2 = new Set(dropSelected.map((k) => String(k)));
          const rows = myRows.filter((r) => selSet2.has(String(r.InternalID ?? r.RegistrationID ?? r.key)));
          if (rows.length === 0) {
            message.warning("โปรดเลือกวิชาที่ต้องการลด");
          } else {
            for (const r of rows) {
              const idForDelete = r.InternalID ?? r.RegistrationID;
              if (idForDelete !== undefined) {
                await deleteRegistration(idForDelete);
              }
            }
            message.success("ลดรายวิชาสำเร็จ");
          }
          setDropSelected([]);
          await reloadMyList();
        } catch (e) {
          console.error(e);
          message.error("ลดรายวิชาล้มเหลว");
        } finally {
          setMyLoading(false);
        }
      },
    });
  };

  const toggleSelectDrop = (row: BasketRow) => {
    const key = String(row.InternalID ?? row.RegistrationID ?? row.key);
    setDropSelected((prev) => {
      const exists = prev.map(String).includes(key);
      if (exists) return prev.filter((k) => String(k) !== key);
      return [...prev, key];
    });
  };

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
    await openPickSection();
  };

  // รวมหน่วยกิตทั้งหมดในตะกร้า
  const totalCredit = useMemo(() => basket.reduce((sum, b) => sum + (b.Credit || 0), 0), [basket]);

  // กรองรายวิชาสำหรับ modal เลือกจากรายการ
  const filteredBrowseRows = useMemo(() => {
    const q = browseQuery.trim().toLowerCase();
    if (!q) return browseRows;
    return browseRows.filter((s) =>
      [s.SubjectID, s.SubjectName].join(" ").toLowerCase().includes(q)
    );
  }, [browseRows, browseQuery]);

  // ตรวจชนเวลาเรียนจาก Blocks ของแต่ละวิชาในตะกร้า
  const findConflicts = (rows: BasketRow[]) => {
    type Hit = { a: BasketRow; b: BasketRow; day: string; rangeA: string; rangeB: string };
    const hits: Hit[] = [];
    const byDay: Record<string, { row: BasketRow; start: number; end: number; label: string }[]> = {};
    for (const r of rows) {
      for (const blk of r.Blocks || []) {
        const key = blk.day || "";
        byDay[key] = byDay[key] || [];
        // ตรวจเทียบกับของเดิมในวันเดียวกัน
        for (const ex of byDay[key]) {
          const overlap = blk.start < ex.end && ex.start < blk.end;
          if (overlap) {
            hits.push({ a: r, b: ex.row, day: key, rangeA: blk.label, rangeB: ex.label });
          }
        }
        byDay[key].push({ row: r, start: blk.start, end: blk.end, label: blk.label });
      }
    }
    return hits;
  };

  // ส่งบันทึกทันที (โชว์แจ้งเตือนถ้าชนเวลา แต่ไม่บล็อกผู้ใช้)
  const handleConfirmSubmit = async () => {
    if (basket.length === 0) return message.warning("ยังไม่ได้เลือกวิชา");
    const conflicts = findConflicts(basket);
    if (conflicts.length > 0) {
      message.warning(`พบตารางเรียนชนกัน ${conflicts.length} รายการ แต่จะส่งต่อ`);
    }
    await submitBulk();
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Header style={{ background: "#2e236c", color: "#fff", textAlign: "center", fontWeight: 600 }}>
        ระบบลงทะเบียนเรียน
      </Header>

      <Content style={{ padding: 24 }}>
        {step === "select" && (
          <Card style={{ borderRadius: 12 }}>
            <Space align="center" style={{ width: "100%", justifyContent: "center" }} size="large">
              <Button type={mode === "add" ? "primary" : "default"} onClick={() => setMode("add")}>
                เพิ่มรายวิชา
              </Button>
              <Button type={mode === "drop" ? "primary" : "default"} onClick={() => setMode("drop")}>
                ลดรายวิชา
              </Button>
            </Space>

            {mode === "add" && (
            <Space align="center" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} size="large">
              {/* ✅ ใช้ Input.Search เพื่อรองรับ Enter + ปุ่มค้นหา */}
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
            )}

            <Divider />
            {mode === "add" ? (
              <>
                <Table columns={columnsBasket as any} dataSource={basket} rowKey="key" bordered pagination={false} />
                <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
                  <Button type="primary" icon={<SendOutlined />} disabled={basket.length === 0} onClick={goReview}>
                    ยืนยันเลือกวิชา
                  </Button>
                </Space>
              </>
            ) : (
              <>
                <Title level={5} style={{ marginTop: 0 }}>วิชาที่ลงทะเบียนแล้ว</Title>
                <Table
                  columns={[
                    { title: "กลุ่มเรียน", dataIndex: "Group", key: "Group", width: 80 },
                    { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 100 },
                    { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" , width: 240 },
                    { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 80  },
                    { title: "เวลาเรียน", dataIndex: "Schedule", key: "Schedule", width: 240 },
                    {
                      title: "",
                      key: "remove",
                      width: 80,
                      render: (_: any, r: BasketRow) => (
                        <Popconfirm
                          title="ยืนยันลบรายวิชานี้?"
                          okText="ลบ"
                          cancelText="ยกเลิก"
                          onConfirm={() => handleDrop(r)}
                        >
                          <Button danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      ),
                    },
                    {
                      title: "",
                      key: "pick",
                      width: 80,
                      render: (_: any, r: BasketRow) => {
                        const k = String(r.InternalID ?? r.RegistrationID ?? r.key);
                        const picked = dropSelected.map(String).includes(k);
                        return (
                          <Button type={picked ? "default" : "link"} onClick={() => toggleSelectDrop(r)}>
                            {picked ? "ยกเลิกเลือก" : "เลือก"}
                          </Button>
                        );
                      },
                    },
                  ] as any}
                  dataSource={myRows}
                  rowKey={(r) => (r.InternalID ?? r.RegistrationID ?? r.key) as any}
                  bordered
                  loading={myLoading}
                  pagination={{ pageSize: 8 }}
                />
                <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 12 }}>
                  <Button danger type="primary" disabled={dropSelected.length === 0} onClick={confirmDropSelected}>
                    ยืนยันการลดรายวิชา ({dropSelected.length})
                  </Button>
                </Space>
              </>
            )}
          </Card>
        )}

        {step === "review" && (
          <Card style={{ borderRadius: 12 }}>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Title level={5} style={{ margin: 0 }}>ตรวจสอบวิชาที่เลือก</Title>
              <Text>หน่วยกิตรวม: <b>{totalCredit}</b></Text>
            </Space>
            <Divider />
            <Table columns={columnsBasket as any} dataSource={basket} rowKey="key" bordered pagination={false} />
            <Space style={{ width: "100%", justifyContent: "flex-end", marginTop: 16 }}>
              <Button onClick={() => setStep("select")}>ย้อนกลับ</Button>
              <Button type="primary" loading={loading} onClick={handleConfirmSubmit}>
                ยืนยันการลงทะเบียน
              </Button>
            </Space>
          </Card>
        )}

        {step === "done" && (
          <Card style={{ borderRadius: 12, textAlign: "center" }}>
            <Title level={4} style={{ marginBottom: 0 }}>ส่งคำขอลงทะเบียนเรียบร้อย</Title>
            <Text type="secondary">ระบบได้บันทึกคำขอของคุณแล้ว</Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={() => setStep("select")}>ลงทะเบียนต่อ</Button>
              <Button style={{ marginLeft: 8 }} onClick={reloadMyList}>โหลดรายการของฉัน</Button>
            </div>
            <Divider />
            <Title level={5}>รายการของฉัน</Title>
            <Table
              columns={[
                { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 140 },
                { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" },
                { title: "กลุ่ม", dataIndex: "Group", key: "Group", width: 90 },
                { title: "ลงทะเบียนเมื่อ", dataIndex: "Schedule", key: "Schedule", width: 200 },
              ]}
              dataSource={myRows}
              rowKey="key"
              bordered
              loading={myLoading}
              pagination={{ pageSize: 8 }}
            />
          </Card>
        )}
      </Content>

      {/* Modal เลือกกลุ่มเรียน */}
      <Modal
        title={subjectDetail ? `เลือกกลุ่มเรียน: ${subjectDetail.SubjectID} - ${subjectDetail.SubjectName}` : "เลือกกลุ่มเรียน"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={900}
      >
        {subjectDetail?.Sections?.length ? (
          <Table
            rowKey={(r: any) => r.SectionID}
            dataSource={subjectDetail.Sections as any}
            pagination={false}
            columns={[
              {
                title: "เลือก",
                key: "pick",
                width: 90,
                render: (_: any, s: SectionInterface) => (
                  <Button type="link" onClick={() => quickPickSection(s)}>เลือก</Button>
                ),
              },
              { title: "กลุ่มเรียน", dataIndex: "Group", key: "Group", width: 110 },
              { title: "รหัสวิชา", key: "SubjectID", width: 140, render: () => subjectDetail.SubjectID },
              { title: "ชื่อวิชา", key: "SubjectName", render: () => subjectDetail.SubjectName },
              {
                title: "เวลาเรียน",
                key: "Schedule",
                width: 260,
                render: (_: any, s: SectionInterface) => (
                  s.DateTeaching
                    ? (dayjs(s.DateTeaching).isValid() ? dayjs(s.DateTeaching).format("YYYY-MM-DD HH:mm") : String(s.DateTeaching))
                    : (subjectDetail.StudyTimes || [])
                        .map((t) => `${t.day ?? ""} ${dayjs(t.start_at).format("HH:mm")}-${dayjs(t.end_at).format("HH:mm")}`)
                        .join(", ") || "-"
                ),
              },
              { title: "หมายเหตุ", key: "remark", render: () => <span>-</span> },
            ] as any}
          />
        ) : (
          <Text>วิชานี้ยังไม่มีกลุ่มเรียน</Text>
        )}
      </Modal>

      {/* Modal ดูรายวิชาทั้งหมด */}
      <Modal
        title="เลือกรหัสวิชาจากรายการ"
        open={browseOpen}
        onCancel={() => setBrowseOpen(false)}
        footer={null}
        width={720}
      >
        <Space style={{ marginBottom: 12, width: "100%", justifyContent: "space-between" }}>
          <Input.Search
            placeholder="ค้นหา: รหัสวิชา / ชื่อวิชา"
            allowClear
            style={{ width: 360 }}
            onChange={(e) => setBrowseQuery(e.target.value)}
          />
        </Space>
        <Table
          dataSource={filteredBrowseRows}
          loading={browseLoading}
          rowKey={(r) => r.SubjectID}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: "รหัสวิชา", dataIndex: "SubjectID", key: "SubjectID", width: 140 },
            { title: "ชื่อวิชา", dataIndex: "SubjectName", key: "SubjectName" },
            { title: "หน่วยกิต", dataIndex: "Credit", key: "Credit", width: 100 },
            {
              title: "สถานะ",
              key: "status",
              width: 160,
              render: (_: any, rec: SubjectInterface) => {
                const inCart = basket.some((b) => b.SubjectID === rec.SubjectID);
                const registered = isRegistered(rec.SubjectID);
                return (
                  <Space>
                    {registered && <Tag color="green">ลงทะเบียนแล้ว</Tag>}
                    {inCart && <Tag>อยู่ในตะกร้า</Tag>}
                  </Space>
                );
              },
            },
            {
              title: "",
              key: "action",
              width: 120,
              render: (_: any, rec: SubjectInterface) => (
                <Button
                  type="link"
                  onClick={() => pickFromBrowse(rec.SubjectID)}
                  disabled={isRegistered(rec.SubjectID) || basket.some((b) => b.SubjectID === rec.SubjectID)}
                >
                  เลือกวิชานี้
                </Button>
              ),
            },
          ] as any}
        />
      </Modal>
    </Layout>
  );
};

export default RegistrationPage;
