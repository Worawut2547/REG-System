import React, { useEffect, useMemo, useState } from "react";
import { Card, Select, Input, Upload, Button, Modal, Space, message, Typography, List } from "antd";
import { FilePdfOutlined, FileOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd/es/upload/interface";
import axios from "axios";
import { getReportTypes, listReviewerOptions, createReport, findReviewerIdByUsername } from "../../../../../services/https/report/report";
import { apiUrl } from "../../../../../services/api";
import { getNameTeacher, getTeacherAll } from "../../../../../services/https/teacher/teacher";
import { getNameAdmin } from "../../../../../services/https/admin/admin";
import { getNameStudent as fetchStudentProfile } from "../../../../../services/https/student/student";

type Option = { value: string; label: string };
const { Text } = Typography;

type Props = { studentId?: string };

const SubmitReport: React.FC<Props> = ({ studentId: propStudentId }) => {
  // Popup picker for static PDF forms from /public/forms/index.json
  type FormFile = { name: string; path: string };
  const [pickerOpen, setPickerOpen] = useState(false);
  const [formFiles, setFormFiles] = useState<FormFile[]>([]);
  const [loadingForms, setLoadingForms] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);

  const normalizeHref = (p: string) => {
    if (!p) return "";
    if (p.startsWith("http")) return p;
    const rel = p.startsWith("/") ? p : `/${p}`;
    return `${window.location.origin}${rel}`;
  };
  const loadFormIndex = async () => {
    setLoadingForms(true);
    setPickerError(null);
    try {
      const res = await fetch(`/forms/index.json`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`โหลดรายการไฟล์ไม่สำเร็จ (${res.status})`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      const cleaned: FormFile[] = arr
        .map((it: any) => ({ name: String(it?.name || "Untitled"), path: String(it?.path || "") }))
        .filter((it: FormFile) => !!it.path && /\.pdf(\?|#|$)/i.test(it.path));
      setFormFiles(cleaned);
    } catch (e: any) {
      setPickerError(e?.message || "เกิดข้อผิดพลาดในการโหลดไฟล์");
      setFormFiles([]);
    } finally {
      setLoadingForms(false);
    }
  };
  const openFormPicker = async () => {
    setPickerOpen(true);
    await loadFormIndex();
  };
  const openInNewTab = (item: FormFile) => {
    window.open(normalizeHref(item.path), "_blank", "noopener,noreferrer");
  };

  // resolve student id from props or localStorage
  const studentId = useMemo(() => {
    if (propStudentId && propStudentId.trim()) return propStudentId.trim();
    if (typeof window === "undefined") return "";
    const username = (localStorage.getItem("username") || "").trim();
    const sid = (localStorage.getItem("student_id") || "").trim();
    return sid || username;
  }, [propStudentId]);

  const [typeOptions, setTypeOptions] = useState<Option[]>([]);
  const [reviewerOptions, setReviewerOptions] = useState<Option[]>([]);

  const [requestType, setRequestType] = useState<string>();
  const [assignee, setAssignee] = useState<string>();
  const [details, setDetails] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resolvedSid, setResolvedSid] = useState<string>("");

  const openSelectedFile = () => {
    const of = fileList[0]?.originFileObj as File | undefined;
    if (!of) return;
    try {
      const url = URL.createObjectURL(of);
      window.open(url, "_blank", "noopener,noreferrer");
      // Best-effort revoke after a short delay to allow tab to load
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      // Resolve canonical student id from backend using username when available
      try {
        const uname = (typeof window !== 'undefined') ? (localStorage.getItem('username') || '').trim() : '';
        let sid = studentId;
        if (uname) {
          const prof: any = await fetchStudentProfile(uname);
          if (prof?.StudentID) sid = String(prof.StudentID).trim();
        }
        setResolvedSid(sid);
      } catch { setResolvedSid(studentId); }

      try {
        const rtypes = await getReportTypes();
        setTypeOptions((rtypes || []).map((t: any) => ({ value: t.ReportType_id, label: t.ReportType_Name ?? t.ReportType_id })));
      } catch {}
      try {
        const reviewers = await listReviewerOptions();
        // Enrich labels: teacher => FirstName LastName, admin => เจ้าหน้าที่ (generic)
        const enriched = await Promise.all(
          (reviewers || []).map(async (o: any) => {
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
                // Always display generic label for admins
                return { value: o.value, label: "เจ้าหน้าที่" };
              }
              // When role is absent in label, try admin first then teacher
              try {
                const a = await getNameAdmin(username);
                if (a) return { value: o.value, label: "เจ้าหน้าที่" };
              } catch {}
              try {
                const t = await getNameTeacher(username);
                const full = [t?.FirstName, t?.LastName].filter(Boolean).join(" ");
                if (full) return { value: o.value, label: full };
              } catch {}
            } catch {}
            return o;
          })
        );
        let finalOpts = (enriched as any).filter((x: any) => x && x.value);

        // ถ้าไม่มีตัวเลือกของอาจารย์จาก /reviewers ให้ลองเติมจากรายการอาจารย์จริง
        const hasTeacher = finalOpts.some((o: any) => /\(teacher\)/i.test(String(o?.rawLabel || o?.label)) || /อาจารย์/.test(String(o?.label)));
        if (!hasTeacher) {
          try {
            const teachers: any[] = await getTeacherAll();
            // Try to reuse any teacher reviewer id found in the first call
            const teacherReviewerFromList = (reviewers || []).find((r: any) => /\(teacher\)/i.test(String(r?.label)));
            for (const t of teachers) {
              const uname = t?.TeacherID || t?.teacher_id;
              const full = [t?.FirstName, t?.LastName].filter(Boolean).join(" ");
              if (!uname || !full) continue;
              let rid: any = null;
              try { rid = await findReviewerIdByUsername(uname); } catch {}
              if (!rid && teacherReviewerFromList) rid = teacherReviewerFromList.value; // fallback reuse teacher reviewer id
              if (!rid) rid = "RV002"; // last-resort fallback based on seed data
              if (!rid) continue;
              if (!finalOpts.some((x: any) => x.value === rid)) {
                finalOpts.push({ value: rid, label: full });
              }
            }
          } catch {}
        }

        // ถ้า API ว่างจริงๆ ใส่ fallback อย่างน้อยเป็น "เจ้าหน้าที่" เท่านั้น
        if (!finalOpts.length) finalOpts = [{ value: "RV001", label: "เจ้าหน้าที่" }];
        setReviewerOptions(finalOpts);
      } catch {}
    })();
  }, []);

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
    ...(typeof ({} as any).maxCount !== 'undefined' ? { maxCount: 1 } : {}),
  } as UploadProps;

  const handleSubmitClick = () => {
    if (!resolvedSid) return message.warning("ไม่พบรหัสนักศึกษา กรุณาเข้าสู่ระบบใหม่");
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
        const form = new FormData();
        form.append("student_id", resolvedSid);
        form.append("report_type_id", requestType!);
        form.append("reviewer_id", assignee!);
        form.append("details", details);
        form.append("file", file);
        await axios.post(`${apiUrl}/reports/`, form, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await createReport({
          StudentID: resolvedSid,
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
    } catch (e: any) {
      message.error(e?.message || "ส่งคำร้องไม่สำเร็จ");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 100, flexWrap: "wrap", justifyContent: "center", alignItems: "center" }}>
        <Button icon={<FilePdfOutlined />} onClick={openFormPicker}>
          เลือกไฟล์คำร้อง (PDF)
        </Button>
        <Select style={{ width: 260 }} placeholder="เลือกคำร้อง" options={typeOptions} value={requestType} onChange={setRequestType} />
        <Select style={{ width: 260 }} placeholder="เลือกผู้ที่ต้องการส่งคำร้องให้" options={reviewerOptions} value={assignee} onChange={setAssignee} />
      </div>

      <Card title="รายละเอียดคำร้อง" style={{ marginTop: 24 }}>
        <Input.TextArea rows={4} placeholder="กรุณาใส่รายละเอียดคำร้องของคุณที่นี่" style={{ marginBottom: 20, backgroundColor: "white" }} value={details} onChange={(e) => setDetails(e.target.value)} />
        <p>คุณสามารถแนบไฟล์ได้หนึ่งไฟล์ที่เกี่ยวข้องได้ที่นี่...</p>
        <Upload {...uploadProps}><Button>เลือกไฟล์</Button></Upload>
        {fileList.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Space>
              <span>ไฟล์ที่เลือก: {fileList[0]?.name}</span>
              <Button
                size="small"
                onClick={openSelectedFile}
                icon={/\.pdf(\?|#|$)/i.test(fileList[0]?.name || "") ? <FilePdfOutlined /> : <FileOutlined />}
              >
                {/\.pdf(\?|#|$)/i.test(fileList[0]?.name || "") ? "เปิดไฟล์ PDF" : "เปิดไฟล์"}
              </Button>
            </Space>
          </div>
        )}
      </Card>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
        <Space>
          <Button onClick={() => { setRequestType(undefined); setAssignee(undefined); setDetails(""); setFileList([]); }}>ล้างฟอร์ม</Button>
          <Button type="primary" onClick={handleSubmitClick}>ส่งคำร้อง</Button>
        </Space>
      </div>

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

      <Modal
        title="เลือกไฟล์คำร้อง (PDF)"
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        footer={null}
        centered
      >
        {pickerError ? (
          <div style={{ color: "#ff4d4f" }}>{pickerError}</div>
        ) : (
          <List
            locale={{ emptyText: loadingForms ? "กำลังโหลด..." : "ไม่พบไฟล์" }}
            loading={loadingForms}
            dataSource={formFiles}
            renderItem={(item: FormFile) => (
              <List.Item
                actions={[
                  <Button key="open" size="small" icon={<FilePdfOutlined />} onClick={() => openInNewTab(item)}>
                    เปิดไฟล์
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={<FilePdfOutlined style={{ color: "#cf1322" }} />}
                  title={<a onClick={() => openInNewTab(item)}>{item.name}</a>}
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  );
};

export default SubmitReport;
