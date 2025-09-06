import React, { useState } from "react";
import { Layout } from "antd";
import TeacherDashboard from "./dashboard";
import StudentScorePage from "./table";

const { Header, Content, Footer } = Layout;

const Score: React.FC = () => {
  const [view, setView] = useState<"dashboard" | "student-score">("dashboard");
  const [selectedCourse, setSelectedCourse] = useState<{ code: string; name: string } | null>(null);
  const [scoreTypes, setScoreTypes] = useState<string[]>([]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ background: "#2e236c", color: "white", textAlign: "center", fontSize: 24 ,borderTopLeftRadius: 12, borderTopRightRadius: 12,}}>
        กรอกคะแนนรายวิชา
      </Header>

      <Content style={{ background: "#f5f5f5", padding: 24 }}>
        {view === "dashboard" && (
          <TeacherDashboard
            onSelectCourse={(course) => {
              setSelectedCourse(course);
              setView("student-score");
            }}
          />
        )}
        {view === "student-score" && selectedCourse && (
          <StudentScorePage
            course={selectedCourse}
            scoreTypes={scoreTypes}
            setScoreTypes={setScoreTypes}
            onBack={() => setView("dashboard")}
          />
        )}
      </Content>

      <Footer style={{ background: "#1890ff", color: "white", textAlign: "center" , borderBottomLeftRadius: 12, borderBottomRightRadius: 12,}}>
        Footer © 2025
      </Footer>
    </Layout>
  );
};

export default Score;
