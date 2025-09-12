import React, { useEffect, useState } from "react";
import { Typography, Empty, message, Spin, Button, Tag, Modal, Popconfirm, Card, Table, Input, List } from "antd";
import type { ColumnsType } from "antd/es/table";
import { apiUrl } from "../../../../../services/https/api";
import { getNameTeacher } from "../../../../../services/https/teacher/teacher";
import { getNameAdmin } from "../../../../../services/https/admin/admin";
import "./report.css";

const { Text, Title } = Typography;

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

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const isJSON = res.headers.get("content-type")?.includes("application/json");
  if (!res.ok) {
    const body = isJSON ? await res.json().catch(() => ({})) : await res.text();
    throw new Error((isJSON ? (body as any)?.error : (body as string)) || `HTTP ${res.status}`);
  }
  return (isJSON ? await res.json() : ((await res.text()) as T)) as T;
}
const toPublicHref = (p: string) => (!p ? "" : p.startsWith("http") ? p : p.startsWith("/") ? `${apiUrl}${p}` : `${apiUrl}/${p}`);
const pickDate = (r: Report) => r.Submittion_date || (r as any).submittion_date || r.Created_at || (r as any).created_at;
const fmtDate = (s?: string) => (!s ? "—" : (d => isNaN(+d) ? "—" : d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }))(new Date(s)));
const normalizeAttachments = (a: any): Attachment[] => !a ? [] : Array.isArray(a) ? a : Array.isArray(a.attachments) ? a.attachments : [a];
const attName = (a: any) => a.File_Name || a.file_name || a.Attachment_File_Name || a.attachment_file_name || a.Attachment_id || a.attachment_id || "ไฟล์แนบ";
const attPath = (a: any) => a.File_Path || a.file_path || a.Attachment_File_Path || a.attachment_file_path || "";
const statusTag = (s?: string) => (s || "").trim() === "อนุมัติ" ? <Tag color="green">อนุมัติ</Tag> : (s || "").trim() === "ไม่อนุมัติ" ? <Tag color="red">ไม่อนุมัติ</Tag> : <Tag color="gold">รอดำเนินการ</Tag>;
const pickStatus = (r: any): string => r?.Status ?? r?.ReportStatus ?? r?.status ?? "รอดำเนินการ";

type Props = { deleteMode?: boolean };

