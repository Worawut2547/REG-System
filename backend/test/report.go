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
    // หา user_id ของ admin และ teacher จากตาราง users แบบไม่เดาเลข id
    type userRow struct{ ID uint; Role string; Username string }
    var users []userRow
    _ = db.Table("users").Select("id, role, username").Where("role IN ('admin','teacher')").Find(&users).Error
    var adminID uint
    var teacherID uint
    for _, u := range users {
        if u.Role == "admin" && adminID == 0 { adminID = u.ID }
        if u.Role == "teacher" && teacherID == 0 { teacherID = u.ID }
    }
    // ถ้ายังหาไม่ได้ ให้ fallback เป็น 1 และ 3 (กรณีฐานข้อมูลใหม่ที่ id เริ่มต้น)
    if adminID == 0 { adminID = 1 }
    if teacherID == 0 { teacherID = 3 }

    reviewers := []entity.Reviewer{
        {Reviewer_id: "RV001", UserID: adminID},
        {Reviewer_id: "RV002", UserID: teacherID},
    }
    for _, r := range reviewers {
        var exist entity.Reviewer
        if err := db.Where("reviewer_id = ?", r.Reviewer_id).First(&exist).Error; err == nil {
            // อัปเดตให้ตรงกับที่คาด (กันกรณีเคย seed ผิด user_id มาก่อน)
            _ = db.Model(&exist).Updates(map[string]any{"user_id": r.UserID}).Error
        } else {
            if err := db.Create(&r).Error; err != nil {
                log.Printf("error seeding reviewer %s: %v", r.Reviewer_id, err)
            }
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
			Report_details:  "ขอลงทะเบียนเพิ่มวิชา Embedded",
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
