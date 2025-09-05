import React, { useEffect, useMemo, useState } from "react";
import { Layout, Select, Card, Button, Upload, Input, Modal, message, Typography, Table, Tag, Space } from "antd";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import axios from "axios";
import { getReportTypes, listReviewerOptions, getReportsByStudent, createReport } from "../../../../../services/https/report/report";
import { apiUrl } from "../../../../../services/api";
import { getNameTeacher } from "../../../../../services/https/teacher/teacher";
import { getNameAdmin } from "../../../../../services/https/admin/admin";
import "./report.css";

const { Header, Content, Footer } = Layout;
const { Text } = Typography;

type AnyObj = Record<string, any>;
type Option = { value: string; label: string };

// Helpers สำหรับ normalize แสดงผลในตาราง
const pickDate = (r: AnyObj): Date | null => {
  const cand = r.Submittion_date || r.ReportSubmission_date || r.Submission_date || r.created_at || r.CreatedAt || r.Created_at;
  if (!cand) return null;
  const d = new Date(cand);
  return isNaN(+d) ? null : d;
};
const pickStatus = (r: AnyObj): string => (r.Status ?? r.ReportStatus ?? r.status ?? "รอดำเนินการ");
const normalize = (r: AnyObj) => ({ ...r, _date: pickDate(r), _status: pickStatus(r) });

