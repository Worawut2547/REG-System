// ====================================================================
// CHANGE_USER.tsx — มุมมองผู้ใช้ทั่วไป: ค้นหา + ดูเอกสาร (Read-only)
// ====================================================================

import React, { useEffect, useMemo, useState } from "react";
import { Layout, Input, Table, Button, Tag, message , Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined } from "@ant-design/icons";

const { Content } = Layout;

// ====================== 1) แบบข้อมูลที่ใช้บนตาราง (Frontend) ======================
interface DataType {
  key: string;
  id: string; // curriculum_id
  name: string; // curriculum_name
  credit: number; // total_credit
  startYear: number; // start_year
  facultyId: string; // faculty_id
  subjectIds: string[]; // วิชาของหลักสูตร
  bookId?: number; // curriculum_books.id (ถ้ามี)
  bookPath?: string; // path ที่เก็บไว้ (เผื่อแสดงชื่อไฟล์)
}

// ====================== 2) Services (เฉพาะอ่านข้อมูล) ======================
import { getSubjectCurriculumAll } from "../../../../../services/https/SubjectCurriculum/subjectcurriculum";
import type { SubjectCurriculumInterface } from "../../../../../interfaces/SubjectCurriculum";
import { getFacultyAll } from "../../../../../services/https/faculty/faculty";
import { getSubjectAll } from "../../../../../services/https/subject/subjects";
import { getCurriculumAll } from "../../../../../services/https/curriculum/curriculum";

// ✅ ดูเอกสาร (เหมือนหน้า Add)
import { getBookPreviewUrl } from "../../../../../services/https/book/books";

// ====================== 3) Helpers / normalizers ======================
type FacultyOpt = { id: string; name: string };
type SubjectOpt = { id: string; name: string };

const toFacultyOpt = (raw: unknown): FacultyOpt => {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? r.FacultyID ?? r.facultyId ?? r.faculty_id ?? ""),
    name: String(
      r.name ?? r.FacultyName ?? r.facultyName ?? r.faculty_name ?? ""
    ),
  };
};

const toSubjectOpt = (raw: unknown): SubjectOpt => {
  const r = raw as Record<string, unknown>;
  const id = String(
    r.subject_id ?? r.SubjectID ?? r.subject_code ?? r.SubjectCode ?? r.id ?? ""
  );
  const name = String(
    r.subject_name ?? r.SubjectName ?? r.name ?? r.title ?? r.Title ?? ""
  );
  return { id, name };
};

const pickString = (
  o: Record<string, unknown>,
  keys: string[],
  def = ""
): string => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" || typeof v === "number") return String(v);
  }
  return def;
};

const pickNumber = (
  o: Record<string, unknown>,
  keys: string[],
  def = 0
): number => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return def;
};

const pickArray = (o: Record<string, unknown>, keys: string[]): unknown[] => {
  for (const k of keys) {
    const v = o[k];
    if (Array.isArray(v)) return v as unknown[];
  }
  return [];
};

const toStringId = (x: unknown): string => {
  if (typeof x === "string" || typeof x === "number") return String(x);
  if (typeof x === "object" && x !== null) {
    const rec = x as Record<string, unknown>;
    if (typeof rec.id === "string" || typeof rec.id === "number")
      return String(rec.id);
    if (typeof rec.SubjectID === "string" || typeof rec.SubjectID === "number")
      return String(rec.SubjectID);
    if (
      typeof rec.subject_id === "string" ||
      typeof rec.subject_id === "number"
    )
      return String(rec.subject_id);
  }
  return "";
};

// แปลง curriculum จาก BE → row ของตาราง (รองรับ book_id/book_path)
const toCurriculumRow = (raw: unknown): DataType => {
  const r = (raw ?? {}) as Record<string, unknown>;
  const subjectList = pickArray(r, ["subjectIds", "subjects"])
    .map(toStringId)
    .filter(Boolean);

  const bookIdNum = pickNumber(r, ["book_id", "BookID"], 0);
  const bPath = pickString(r, ["book_path", "BookPath"], "");

  return {
    key: pickString(
      r,
      ["curriculum_id", "CurriculumID", "id"],
      String(Date.now())
    ),
    id: pickString(r, ["curriculum_id", "CurriculumID", "id"], ""),
    name: pickString(r, ["curriculum_name", "CurriculumName", "name"], ""),
    credit: pickNumber(r, ["total_credit", "TotalCredit", "credit"], 0),
    startYear: pickNumber(r, ["start_year", "StartYear", "startYear"], 0),
    facultyId: pickString(r, ["faculty_id", "FacultyID"], ""),
    subjectIds: subjectList,
    bookId: bookIdNum > 0 ? bookIdNum : undefined,
    bookPath: bPath || undefined,
  };
};

const baseName = (p?: string): string =>
  (p || "").replace(/\\/g, "/").split("/").pop() || "";