const StudentRequests: React.FC<Props> = ({ deleteMode = false }) => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Report[]>([]);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Report | null>(null);
  const [atts, setAtts] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [nameMap, setNameMap] = useState<Record<string, string>>({}); // username -> Full Name

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await http<Report[]>(`/reports/?role=admin`);
        const ordered = [...(data || [])].sort((a, b) => new Date(pickDate(b) ?? 0 as any).getTime() - new Date(pickDate(a) ?? 0 as any).getTime());
        setRows(ordered);
      } catch (e: any) {
        message.error(e?.message || "โหลดข้อมูลล้มเหลว");
      } finally { setLoading(false); }
    })();
  }, []);

  const loadComments = async (reportId: string) => {
    try {
      const items = await http<any[]>(`/reports/${encodeURIComponent(reportId)}/comments`);
      const arr = items || [];
      setComments(arr);
      // Enrich commenter names
      const wanted: { username: string; role: string }[] = [];
      const seen = new Set<string>();
      for (const it of arr) {
        const u = it?.Reviewer?.User;
        const username = u?.Username || u?.username;
        const role = (u?.Role || u?.role || "").toLowerCase();
        if (!username || !role) continue;
        if (nameMap[username]) continue;
        const key = role + ":" + username;
        if (seen.has(key)) continue;
        seen.add(key);
        wanted.push({ username, role });
      }
      if (wanted.length) {
        const updates: Record<string, string> = {};
        await Promise.all(
          wanted.map(async ({ username, role }) => {
            try {
              if (role === "teacher") {
                const t = await getNameTeacher(username);
                const full = [t?.FirstName, t?.LastName].filter(Boolean).join(" ");
                if (full) updates[username] = full; // e.g., "John Doe"
              } else if (role === "admin") {
                const a = await getNameAdmin(username);
                const full = [a?.FirstName, a?.LastName].filter(Boolean).join(" ");
                updates[username] = full || "เจ้าหน้าที่";
              }
            } catch { }
          })
        );
        if (Object.keys(updates).length) setNameMap((m) => ({ ...m, ...updates }));
      }
    } catch (e: any) {
      setComments([]);
    }
  };

  const submitComment = async () => {
    if (!sel?.Report_id && !(sel as any)?.report_id) return;
    const txt = (newComment || '').trim();
    if (!txt) { message.warning('กรุณาพิมพ์คอมเมนต์'); return; }
    try {
      setCommenting(true);
      const id = sel?.Report_id || (sel as any).report_id;
      await http<any>(`/reports/${encodeURIComponent(String(id))}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: txt, reviewer_id: sel?.Reviewer_id || (sel as any)?.reviewer_id })
      });
      setNewComment('');
      await loadComments(String(id));
      message.success('เพิ่มคอมเมนต์แล้ว');
    } catch (e: any) {
      message.error(e?.message || 'เพิ่มคอมเมนต์ไม่สำเร็จ');
    } finally { setCommenting(false); }
  };


  const tableColumns: ColumnsType<any> = [
    { title: 'เรื่อง', key: 'type', render: (_: any, r: any) => r?.ReportType?.ReportType_Name ?? r?.ReportType_id ?? '—' },
    { title: 'จาก', key: 'from', width: 140, render: (_: any, r: any) => r?.StudentID || r?.student_id || '—' },
    {
      title: 'วันที่ยื่น', key: 'date', width: 200, sorter: (a: any, b: any) => {
        const ta = Date.parse(pickDate(a) || '');
        const tb = Date.parse(pickDate(b) || '');
        return (isNaN(ta) ? 0 : ta) - (isNaN(tb) ? 0 : tb);
      }, defaultSortOrder: 'descend', render: (_: any, r: any) => fmtDate(pickDate(r))
    },
    { title: 'สถานะ', key: 'status', width: 140, render: (_: any, r: any) => statusTag(pickStatus(r)) },
    {
      title: 'รายละเอียดทั้งหมด', key: 'action', width: 160, render: (_: any, r: any) => (
        deleteMode ? (
          <Popconfirm title="ยืนยันลบคำร้องนี้?" onConfirm={async () => {
            try {
              const id = r.Report_id || (r as any).report_id;
              await fetch(`${apiUrl}/reports/${encodeURIComponent(String(id))}`, { method: 'DELETE' });
              message.success('ลบคำร้องแล้ว');
              setRows((prev) => prev.filter((x) => (x.Report_id || (x as any).report_id) !== id));
            } catch (e: any) {
              message.error(e?.message || 'ลบไม่สำเร็จ');
            }
          }}>
            <Button danger size="small">ลบคำร้อง</Button>
          </Popconfirm>
        ) : (
          <Button type="link" onClick={() => handleOpenModal(r)}>ดูรายละเอียด</Button>
        )
      )
    },
  ];

  const handleOpenModal = (r: Report) => {
    setSel(r);
    const list = normalizeAttachments((r as any)?.Attachments ?? (r as any)?.attachments ?? (r as any)?.Attachment ?? []);
    setAtts(list);
    // load comments for this report
    const rid = (r as any).Report_id || (r as any).report_id;
    if (rid) { loadComments(String(rid)); }
    setOpen(true);
  };

  const updateStatus = async (status: string) => {
    if (!sel?.Report_id && !(sel as any)?.report_id) return;
    setSaving(true);
    try {
      const id = sel?.Report_id || (sel as any).report_id;
      // ถ้ามีคอมเมนต์ ให้ส่งคอมเมนต์ก่อน
      const txt = (newComment || '').trim();
      if (txt) {
        await http<any>(`/reports/${encodeURIComponent(String(id))}/comments`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comment: txt, reviewer_id: sel?.Reviewer_id || (sel as any)?.reviewer_id })
        });
        setNewComment('');
        await loadComments(String(id));
      }
      await fetch(`${apiUrl}/reports/${encodeURIComponent(String(id))}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          'Content-Type': 'application/json'
        }, 
        body: JSON.stringify({ status })
      });
      // อัปเดตสถานะในรายการทันที (optimistic)
      setRows((prev) => prev.map((r) => {
        const rid = (r as any).Report_id || (r as any).report_id;
        if (String(rid) === String(id)) {
          return { ...r, Status: status } as any;
        }
        return r;
      }));
      message.success("อัปเดตสถานะสำเร็จ");
      setOpen(false);
      setSel(null);
    } catch (e: any) {
      message.error(e?.message || "อัปเดตสถานะไม่สำเร็จ");
    } finally { setSaving(false); }
  };

  // เปิดไฟล์แนบทั้งหมด (ถ้ามีมากกว่า 1)
  const openAllAttachments = () => {
    if (!atts || atts.length === 0) return;
    atts.forEach((a) => {
      const href = toPublicHref(attPath(a));
      if (href) window.open(href, '_blank', 'noopener,noreferrer');
    });
  };

  return (
    <Card title="รายการคำร้องที่ส่งให้ฉัน" style={{ borderRadius: 8 }}>
      <div className="rq-inner">
        {loading ? (
          <div style={{ padding: 32, textAlign: 'center' }}><Spin /></div>
        ) : rows.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="ไม่มีคำร้อง" />
        ) : (
          <Table
            rowKey={(r: any) => r.Report_id || r.report_id}
            columns={tableColumns as any}
            dataSource={rows}
            pagination={{ pageSize: 6 }}
          />
        )}

        <Modal open={open} onCancel={() => setOpen(false)} footer={null} centered title="รายละเอียดคำร้อง">
          {sel && (
            <div>
              <Title level={5} style={{ marginBottom: 4 }}>{sel.ReportType?.ReportType_Name ?? sel.ReportType_id ?? "—"}</Title>
              <div style={{ marginBottom: 6 }}><Text type="secondary">จาก: </Text><Text>{sel.StudentID || sel.student_id || "—"}</Text></div>
              <div style={{ marginBottom: 6 }}><Text type="secondary">วันที่ยื่น: </Text><Text>{fmtDate(pickDate(sel))}</Text></div>
              <div style={{ marginBottom: 10 }}><Text type="secondary">รายละเอียด: </Text><div>{sel.Report_details || sel.report_details || "—"}</div></div>
              <div style={{ marginBottom: 10 }}><Text type="secondary">สถานะ: </Text>{statusTag(pickStatus(sel))}</div>
              <div style={{ marginBottom: 12 }}>
                <Text type="secondary">ไฟล์แนบ: </Text>
                {atts.length === 0 ? <Text>—</Text> : (
                  <ul style={{ marginTop: 8 }}>
                    {atts.map((a, i) => (
                      <li key={a.attachment_id || a.Attachment_id || String(i)}>
                        {toPublicHref(attPath(a)) ? <a href={toPublicHref(attPath(a))} target="_blank" rel="noreferrer">{attName(a)}</a> : <span>{attName(a)}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {atts.length > 1 && (
                  <div style={{ marginTop: 8 }}>
                    <Button size="small" onClick={openAllAttachments}>เปิดไฟล์ทั้งหมด</Button>
                  </div>
                )}
              </div>
              {/* Comments */}
              <div style={{ marginTop: 16 }}>
                <Title level={5} style={{ marginBottom: 8 }}>Comment</Title>
                <List
                  size="small"
                  locale={{ emptyText: 'ยังไม่มีคอมเมนต์' }}
                  dataSource={comments}
                  renderItem={(item: any) => (
                    <List.Item>
                      <div style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          {(() => {
                            const u = item?.Reviewer?.User;
                            const role = String(u?.Role || u?.role || '').toLowerCase();
                            const uname = u?.Username || u?.username || '';
                            const display = nameMap[uname] || (role === 'admin' ? 'เจ้าหน้าที่' : (uname || 'ผู้ตรวจสอบ'));
                            return <Text strong>{display}</Text>;
                          })()}
                          <Text type="secondary">{item?.CommentDate ? new Date(item.CommentDate).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</Text>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap' }}>{item?.CommentText || item?.comment || ''}</div>
                      </div>
                    </List.Item>
                  )}
                />
                <div style={{ marginTop: 8 }}>
                  <Input.TextArea rows={2} placeholder="พิมพ์คอมเมนต์..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                </div>
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "flex-end", alignItems: 'center', flexWrap: 'wrap' }}>
                <Button onClick={submitComment} loading={commenting} disabled={!newComment.trim()}>
                  เพิ่มComment
                </Button>
                <Button onClick={() => updateStatus("ไม่อนุมัติ")} loading={saving}>ไม่อนุมัติ</Button>
                <Button type="primary" onClick={() => updateStatus("อนุมัติ")} loading={saving}>อนุมัติ</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Card>
  );
};

export default StudentRequests;
