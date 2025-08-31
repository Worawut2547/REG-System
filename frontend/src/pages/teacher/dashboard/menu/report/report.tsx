import React, { useEffect, useMemo, useState } from "react";
import { Layout, Modal, Typography, Empty, message, Spin, Button } from "antd";
import "./report.css";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

/* ---------- Types ---------- */
type Attachment = {
  attachment_id?: string;
  Attachment_id?: string;

  // ชื่อไฟล์จาก backend มีได้หลายคีย์
  file_name?: string;
  File_name?: string;
  Attachment_File_Name?: string;

  // path จาก backend มีได้หลายคีย์
  file_path?: string;
  File_path?: string;
  Attachment_File_Path?: string;

  uploaded_date?: string;
  Uploaded_date?: string;
};

type ReportRow = {
  Report_id: string;
  report_id?: string;

  Report_details?: string;
  report_details?: string;

  StudentID?: string;
  student_id?: string;

  Reviewer_id?: string;
  reviewer_id?: string;

  ReportType_id?: string;
  ReportType?: { ReportType_Name?: string } | null;

  Submittion_date?: string;
  Submission_date?: string;
  submittion_date?: string;
  created_at?: string;
  CreatedAt?: string;

  Status?: string;
  status?: string;
  ReportStatus?: string;

  Attachment?: Attachment | Attachment[] | null;
  Attachments?: Attachment[] | null;
  attachments?: Attachment[] | null;
};

/* ---------- HTTP helpers ---------- */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  const isJSON = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok) {
    const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
    throw new Error((isJSON ? (body as any)?.error : (body as string)) || `HTTP ${res.status}`);
  }
  return (isJSON ? await res.json() : ((await res.text()) as T)) as T;
}
async function httpPut<T>(path: string, body: any): Promise<T> {
  return http<T>(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/* ---------- helpers ---------- */
function pickDate(r: ReportRow): string | undefined {
  return (
    r.Submittion_date ||
    r.Submission_date ||
    r.submittion_date ||
    r.created_at ||
    (r as any).Created_at ||
    r.CreatedAt
  );
}
function fmtDate(s?: string) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(+d)) return "—";
  return d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}
function normalizeAttachments(a: any): Attachment[] {
  if (!a) return [];
  if (Array.isArray(a)) return a;
  if (Array.isArray(a.attachments)) return a.attachments;
  return [a];
}
function attName(a: Attachment) {
  return (
    a.file_name ||
    a.File_name ||
    a.Attachment_File_Name ||
    a.attachment_id ||
    a.Attachment_id ||
    "ไฟล์แนบ"
  );
}
function attPath(a: Attachment) {
  return a.file_path || a.File_path || a.Attachment_File_Path || "";
}
function toHref(p: string) {
  if (!p) return "";
  if (p.startsWith("http://") || p.startsWith("https://")) return p;
  if (!p.startsWith("/")) return `${API_BASE}/${p}`;
  return `${API_BASE}${p}`;
}