// ====================== 4) Component หลัก (Read-only) ======================
const SHOW: React.FC = () => {
  // ------- data & options state -------
  const [data, setData] = useState<DataType[]>([]);
  const [faculties, setFaculties] = useState<FacultyOpt[]>([]);
  const [subjects, setSubjects] = useState<SubjectOpt[]>([]);

  // ------- ui state -------
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState<string>("");

  // map สำหรับแปลง id → ชื่อเวลา render
  const facultyMap = useMemo(
    () =>
      faculties.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur.name }),
        {} as Record<string, string>
      ),
    [faculties]
  );
  const subjectMap = useMemo(
    () =>
      subjects.reduce(
        (acc, cur) => ({ ...acc, [cur.id]: cur.name }),
        {} as Record<string, string>
      ),
    [subjects]
  );

  // ------- โหลดข้อมูลทั้งหมด (อ่านอย่างเดียว) -------
  const loadAll = async () => {
    setLoading(true);
    try {
      const [facRes, subRes, curRes, scRes] = await Promise.all([
        getFacultyAll(),
        getSubjectAll(),
        getCurriculumAll(),
        getSubjectCurriculumAll(),
      ]);

      setFaculties((Array.isArray(facRes) ? facRes : []).map(toFacultyOpt));
      setSubjects((Array.isArray(subRes) ? subRes : []).map(toSubjectOpt));

      // index: curriculumId -> Set(subjectId)
      const idx: Record<string, Set<string>> = {};
      for (const link of (Array.isArray(scRes)
        ? scRes
        : []) as SubjectCurriculumInterface[]) {
        const rec = link as unknown as Record<string, unknown>;
        const cId = pickString(
          rec,
          ["curriculum_id", "CurriculumID", "major_id", "MajorID"],
          ""
        );
        const sId = pickString(
          rec,
          ["subject_id", "SubjectID", "subject_code", "SubjectCode"],
          ""
        );
        if (!cId || !sId) continue;
        if (!idx[cId]) idx[cId] = new Set<string>();
        idx[cId].add(sId);
      }

      const baseRows = (Array.isArray(curRes) ? curRes : []).map(
        toCurriculumRow
      );
      const rowsWithSubjects = baseRows.map((it) => ({
        ...it,
        subjectIds: Array.from(idx[it.id] ?? new Set<string>()),
      }));

      setData(rowsWithSubjects);
    } catch (err) {
      console.error(err);
      message.error("โหลดข้อมูลล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const filteredData = useMemo(
    () =>
      data.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (facultyMap[item.facultyId] || "")
            .toLowerCase()
            .includes(searchText.toLowerCase())
      ),
    [data, facultyMap, searchText]
  );

  // ------- คอลัมน์ตาราง (ไม่มีแก้ไข/ลบ) -------
  const columns: ColumnsType<DataType> = [
    { title: "ชื่อหลักสูตร", dataIndex: "name", width: 260 },
    { title: "หน่วยกิจรวม", dataIndex: "credit", width: 140 },
    { title: "ปีที่เริ่มหลักสูตร", dataIndex: "startYear", width: 160 },
    {
      title: "คณะ",
      dataIndex: "facultyId",
      width: 220,
      render: (facultyId: string) => facultyMap[facultyId] || "-",
    },
    {
      title: "รายวิชา",
      dataIndex: "subjectIds",
      width: 360,
      render: (ids: string[]) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(ids || []).map((id) => (
            <Tag key={id}>{subjectMap[id] || id}</Tag>
          ))}
        </div>
      ),
    },
    {
      title: "เล่นหลักสูตร",
      dataIndex: "bookPath",
      width: 360,
      render: (_: string | undefined, record: DataType) => {
        const previewUrl =
          typeof record.bookId === "number" && record.bookId > 0
            ? getBookPreviewUrl(record.bookId)
            : undefined;

        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Button
              size="small"
              type="primary"
              disabled={!previewUrl}
              onClick={() =>
                previewUrl &&
                window.open(previewUrl, "_blank", "noopener,noreferrer")
              }
            >
              ดูหลักสูตร
            </Button>
            <span style={{ color: "#888" }}>{baseName(record.bookPath)}</span>
          </div>
        );
      },
    },
  ];

  // ====================== 5) Render ======================
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: 24 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
            ค้นหาหลักสูตร
        </Typography.Title>
        <Input
          placeholder="ค้นหา curriculum หรือ faculty"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16, width: 420, height: 40, fontSize: 16 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        <Table<DataType>
          bordered
          className="custom-table-header"
          dataSource={filteredData}
          columns={columns}
          rowKey="key"
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(_rec, i) =>
            i % 2 === 0 ? "table-row-light" : "table-row-dark"
          }
        //   sticky
        //   scroll={{ x: "max-content" }}
        //   tableLayout="auto"
        />

        {/* C — Table styles */}
        <style>{`
          /* ใช้สีเส้นหลักให้ตรงกัน */
          :root { --grid-color: #f0e9e9ff; }

          .table-row-light { background-color: #ffffffff; }
          .table-row-dark  { background-color: #ffffffff; }

          .custom-table-header .ant-table-thead > tr > th {
            background: #2e236c; color: #fff; font-weight: 600; font-size: 16px;
            border-bottom: 1px solid var(--grid-color) !important;
            border-right: 1px solid var(--grid-color) !important;
          }
          .custom-table-header .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--grid-color) !important;
            border-right: 1px solid var(--grid-color) !important;
          }

          /* ปิดเส้นขาว (split line) ของหัวตาราง */
          .custom-table-header .ant-table-thead > tr > th::before {
            background: transparent !important;
            width: 0 !important;
          }
          .custom-table-header .ant-table-sticky-holder .ant-table-thead > tr > th::before {
            background: transparent !important;
            width: 0 !important;
          }
          .custom-table-header .ant-table-thead > tr > th::after {
            display: none !important;
          }

          /* AntD v5: เปลี่ยนตัวแปรสี split line ให้โปร่งใส */
          .custom-table-header .ant-table {
            --ant-table-header-column-split-color: transparent;
          }
        `}</style>
      </Content>
    </Layout>
  );
};

export default SHOW;
