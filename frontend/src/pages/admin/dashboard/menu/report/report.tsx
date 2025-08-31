// src/pages/AdminReportPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { Layout, Modal, Typography, Empty, message, Spin, Button, Tag } from "antd";
import "./report.css";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

type ReviewerUser = { Username?: string; username?: string };
type Reviewer = { Reviewer_id?: string; reviewer_id?: string; User?: ReviewerUser | null };
type ReportType = { ReportType_id?: string; ReportType_Name?: string };
type Attachment = {
  Attachment_id?: string; attachment_id?: string;
  File_Name?: string; file_name?: string;
  File_Path?: string; file_path?: string;
  Uploaded_date?: string; uploaded_date?: string;
};
type Report = {
  Report_id?: string; report_id?: string;
  StudentID?: string; student_id?: string;
  Reviewer_id?: string; reviewer_id?: string;
  ReportType_id?: string; ReportType?: ReportType | null;
  Report_details?: string; report_details?: string;
  Submittion_date?: string; submittion_date?: string;
  Created_at?: string; created_at?: string;
  Status?: string; status?: string;
  Attachments?: Attachment[] | null; attachments?: Attachment[] | null; Attachment?: Attachment | Attachment[] | null;
  Reviewer?: Reviewer | null;
};

/* ---------------- HTTP helpers ---------------- */
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init);
  const isJSON = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok) {
    const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
    throw new Error((isJSON ? (body as any)?.error : (body as string)) || `HTTP ${res.status}`);
  }
  return (isJSON ? await res.json() : ((await res.text()) as T)) as T;
}
const toPublicHref = (p: string) => (!p ? "" : p.startsWith("http") ? p : p.startsWith("/") ? `${API_BASE}${p}` : `${API_BASE}/${p}`);

async function getReviewerIdByUsername(username: string): Promise<string | null> {
  if (!username) return null;
  try {
    const r = await http<{ reviewer_id: string }>(`/reviewers/by-username/${encodeURIComponent(username)}`);
    return r?.reviewer_id || null;
  } catch { return null; }
}
async function getReportsOnlyAdmin(rid: string) {
  return http<Report[]>(`/reviewers/${encodeURIComponent(rid)}/reports?only=admin`);
}

