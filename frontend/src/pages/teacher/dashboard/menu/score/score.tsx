import React, { useState, useEffect } from "react";
import { Layout } from "antd";
import TeacherDashboard from "./Dashboard/dashboard";
import StudentScorePage from "./TableScore/table";
import { getSubjectByTeacherID } from "../../../../../services/https/teacher/teacher";

const { Header, Content, Footer } = Layout;

type APISubject = {
    AcademicYear: number;
    Term: number;
    SubjectID: string;
    SubjectName: string;
    Credit: number;
};

type Course = {
    code: string;
    name: string;
    color: string;
    credit: number;
    year: number;
    term: number;
};

const subjectColors = ["#dad9ddff", "#c1c7d7ff" , "#b3bdd8ff"];

const ScorePage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [year, setYear] = useState<string>("2568");
    const [term, setTerm] = useState<string>("1");
    const [view, setView] = useState<"dashboard" | "student-score">("dashboard");
    const [selectedCourse, setSelectedCourse] = useState<{ code: string; name: string } | null>(null);

    // ดึงข้อมูลรายวิชา
    useEffect(() => {
        const fetchSubjects = async () => {
            const apiData: APISubject[] = await getSubjectByTeacherID();
            const yearSet = new Set<string>();
            const termSet = new Set<string>();
            const mapped = apiData.map((s, idx) => {
                yearSet.add(String(s.AcademicYear));
                termSet.add(String(s.Term));
                return {
                    code: s.SubjectID,
                    name: s.SubjectName,
                    color: subjectColors[idx % subjectColors.length],
                    credit: s.Credit,
                    year: s.AcademicYear,
                    term: s.Term,
                };
            });
            setCourses(mapped);
            if (!year) setYear(Array.from(yearSet).sort().reverse()[0]);
            if (!term) setTerm(Array.from(termSet).sort().reverse()[0]);
        };
        fetchSubjects();
    }, []);

    const yearOptions = Array.from(new Set(courses.map(c => String(c.year)))).sort().reverse();
    const termOptions = Array.from(new Set(courses.map(c => String(c.term)))).sort();

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Header style={{ background: "#2e236c", color: "white", fontSize: 24, textAlign: "center" , borderTopRightRadius: "8px" , borderTopLeftRadius: "8px"}}>
                รายงานผลคะแนน
            </Header>
            <Content style={{ padding: 50 }}>
                {view === "dashboard" && (
                    <TeacherDashboard
                        courses={courses}
                        year={year}
                        term={term}
                        setYear={setYear}
                        setTerm={setTerm}
                        yearOptions={yearOptions}
                        termOptions={termOptions}
                        onSelectCourse={(course) => {
                            setSelectedCourse(course); // เก็บวิชาที่เลือก
                            setView("student-score"); // เปลี่ยนไปหน้า Student Grade
                        }}
                    />
                )}

                {view === "student-score" && selectedCourse && (
                    <StudentScorePage
                        subjectCode={selectedCourse.code}
                        subjectName={selectedCourse.name}
                        onBack={() => setView("dashboard")}
                    />
                )}
            </Content>
            <Footer style={{ padding: 12, textAlign: "center", background: "#1890ff", color: "white" , borderBottomRightRadius: "8px" , borderBottomLeftRadius: "8px"}}>Footer © 2025</Footer>

        </Layout>
    );
};

export default ScorePage;
