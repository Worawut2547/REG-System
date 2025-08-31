package test

import (
	"log"
	"time"

	"reg_system/config"
	"reg_system/entity"

	"github.com/google/uuid"
)


func ReportExampleData() {
	db := config.DB()

	// ---------- Report Types ----------
	reportTypes := []entity.ReportType{
		{ReportType_id: "RT01", ReportType_Name: "ลาพักการเรียน", Description: "นักศึกษาขอลาพักการเรียน"},
		{ReportType_id: "RT02", ReportType_Name: "ขอลงทะเบียนเพิ่ม", Description: "นักศึกษาขอลงทะเบียนเกินเกณฑ์"},
	}
	for _, rt := range reportTypes {
		if err := db.FirstOrCreate(&rt, entity.ReportType{ReportType_id: rt.ReportType_id}).Error; err != nil {
			log.Printf("error seeding report_type %s: %v", rt.ReportType_id, err)
		}
	}

	// ---------- Reviewer ----------
	// สมมติ Reviewer มี User ที่ผูก Username ไว้แล้ว (จาก test ผู้สอน/แอดมินเดิม)
	reviewers := []entity.Reviewer{
		{Reviewer_id: "RV001", UserID: 1},
		{Reviewer_id: "RV002", UserID: 2},
	}
	for _, r := range reviewers {
		if err := db.FirstOrCreate(&r, entity.Reviewer{Reviewer_id: r.Reviewer_id}).Error; err != nil {
			log.Printf("error seeding reviewer %s: %v", r.Reviewer_id, err)
		}
	}

	// ---------- Attachment ----------
	att := entity.Attachment{
		Attachment_id: uuid.New().String(),
		File_Name:     "example.pdf",
		File_Path:     "/uploads/example.pdf",
		Uploaded_date: time.Now(),
	}
	_ = db.FirstOrCreate(&att, entity.Attachment{Attachment_id: att.Attachment_id}).Error

	// ---------- Reports ----------
	reports := []entity.Report{
		{
			Report_id:       "REP001",
			Report_details:  "ต้องการลาพักเนื่องจากเหตุผลส่วนตัว",
			Submittion_date: time.Now().Add(-48 * time.Hour),
			Status:          "รอดำเนินการ",
			StudentID:       "B6616052",
			Reviewer_id:     "RV001",
			ReportType_id:   "RT01",
		},
		{
			Report_id:       "REP002",
			Report_details:  "ขอลงทะเบียนเพิ่มวิชา Digital System",
			Submittion_date: time.Now().Add(-24 * time.Hour),
			Status:          "อนุมัติ",
			StudentID:       "B6616052",
			Reviewer_id:     "RV002",
			ReportType_id:   "RT02",
		},
	}
	for _, rp := range reports {
		if err := db.FirstOrCreate(&rp, entity.Report{Report_id: rp.Report_id}).Error; err != nil {
			log.Printf("error seeding report %s: %v", rp.Report_id, err)
		}
	}
}