/* ---------------- UI helpers ---------------- */
const pickDate = (r: Report) => r.Submittion_date || (r as any).submittion_date || r.Created_at || (r as any).created_at;
const fmtDate = (s?: string) => (!s ? "—" : (d => isNaN(+d) ? "—" : d.toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"}))(new Date(s)));
const normalizeAttachments = (a: any): Attachment[] => !a ? [] : Array.isArray(a) ? a : Array.isArray(a.attachments) ? a.attachments : [a];
const attName = (a: Attachment) => a.File_Name || a.file_name || a.Attachment_id || a.attachment_id || "ไฟล์แนบ";
const attPath = (a: Attachment) => a.File_Path || a.file_path || "";
const statusTag = (s?: string) => (s||"").trim()==="อนุมัติ" ? <Tag color="green">อนุมัติ</Tag> : (s||"").trim()==="ไม่อนุมัติ" ? <Tag color="red">ไม่อนุมัติ</Tag> : <Tag color="gold">รอดำเนินการ</Tag>;

const AdminReportPage: React.FC = () => {
  // เดา reviewer จาก localStorage หลาย key
  const candidates = useMemo(() => {
    if (typeof window === "undefined") return [] as string[];
    return Array.from(new Set(
      [localStorage.getItem("reviewer_id"), localStorage.getItem("admin_id"), localStorage.getItem("username"), localStorage.getItem("email")]
        .filter(Boolean).map(s => s!.trim())
    ));
  }, []);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Report[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Report | null>(null);
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // (1) หา reviewer_id จาก localStorage / username → /reviewers/by-username/:username
        let rid = localStorage.getItem("reviewer_id") || "";
        if (!rid && candidates.length) {
          for (const c of candidates) {
            const found = await getReviewerIdByUsername(c);
            if (found) { rid = found; localStorage.setItem("reviewer_id", rid); break; }
          }
        }
        if (!rid) { setRows([]); return; }

        // (2) โหลดเฉพาะงานที่ reviewer นี้เป็น admin จริง ๆ
        let data = await getReportsOnlyAdmin(rid);  // → ถ้าไม่ใช่ admin จะได้ []
        // (3) Fallback: ถ้า [] ให้ดึง /reports แล้วกรองด้วย reviewer ของเรา/username เพื่อให้เห็นรายการอย่างน้อย
        if (!data?.length) {
          try {
            const all = await http<Report[]>('/reports');
            const lowers = candidates.map(c => c.toLowerCase());
            data = (all || []).filter(r => {
              const rvrId = r.Reviewer_id || (r as any).reviewer_id;
              const uname = (r as any)?.Reviewer?.User?.Username || '';
              return rvrId === rid || (uname && lowers.includes(uname.toLowerCase()));
            });
          } catch {}
        }

        setRows([...(data||[])].sort((a,b)=>new Date(pickDate(b)??0).getTime() - new Date(pickDate(a)??0).getTime()));
      } catch (e:any) {
        message.error(e?.message || "โหลดข้อมูลล้มเหลว");
        setRows([]);
      } finally { setLoading(false); }
    })();
  }, [candidates]);

  const openModal = (r: Report) => {
    setSel(r); setOpen(true);
    setAtts(
      normalizeAttachments(r.Attachments) ||
      normalizeAttachments(r.attachments) ||
      normalizeAttachments(r.Attachment)
    );
  };

  const updateStatus = async (status: "อนุมัติ"|"ไม่อนุมัติ") => {
    if (!sel) return;
    try {
      setSaving(true);
      const id = sel.Report_id || sel.report_id!;
      await http(`/reports/${encodeURIComponent(id)}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
      });
      message.success(`อัปเดตสถานะเป็น "${status}" แล้ว`);
      setRows(prev => prev.map(x => ((x.Report_id||x.report_id)===id ? { ...x, Status: status, status } : x)));
      setOpen(false); setSel(null);
    } catch (e:any) { message.error(e?.message || "อัปเดตสถานะไม่สำเร็จ"); }
    finally { setSaving(false); }
  };

  return (
    <Layout style={{borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,0.08)",width:"100%",minHeight:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <Header style={{background:"#2e236c",color:"#fff",textAlign:"center",padding:16,fontSize:20,fontWeight:700}}>
        ระบบคำร้อง (ผู้ดูแลระบบ)
      </Header>

      <Content style={{background:"#f5f5f5",padding:24,minHeight:400,color:"#333",overflowY:"auto"}}>
        <div className="rq-center">
          <div className="rq-container">
            <div className="rq-panel">
              <div className="rq-head">
                <div className="rq-title">รายการคำร้องที่ส่งให้ฉัน (Admin)</div>
                <div className="rq-tab" />
              </div>

              <div className="rq-inner">
                <div className="rq-headrow" style={{gridTemplateColumns:"1.6fr 1.1fr 1fr .9fr 1fr"}}>
                  <div className="rq-coltitle" style={{minWidth:240}}>เรื่อง</div>
                  <div className="rq-coltitle" style={{minWidth:160}}>จาก</div>
                  <div className="rq-coltitle" style={{minWidth:140}}>วันที่ยื่น</div>
                  <div className="rq-coltitle" style={{minWidth:140}}>สถานะ</div>
                  <div className="rq-coltitle" style={{minWidth:160}}>รายละเอียดทั้งหมด</div>
                </div>

                {loading ? (
                  <div style={{padding:32,textAlign:"center"}}><Spin/></div>
                ) : rows.length===0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีคำร้อง"/>
                ) : rows.map(item=>(
                  <div key={item.Report_id || item.report_id} className="rq-grid rq-grid-row" style={{gridTemplateColumns:"1.6fr 1.1fr 1fr .9fr 1fr"}}>
                    <div className="rq-cell" style={{minWidth:240}}>
                      <Text className="rq-text">{item.ReportType?.ReportType_Name ?? item.ReportType_id ?? "—"}</Text>
                    </div>
                    <div className="rq-cell" style={{minWidth:160}}>
                      <Text className="rq-text">{item.StudentID || item.student_id || "—"}</Text>
                    </div>
                    <div className="rq-cell" style={{minWidth:140}}>
                      <Text className="rq-text">{fmtDate(pickDate(item))}</Text>
                    </div>
                    <div className="rq-cell" style={{minWidth:140}}>
                      {statusTag(item.Status || (item as any).status)}
                    </div>
                    <div className="rq-cell rq-cell--clickable" style={{minWidth:160}} onClick={()=>openModal(item)}>
                      <span className="rq-cell-label">ดูรายละเอียด</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal */}
        <Modal open={open} onCancel={()=>setOpen(false)} footer={null} centered title="รายละเอียดคำร้อง">
          {sel && (
            <div>
              <Title level={5} style={{marginBottom:4}}>{sel.ReportType?.ReportType_Name ?? sel.ReportType_id ?? "—"}</Title>
              <div style={{marginBottom:6}}><Text type="secondary">จาก: </Text><Text>{sel.StudentID || sel.student_id || "—"}</Text></div>
              <div style={{marginBottom:6}}><Text type="secondary">วันที่ยื่น: </Text><Text>{fmtDate(pickDate(sel))}</Text></div>
              <div style={{marginBottom:10}}><Text type="secondary">รายละเอียด: </Text><div>{sel.Report_details || sel.report_details || "—"}</div></div>

              <div style={{marginBottom:12}}>
                <Text type="secondary">ไฟล์แนบ: </Text>
                {atts.length===0 ? <Text>—</Text> : (
                  <ul style={{marginTop:8}}>
                    {atts.map((a,i)=>(
                      <li key={a.attachment_id||a.Attachment_id||String(i)}>
                        {toPublicHref(attPath(a)) ? <a href={toPublicHref(attPath(a))} target="_blank" rel="noreferrer">{attName(a)}</a> : <span>{attName(a)}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div style={{marginTop:16,display:"flex",gap:8,justifyContent:"flex-end"}}>
                <Button onClick={()=>updateStatus("ไม่อนุมัติ")} loading={saving}>ไม่อนุมัติ</Button>
                <Button type="primary" onClick={()=>updateStatus("อนุมัติ")} loading={saving}>อนุมัติ</Button>
              </div>
            </div>
          )}
        </Modal>
      </Content>

      <Footer style={{background:"#1890ff",color:"#fff",textAlign:"center",padding:12}}>Footer © 2025</Footer>
    </Layout>
  );
};

export default AdminReportPage;
