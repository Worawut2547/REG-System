import React, { useEffect, useMemo, useState } from "react";
import { Card, Table, Modal, Typography, Tag, List, message, Button, Space } from "antd";
import { FilePdfOutlined, FileOutlined } from "@ant-design/icons";
//import axios from "axios";
import { getReportsByStudent } from "../../../../../services/https/report/report";
import { getNameStudent as fetchStudentProfile } from "../../../../../services/https/student/student";
import { getNameTeacher } from "../../../../../services/https/teacher/teacher";
import { getNameAdmin } from "../../../../../services/https/admin/admin";
import { api , apiUrl } from "../../../../../services/https/api";

type AnyObj = Record<string, any>;
const { Text, Title } = Typography;

// ---------- Helpers (keep at top-level scope) ----------
const pickDate = (r: AnyObj): Date | null => {
  const cand = r.Submittion_date || r.ReportSubmission_date || r.Submission_date || r.created_at || r.CreatedAt || r.Created_at;
  if (!cand) return null;
  const d = new Date(cand);
  return isNaN(+d) ? null : d;
};
const pickStatus = (r: AnyObj): string => (r.Status ?? r.ReportStatus ?? r.status ?? "รอดำเนินการ");

// attachments helpers
const toPublicHref = (p: string) => (!p ? "" : p.startsWith("http") ? p : p.startsWith("/") ? `${apiUrl}${p}` : `${apiUrl}/${p}`);
const attName = (a: AnyObj) => a.File_Name || a.file_name || a.Attachment_File_Name || a.attachment_file_name || a.Attachment_id || a.attachment_id || "ไฟล์แนบ";
const attPath = (a: AnyObj) => a.File_Path || a.file_path || a.Attachment_File_Path || a.attachment_file_path || "";
const normalizeAttachments = (a: any): AnyObj[] => (!a ? [] : Array.isArray(a) ? a : Array.isArray(a.attachments) ? a.attachments : [a]);

// reviewer display name
const displayReviewer = (row: AnyObj, nameMap: Record<string, string>): string => {
  const u = row?.Reviewer?.User || {};
  const role = String(u?.Role || u?.role || "").toLowerCase();
  const uname = String(u?.Username || u?.username || "");
  // explicit roles
  if (role === "admin") return "เจ้าหน้าที่";
  if (role === "teacher") return nameMap[uname] || "อาจารย์";
  // heuristics when role missing
  if (/^t\w+/i.test(uname)) return nameMap[uname] || "อาจารย์"; // teacher IDs often start with T
  if (/^admin$/i.test(uname)) return "เจ้าหน้าที่";
  // if has reviewer id but no good name, prefer generic label instead of showing username/id
  if (row?.Reviewer_id || row?.reviewer_id) return "เจ้าหน้าที่";
  return "-";
};

type Props = { studentId?: string };