const ReportPage: React.FC = () => {
  const studentId = ((): string => {
    if (typeof window === "undefined") return "";
    const existing = localStorage.getItem("student_id");
    if (existing && existing.trim()) return existing;
    const sid = "B6616052";
    localStorage.setItem("student_id", sid);
    return sid;
  })();

  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [reviewerOptions, setReviewerOptions] = useState<Option[]>([]);
  const reviewerMap = useMemo(() => Object.fromEntries(reviewerOptions.map((o) => [o.value, o.label] as const)), [reviewerOptions]);

  const [requestType, setRequestType] = useState<string>();
  const [assignee, setAssignee] = useState<string>();
  const [details, setDetails] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [rows, setRows] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameMap, setNameMap] = useState<Record<string, string>>({}); // username -> Full Name

  const uploadProps: UploadProps = {
    beforeUpload: () => false,
    onChange: (info) => {
      if (info.fileList.length > 1) {
        message.error("แนบไฟล์ได้สูงสุด 1 ไฟล์เท่านั้น");
        info.fileList = info.fileList.slice(-1);
      }
      setFileList(info.fileList);
    },
    multiple: false,
    fileList,
    listType: "text",
    // antd v5 supports maxCount
    ...(typeof ({} as any).maxCount !== 'undefined' ? { maxCount: 1 } : {}),
  } as UploadProps;

  const hydrateNames = async (items: AnyObj[]) => {
    // ดึงชื่อเต็มจากบริการ teacher/admin ตาม role ของผู้ใช้ที่เป็น reviewer
    const wanted: { username: string; role: string }[] = [];
    const seen = new Set<string>();
    for (const r of items) {
      const u = r?.Reviewer?.User;
      const username = u?.Username || u?.username;
      const role = (u?.Role || u?.role || "").toLowerCase();
      if (!username || !role) continue;
      if (nameMap[username]) continue;
      const key = role + ":" + username;
      if (seen.has(key)) continue;
      seen.add(key);
      wanted.push({ username, role });
    }
    if (wanted.length === 0) return;
    const updates: Record<string, string> = {};
    await Promise.all(
      wanted.map(async ({ username, role }) => {
        try {
          if (role === "teacher") {
            const t = await getNameTeacher(username);
            const full = [t?.FirstName, t?.LastName].filter(Boolean).join(" ");
            if (full) updates[username] = full;
          } else if (role === "admin") {
            const a = await getNameAdmin(username);
            const full = [a?.FirstName, a?.LastName].filter(Boolean).join(" ");
            if (full) updates[username] = full;
          }
        } catch {}
      })
    );
    if (Object.keys(updates).length) setNameMap((m) => ({ ...m, ...updates }));
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      // โหลดประเภทคำร้อง (ไม่ให้ล้ม fetch ทั้งหมด)
      try {
        const rtypes = await getReportTypes();
        setTypeOptions((rtypes || []).map((t: any) => ({ value: t.ReportType_id, label: t.ReportType_Name ?? t.ReportType_id })));
      } catch (e: any) {
        console.warn("report types error:", e?.message);
      }

      // โหลดผู้พิจารณา (สำคัญ) พร้อม enrich ชื่อเต็ม ถ้าดึงชื่อไม่สำเร็จจะใช้ label เดิม
      try {
        const reviewers = await listReviewerOptions();
        const enriched = await Promise.all(
          (reviewers || []).map(async (o) => {
            const m = String(o.label || "").match(/^(.*?)\s*\((.*?)\)\s*$/);
            const username = (m?.[1] || String(o.label || "")).trim();
            const role = (m?.[2] || "").toLowerCase();
            try {
              if (role === "teacher") {
                const t = await getNameTeacher(username);
                const full = [t?.FirstName, t?.LastName].filter(Boolean).join(" ");
                if (full) return { value: o.value, label: full };
                return { value: o.value, label: username };
              } else if (role === "admin") {
                // แสดงเป็นคำว่า "เจ้าหน้าที่" แทนชื่อบุคคล
                return { value: o.value, label: "เจ้าหน้าที่" };
              }
            } catch {}
            return o;
          })
        );
        setReviewerOptions(enriched);
      } catch (e: any) {
        console.warn("reviewers error:", e?.message);
        setReviewerOptions([]);
      }

      // โหลดประวัติคำร้องของฉัน (ไม่ให้ล้ม fetch ทั้งหมด)
      try {
        const history = await getReportsByStudent(studentId);
        const normalized = (history || []).map(normalize);
        setRows(normalized);
        await hydrateNames(normalized);
      } catch (e: any) {
        console.warn("student reports error:", e?.message);
        setRows([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "วันที่ยื่น",
        dataIndex: "_date",
        key: "date",
        sorter: (a: AnyObj, b: AnyObj) => (a._date?.getTime() ?? 0) - (b._date?.getTime() ?? 0),
        defaultSortOrder: "descend" as const,
        render: (d: Date | null) => (d ? d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-"),
        width: 200,
      },
      {
        title: "ประเภท",
        key: "type",
        render: (_: any, r: AnyObj) => r?.ReportType?.ReportType_Name ?? r?.ReportType_id ?? "-",
        width: 220,
      },
      {
        title: "ผู้พิจารณา",
        key: "reviewer",
        render: (_: any, r: AnyObj) => {
          const role = (r?.Reviewer?.User?.Role || "").toLowerCase();
          const uname = r?.Reviewer?.User?.Username;
          if (role === 'admin') return 'เจ้าหน้าที่';
          return nameMap[uname] || reviewerMap[r?.Reviewer_id] || uname || "-";
        },
        width: 220,
      },
      {
        title: "สถานะ",
        dataIndex: "_status",
        key: "status",
        render: (s: string) => <Tag color={s === "อนุมัติ" ? "green" : s === "ไม่อนุมัติ" ? "red" : "gold"}>{s}</Tag>,
        width: 140,
      },
      { title: "เรื่อง", dataIndex: "Report_details", key: "details", ellipsis: true },
    ],
    [reviewerMap]
  );

  const handleSubmitClick = () => {
    if (!requestType) return message.warning("กรุณาเลือกประเภทคำร้อง");
    if (!assignee) return message.warning("กรุณาเลือกผู้รับผิดชอบ");
    if (!details.trim()) return message.warning("กรุณากรอกรายละเอียดคำร้อง");
    if (fileList.length > 1) return message.error("แนบไฟล์ได้สูงสุด 1 ไฟล์เท่านั้น");
    setConfirmOpen(true);
  };

  const handleConfirmOk = async () => {
    try {
      const file = fileList[0]?.originFileObj as File | undefined;
      if (file) {
        // ส่งแบบไฟล์เดียวผ่าน multipart ไปยัง /reports/
        const form = new FormData();
        form.append("student_id", studentId);
        form.append("report_type_id", requestType!);
        form.append("reviewer_id", assignee!);
        form.append("details", details);
        form.append("file", file);
        await axios.post(`${apiUrl}/reports/`, form, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        // ไม่แนบไฟล์ → ใช้ service multipart (ไม่มีไฟล์)
        await createReport({
          StudentID: studentId,
          ReportType_id: requestType!,
          Reviewer_id: assignee!,
          Report_details: details,
          ReportSubmission_date: new Date().toISOString(),
          file: null,
        });
      }
      message.success("ส่งคำร้องเรียบร้อย");

      setConfirmOpen(false);
      setRequestType(undefined);
      setAssignee(undefined);
      setDetails("");
      setFileList([]);

      await fetchAll();
    } catch (e: any) {
      message.error(e?.message || "ส่งคำร้องไม่สำเร็จ");
    }
  };

  return (
    <Layout style={{ borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", width: "100%", minHeight: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Header style={{ background: "#2e236c", color: "white", textAlign: "center", padding: 16, fontSize: 20, fontWeight: "bold" }}>
        ระบบคำร้อง
      </Header>

      <Content style={{ background: "#f5f5f5", padding: 24, minHeight: 400, color: "#333", overflowY: "auto" }}>
        <div style={{ display: "flex", gap: 100, flexWrap: "wrap", justifyContent: "center" }}>
          <Select style={{ width: 260 }} placeholder="เลือกคำร้อง" options={typeOptions} value={requestType} onChange={setRequestType} />
          <Select style={{ width: 260 }} placeholder="เลือกผู้ที่ต้องการส่งคำร้องให้" options={reviewerOptions} value={assignee} onChange={setAssignee} />
        </div>

        <Card title="รายละเอียดคำร้อง" style={{ marginTop: 24 }}>
          <Input.TextArea rows={4} placeholder="กรุณาใส่รายละเอียดคำร้องของคุณที่นี่" style={{ marginBottom: 20, backgroundColor: "white" }} value={details} onChange={(e) => setDetails(e.target.value)} />
          <p>คุณสามารถแนบไฟล์ได้หนึ่งไฟล์ที่เกี่ยวข้องได้ที่นี่...</p>
          <Upload {...uploadProps}><Button>เลือกไฟล์</Button></Upload>
        </Card>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
          <Space>
            <Button onClick={() => { setRequestType(undefined); setAssignee(undefined); setDetails(""); setFileList([]); }}>ล้างฟอร์ม</Button>
            <Button type="primary" onClick={handleSubmitClick}>ส่งคำร้อง</Button>
          </Space>
        </div>

        <Card title="ประวัติคำร้องของฉัน" style={{ marginTop: 24 }}>
          <Table
            rowKey={(r: AnyObj) => r.Report_id ?? JSON.stringify(r)}
            dataSource={rows}
            columns={columns as any}
            loading={loading}
            pagination={{ pageSize: 5 }}
            scroll={{ x: 720 }}
          />
        </Card>
      </Content>

      <Footer style={{ background: "#1890ff", color: "white", textAlign: "center", padding: 12 }}>
        Footer © 2025
      </Footer>

      <Modal
        title="ยืนยันการส่งคำร้อง"
        open={confirmOpen}
        onOk={handleConfirmOk}
        onCancel={() => setConfirmOpen(false)}
        okText="ยืนยันส่ง"
        cancelText="ตรวจแก้"
        centered
        destroyOnClose
        maskClosable={false}
        closable={false}
      >
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6 }}><Text strong>ประเภทคำร้อง: </Text><Text>{typeOptions.find((o) => o.value === requestType)?.label ?? "-"}</Text></div>
          <div style={{ marginBottom: 6 }}><Text strong>ผู้รับผิดชอบ: </Text><Text>{reviewerOptions.find((o) => o.value === assignee)?.label ?? "-"}</Text></div>
          <div style={{ marginBottom: 6 }}><Text strong>รายละเอียด: </Text><Text>{details.length > 180 ? details.slice(0, 180) + "…" : details || "-"}</Text></div>
          <div><Text strong>ไฟล์แนบ: </Text><Text>{fileList.length === 0 ? "—" : `${fileList.length} ไฟล์ (${fileList.map((f) => f.name).join(", ")})`}</Text></div>
        </div>
      </Modal>
    </Layout>
  );
};

export default ReportPage;