/* ---------- Page ---------- */
const TeacherReport: React.FC = () => {
  // รวม candidate หลายค่าเพื่อหา reviewer ให้เจอแม่นขึ้น
  const candidates = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    const vals = [
      localStorage.getItem("reviewer_id") || "",
      localStorage.getItem("username") || "",
      localStorage.getItem("teacher_id") || "",
      localStorage.getItem("email") || "",
    ]
      .map((s) => s.trim())
      .filter(Boolean);
    return Array.from(new Set(vals));
  }, []);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ReportRow | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attLoading, setAttLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // เดาว่า reviewer_id เก็บไว้ใน localStorage (หรือหาได้จาก /reviewers/by-username/<username>)
        let rid = localStorage.getItem("reviewer_id") || "";
        if (!rid && candidates.length) {
          for (const cand of candidates) {
            try {
              const r = await http<{ reviewer_id: string }>(
                `/reviewers/by-username/${encodeURIComponent(cand)}`
              );
              if (r?.reviewer_id) {
                rid = r.reviewer_id;
                localStorage.setItem("reviewer_id", rid);
                break;
              }
            } catch {}
          }
        }

        // โหลดรายการสำหรับ reviewer
        let data: ReportRow[] = [];
        if (rid) {
          try {
            data = await http<ReportRow[]>(`/reviewers/${encodeURIComponent(rid)}/reports`);
          } catch {}
        }
        if (!data?.length) {
          // fallback: ดึงทั้งหมดแล้วกรอง
          const all = await http<ReportRow[]>(`/reports`);
          const lowers = candidates.map((c) => c.toLowerCase());
          data = (all || []).filter((r) => {
            if (rid && (r.Reviewer_id === rid || (r as any).reviewer_id === rid)) return true;
            const u = (r as any)?.Reviewer?.User?.Username || "";
            return u && lowers.includes(u.toLowerCase());
          });
        }

        setRows(
          [...(data || [])].sort((a, b) => {
            const ta = new Date(pickDate(a) ?? 0).getTime();
            const tb = new Date(pickDate(b) ?? 0).getTime();
            return tb - ta;
          })
        );
      } catch (e: any) {
        message.error(e?.message || "โหลดข้อมูลล้มเหลว");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [candidates]);

  const refreshList = async () => {
    try {
      setLoading(true);
      const rid = localStorage.getItem("reviewer_id") || "";
      let data: ReportRow[] = [];
      if (rid) {
        try {
          data = await http<ReportRow[]>(`/reviewers/${encodeURIComponent(rid)}/reports`);
        } catch {}
      }
      if (!data?.length) {
        const all = await http<ReportRow[]>(`/reports`);
        const lowers = candidates.map((c) => c.toLowerCase());
        data = (all || []).filter((r) => {
          if (rid && (r.Reviewer_id === rid || (r as any).reviewer_id === rid)) return true;
          const u = (r as any)?.Reviewer?.User?.Username || "";
          return u && lowers.includes(u.toLowerCase());
        });
      }
      setRows(
        [...(data || [])].sort((a, b) => {
          const ta = new Date(pickDate(a) ?? 0).getTime();
          const tb = new Date(pickDate(b) ?? 0).getTime();
          return tb - ta;
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (item: ReportRow) => {
    setSelected(item);
    setOpen(true);

    const inline =
      normalizeAttachments(item.Attachment) ||
      normalizeAttachments(item.Attachments) ||
      normalizeAttachments(item.attachments);
    if (inline.length) {
      setAttachments(inline);
      return;
    }

    // fallback: ยิง API ไปดึงไฟล์ตาม report
    try {
      setAttLoading(true);
      const id = item.Report_id || item.report_id!;
      let atts: Attachment[] = [];
      try {
        atts = await http<Attachment[]>(`/attachments/by-report/${encodeURIComponent(id)}`);
      } catch {
        try {
          atts = await http<Attachment[]>(`/attachments?report_id=${encodeURIComponent(id)}`);
        } catch {
          atts = [];
        }
      }
      setAttachments(atts || []);
    } finally {
      setAttLoading(false);
    }
  };

  const changeStatus = async (status: "อนุมัติ" | "ไม่อนุมัติ") => {
    if (!selected) return;
    try {
      setSaving(true);
      const id = selected.Report_id || selected.report_id!;
      await httpPut(`/reports/${encodeURIComponent(id)}/status`, { status });
      message.success(`อัปเดตสถานะเป็น "${status}" แล้ว`);
      setOpen(false);
      setSelected(null);
      await refreshList();
    } catch (e: any) {
      message.error(e?.message || "อัปเดตสถานะไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      style={{
        borderRadius: 8,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Header
        style={{
          background: "#2e236c",
          color: "white",
          textAlign: "center",
          padding: 16,
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        ระบบคำร้อง (ผู้พิจารณา)
      </Header>

      <Content style={{ background: "#f5f5f5", padding: 24, minHeight: 400, color: "#333", overflowY: "auto" }}>
        <div className="rq-center">
          <div className="rq-container">
            <div className="rq-panel">
              <div className="rq-head">
                <div className="rq-title">รายการคำร้องที่มอบหมายให้ฉัน</div>
                <div className="rq-tab" />
              </div>

              <div className="rq-inner">
                <div className="rq-headrow">
                  <div className="rq-coltitle" style={{ minWidth: 220 }}>เรื่อง</div>
                  <div className="rq-coltitle" style={{ minWidth: 160 }}>จาก</div>
                  <div className="rq-coltitle" style={{ minWidth: 160 }}>วันที่ยื่น</div>
                  <div className="rq-coltitle" style={{ minWidth: 180 }}>รายละเอียดทั้งหมด</div>
                </div>

                {loading ? (
                  <div style={{ padding: 32, textAlign: "center" }}>
                    <Spin />
                  </div>
                ) : rows.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีคำร้อง" />
                ) : (
                  rows.map((item) => (
                    <div key={item.Report_id || item.report_id} className="rq-grid rq-grid-row">
                      <div className="rq-cell" style={{ minWidth: 220 }}>
                        <Text className="rq-text">
                          {item.ReportType?.ReportType_Name ?? item.ReportType_id ?? "—"}
                        </Text>
                      </div>
                      <div className="rq-cell" style={{ minWidth: 160 }}>
                        <Text className="rq-text">
                          {item.StudentID || item.student_id || "—"}
                        </Text>
                      </div>
                      <div className="rq-cell" style={{ minWidth: 160 }}>
                        <Text className="rq-text">{fmtDate(pickDate(item))}</Text>
                      </div>
                      <div
                        className="rq-cell rq-cell--clickable"
                        style={{ minWidth: 180 }}
                        onClick={() => openModal(item)}
                      >
                        <span className="rq-cell-label">ดูรายละเอียด</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal รายละเอียด */}
        <Modal open={open} onCancel={() => setOpen(false)} footer={null} centered title="รายละเอียดคำร้อง">
          {selected ? (
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>
                {selected.ReportType?.ReportType_Name ?? selected.ReportType_id ?? "—"}
              </Title>

              <div style={{ marginBottom: 6 }}>
                <Text type="secondary">จาก: </Text>
                <Text>{selected.StudentID || selected.student_id || "—"}</Text>
              </div>

              <div style={{ marginBottom: 6 }}>
                <Text type="secondary">วันที่ยื่น: </Text>
                <Text>{fmtDate(pickDate(selected))}</Text>
              </div>

              <div style={{ marginBottom: 10 }}>
                <Text type="secondary">รายละเอียด: </Text>
                <div>{selected.Report_details || selected.report_details || "—"}</div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">ไฟล์แนบ: </Text>
                {attLoading ? (
                  <div style={{ display: "inline-block", marginLeft: 8 }}><Spin size="small" /></div>
                ) : attachments.length === 0 ? (
                  <Text>—</Text>
                ) : (
                  <ul style={{ marginTop: 8 }}>
                    {attachments.map((a, idx) => {
                      const href = toHref(attPath(a));
                      return (
                        <li key={a.attachment_id || a.Attachment_id || String(idx)}>
                          {href ? (
                            <a href={href} target="_blank" rel="noreferrer">
                              {attName(a)}
                            </a>
                          ) : (
                            <span>{attName(a)}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* ปุ่มสถานะ */}
              <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button disabled={saving} onClick={() => changeStatus("ไม่อนุมัติ")}>
                  ไม่อนุมัติ
                </Button>
                <Button type="primary" disabled={saving} onClick={() => changeStatus("อนุมัติ")}>
                  อนุมัติ
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      </Content>

      <Footer style={{ background: "#1890ff", color: "white", textAlign: "center", padding: 12 }}>
        Footer © 2025
      </Footer>
    </Layout>
  );
};

export default TeacherReport;