const CheckStatus: React.FC<Props> = ({ studentId: propStudentId }) => {
  // resolve student id
  const studentId = useMemo(() => {
    if (propStudentId && propStudentId.trim()) return propStudentId.trim();
    if (typeof window === "undefined") return "";
    const username = (localStorage.getItem("username") || "").trim();
    const sid = (localStorage.getItem("student_id") || "").trim();
    return sid || username;
  }, [propStudentId]);

  const [rows, setRows] = useState<AnyObj[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDetail, setOpenDetail] = useState(false);
  const [sel, setSel] = useState<AnyObj | null>(null);
  const [comments, setComments] = useState<AnyObj[]>([]);
  const [nameMap, setNameMap] = useState<Record<string, string>>({}); // username -> full name

  // enrich teacher/admin names for table
  const hydrateNames = async (items: AnyObj[]) => {
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
    if (!wanted.length) return;
    const updates: Record<string, string> = {};
    await Promise.all(wanted.map(async ({ username, role }) => {
      try {
        if (role === "teacher") {
          const t = await getNameTeacher(username);
          const full = [t?.FirstName, t?.LastName].filter(Boolean).join(" ");
          if (full) updates[username] = full;
        } else if (role === "admin") {
          const a = await getNameAdmin(username);
          const full = [a?.FirstName, a?.LastName].filter(Boolean).join(" ");
          updates[username] = full || "เจ้าหน้าที่";
        }
      } catch {}
    }));
    if (Object.keys(updates).length) setNameMap((m) => ({ ...m, ...updates }));
  };

  const fetchAll = async (sid: string) => {
    setLoading(true);
    try {
      const history = await getReportsByStudent(sid);
      const normalized = (history || []).map((r: AnyObj) => ({ ...r, _date: pickDate(r), _status: pickStatus(r) }));
      setRows(normalized);
      await hydrateNames(normalized);
    } catch (e: any) {
      message.error(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    } finally { setLoading(false); }
  };

  // Resolve canonical student id from backend profile if possible
  useEffect(() => {
    const init = async () => {
      const lsSid = (typeof window !== 'undefined') ? (localStorage.getItem('student_id') || '').trim() : '';
      const uname = (typeof window !== 'undefined') ? (localStorage.getItem('username') || '').trim() : '';
      let sid = studentId || lsSid || uname;
      try {
        if (uname) {
          const prof: any = await fetchStudentProfile(uname);
          if (prof?.StudentID) sid = String(prof.StudentID).trim();
        }
      } catch {}
      if (sid) await fetchAll(sid);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // (removed) delete attachment UI per request

  const loadComments = async (reportId: string) => {
    try {
      const res = await api.get(`/reports/${encodeURIComponent(reportId)}/comments`);
      const arr = Array.isArray(res.data) ? res.data : [];
      setComments(arr);
      // hydrate commenters' names
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
        await Promise.all(wanted.map(async ({ username, role }) => {
          try {
            if (role === "teacher") {
              const t = await getNameTeacher(username);
              const full = [t?.FirstName, t?.LastName].filter(Boolean).join(" ");
              if (full) updates[username] = full;
            } else if (role === "admin") {
              const a = await getNameAdmin(username);
              const full = [a?.FirstName, a?.LastName].filter(Boolean).join(" ");
              updates[username] = full || "เจ้าหน้าที่";
            }
          } catch {}
        }));
        if (Object.keys(updates).length) setNameMap((m) => ({ ...m, ...updates }));
      }
    } catch {
      setComments([]);
    }
  };

  const handleOpenDetail = async (r: AnyObj) => {
    setSel(r);
    const rid = r?.Report_id || r?.report_id;
    if (rid) await loadComments(String(rid));
    setOpenDetail(true);
  };

  const columns = useMemo(() => ([
    { title: "วันที่ยื่น", dataIndex: "_date", key: "date", sorter: (a: AnyObj, b: AnyObj) => (a._date?.getTime() ?? 0) - (b._date?.getTime() ?? 0), defaultSortOrder: "descend" as const, render: (d: Date | null) => (d ? d.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" }) : "-") , width: 200 },
    { title: "ประเภท", key: "type", render: (_: any, r: AnyObj) => r?.ReportType?.ReportType_Name ?? r?.ReportType_id ?? "-", width: 220 },
    { title: "ผู้พิจารณา", key: "reviewer", render: (_: any, r: AnyObj) => displayReviewer(r, nameMap), width: 220 },
    { title: "สถานะ", dataIndex: "_status", key: "status", render: (s: string) => <Tag color={s === 'อนุมัติ' ? 'green' : s === 'ไม่อนุมัติ' ? 'red' : 'gold'}>{s}</Tag>, width: 140 },
    { title: "รายละเอียด", key: "action", width: 140, render: (_: any, r: AnyObj) => (<Button type="link" onClick={() => handleOpenDetail(r)}>ดูรายละเอียด</Button>) },
  ]), [nameMap]);

  return (
    <Card title="ประวัติคำร้องของฉัน" style={{ borderRadius: 8 }}>
      <Table
        rowKey={(r: AnyObj) => r.Report_id ?? JSON.stringify(r)}
        dataSource={rows}
        columns={columns as any}
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 720 }}
      />

      <Modal title="รายละเอียดคำร้อง" open={openDetail} onCancel={() => setOpenDetail(false)} footer={null} centered>
        {sel && (
          <div>
            <Title level={5} style={{ marginBottom: 4 }}>{sel?.ReportType?.ReportType_Name ?? sel?.ReportType_id ?? '-'}</Title>
            <div style={{ marginBottom: 6 }}><Text type="secondary">จาก: </Text><Text>{sel?.StudentID || sel?.student_id || '-'}</Text></div>
            <div style={{ marginBottom: 6 }}><Text type="secondary">วันที่ยื่น: </Text><Text>{pickDate(sel)?.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</Text></div>
            <div style={{ marginBottom: 10 }}><Text type="secondary">รายละเอียด: </Text><div>{sel?.Report_details || sel?.report_details || '-'}</div></div>
            <div style={{ marginBottom: 10 }}>
              <Text type="secondary">สถานะ: </Text>
              <Tag color={pickStatus(sel) === 'อนุมัติ' ? 'green' : pickStatus(sel) === 'ไม่อนุมัติ' ? 'red' : 'gold'}>{pickStatus(sel)}</Tag>
            </div>
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary">ไฟล์แนบ: </Text>
              {(() => {
                const atts = normalizeAttachments((sel as any)?.Attachments || (sel as any)?.attachments || (sel as any)?.Attachment || []);
                if (!atts.length) return <Text>—</Text>;
                return (
                  <ul style={{ marginTop: 8 }}>
                    {atts.map((a: AnyObj, i: number) => {
                      const href = toPublicHref(attPath(a));
                      const name = attName(a);
                      const isPdf = /\.pdf(\?|#|$)/i.test(href || name);
                      return (
                        <li key={a.attachment_id || a.Attachment_id || String(i)}>
                          <Space size={8}>
                            {href ? (
                              <a href={href} target="_blank" rel="noreferrer">{name}</a>
                            ) : (
                              <span>{name}</span>
                            )}
                            {href && (
                              <Button
                                size="small"
                                type="default"
                                onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
                                icon={isPdf ? <FilePdfOutlined /> : <FileOutlined />}
                              >
                                {isPdf ? "เปิดไฟล์ PDF" : "เปิดไฟล์"}
                              </Button>
                            )}
                          </Space>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </div>

            <div style={{ marginTop: 8 }}>
              <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>Comment</Title>
              <List className="comment-list" size="small" locale={{ emptyText: 'ยังไม่มีคอมเมนต์' }} dataSource={comments}
                renderItem={(item: any) => (
                  <List.Item className="comment-item">
                    <div style={{ width: '100%' }}>
                      <div className="comment-header">
                        {(() => {
                          const u = item?.Reviewer?.User;
                          const role = String(u?.Role || u?.role || '').toLowerCase();
                          const uname = u?.Username || u?.username || '';
                          const display = role === 'admin' ? 'เจ้าหน้าที่' : (nameMap[uname] || uname || 'ผู้ตรวจสอบ');
                          return <Text className="comment-name">{display}</Text>;
                        })()}
                        <Text className="comment-date">{item?.CommentDate ? new Date(item.CommentDate).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : ''}</Text>
                      </div>
                      <div className="comment-text">{item?.CommentText || item?.comment || ''}</div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default CheckStatus;