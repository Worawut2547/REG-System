package services

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"reg_system/entity"
)

/* =========================
   Reviewer / Role Utilities
   ========================= */

func getUserRoleByReviewerID(db *gorm.DB, reviewerID string) (string, error) {
	type row struct {
		Role string
	}
	var r row
	err := db.
		Table("reviewers r").
		Select("u.role AS role").
		Joins("JOIN users u ON u.id = r.user_id").
		Where("r.reviewer_id = ?", reviewerID).
		Scan(&r).Error
	if err != nil {
		return "", err
	}
	return r.Role, nil
}

func ReviewerIsAdminService(db *gorm.DB, reviewerID string) (bool, error) {
	role, err := getUserRoleByReviewerID(db, reviewerID)
	if err != nil {
		return false, err
	}
	return role == "admin", nil
}

/* =========================
   Query helpers
   ========================= */

func preloadReport(q *gorm.DB) *gorm.DB {
	return q.
		Preload("ReportType").
		Preload("Reviewer.User").
		Preload("Attachments")
}

func orderReport(q *gorm.DB) *gorm.DB {
	return q.Order("submittion_date DESC").Order("created_at DESC")
}

/* =========================
   Services (Reads)
   ========================= */

// ทั้งหมด
func GetReportsService(db *gorm.DB) ([]entity.Report, error) {
	var items []entity.Report
	err := preloadReport(orderReport(db)).Find(&items).Error
	return items, err
}

// ตาม id
func GetReportByIDService(db *gorm.DB, id string) (*entity.Report, error) {
	var item entity.Report
	err := preloadReport(db).Where("report_id = ?", id).First(&item).Error
	if err != nil {
		return nil, err
	}
	return &item, nil
}

// ตาม reviewer ทั้งหมด (ใช้กับ teacher / reviewer ทั่วไป)
func GetReportsByReviewerService(db *gorm.DB, reviewerID string) ([]entity.Report, error) {
	var items []entity.Report
	err := preloadReport(orderReport(db)).
		Where("reviewer_id = ?", reviewerID).
		Find(&items).Error
	return items, err
}

// Strict admin → ถ้าไม่ได้ role=admin จะคืน [] โดยตั้งใจ (ใช้ภายในเท่านั้น)
func getReportsByAdminStrict(db *gorm.DB, reviewerID string) ([]entity.Report, error) {
	isAdmin, err := ReviewerIsAdminService(db, reviewerID)
	if err != nil {
		return nil, err
	}
	if !isAdmin {
		// ไม่ใช่ admin → ตั้งใจให้ว่าง
		return []entity.Report{}, nil
	}
	var items []entity.Report
	err = preloadReport(orderReport(db)).
		Where("reviewer_id = ?", reviewerID).
		Find(&items).Error
	return items, err
}

// Admin service ที่มี fallback: เคร่งครัดก่อน → ถ้าว่าง ค่อยดึงตาม reviewer_id (ไม่เช็ค role)
func GetReportsByAdminReviewerService(db *gorm.DB, reviewerID string) ([]entity.Report, error) {
	// 1) โหมดเข้มงวด (ต้องเป็น admin จริง)
	itemsStrict, err := getReportsByAdminStrict(db, reviewerID)
	if err != nil {
		return nil, err
	}
	if len(itemsStrict) > 0 {
		return itemsStrict, nil
	}

	// 2) fallback: ดึงตาม reviewer_id ตรง ๆ เพื่อให้หน้า Admin ไม่ว่าง
	var items []entity.Report
	err = preloadReport(orderReport(db)).
		Where("reviewer_id = ?", reviewerID).
		Find(&items).Error
	return items, err
}

// ตาม student
func GetReportsByStudentService(db *gorm.DB, sid string) ([]entity.Report, error) {
	var items []entity.Report
	err := preloadReport(orderReport(db)).
		Where("student_id = ? OR studentid = ?", sid, sid).
		Find(&items).Error
	return items, err
}

// master data
func ListReportTypesService(db *gorm.DB) ([]entity.ReportType, error) {
	var items []entity.ReportType
	err := db.Order("report_type_id ASC").Find(&items).Error
	return items, err
}

// รายการ reviewers ที่เป็น teacher/admin (ใช้ทำ dropdown)
type ReviewerOption struct {
	Value string `json:"value"` // reviewer_id
	Label string `json:"label"` // ชื่อ + (role)
}

func ListAssignableReviewersService(db *gorm.DB) ([]ReviewerOption, error) {
	type row struct {
		ReviewerID string
		Username   string
		Role       string
	}
	var rows []row
	// เลือกเฉพาะ user ที่ role เป็น teacher/admin
	err := db.
		Table("reviewers r").
		Select("r.reviewer_id, u.username, u.role").
		Joins("JOIN users u ON u.id = r.user_id").
		Where("u.role IN ('teacher','admin')").
		Order("u.role DESC, r.reviewer_id ASC").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	opts := make([]ReviewerOption, 0, len(rows))
	for _, it := range rows {
		label := it.Username
		if it.Role != "" {
			label = fmt.Sprintf("%s (%s)", label, it.Role)
		}
		opts = append(opts, ReviewerOption{
			Value: it.ReviewerID,
			Label: label,
		})
	}
	return opts, nil
}

// หา reviewer_id จาก username (ใช้แม็พตอน FE login แล้วรู้ username)
func FindReviewerIDByUsernameService(db *gorm.DB, username string) (string, error) {
	type row struct {
		ReviewerID string
	}
	var r row
	err := db.
		Table("reviewers r").
		Select("r.reviewer_id").
		Joins("JOIN users u ON u.id = r.user_id").
		Where("LOWER(u.username) = LOWER(?)", username).
		Limit(1).
		Scan(&r).Error
	if err != nil {
		return "", err
	}
	if r.ReviewerID == "" {
		return "", gorm.ErrRecordNotFound
	}
	return r.ReviewerID, nil
}

/* =========================
   Mutations
   ========================= */

// เปลี่ยนสถานะ
func UpdateReportStatusService(db *gorm.DB, id, status string) error {
	return db.Model(&entity.Report{}).
		Where("report_id = ?", id).
		Updates(map[string]interface{}{
			"status":     status,
			"updated_at": time.Now(),
		}).Error
}

// สร้างคำร้อง (ตัว service ดูแลเฉพาะข้อมูลใน DB; ไฟล์แนบให้ controller จัดการ save แล้วส่งเข้ามา)
type CreateReportInput struct {
	ReportID      string
	StudentID     string
	ReviewerID    string
	ReportTypeID  string
	Details       string
	SubmittedAt   *time.Time
	Attachment    *entity.Attachment // ถ้ามี
}

func CreateReportTxService(db *gorm.DB, in CreateReportInput) (*entity.Report, error) {
	if in.StudentID == "" || in.ReviewerID == "" || in.ReportTypeID == "" {
		return nil, errors.New("missing required fields")
	}

	now := time.Now()
	rep := entity.Report{
		Report_id:       firstNonEmpty(in.ReportID, fmt.Sprintf("RPT-%d", now.UnixNano())),
		Report_details:  in.Details,
		Submittion_date: firstNonNilTime(in.SubmittedAt, &now).UTC(),
		Status:          "รอดำเนินการ",
		StudentID:       in.StudentID,
		Reviewer_id:     in.ReviewerID,
		ReportType_id:   in.ReportTypeID,
		Created_at:      now,
		Updated_at:      now,
	}

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&rep).Error; err != nil {
			return err
		}
		if in.Attachment != nil {
			in.Attachment.Report_id = rep.Report_id
			if in.Attachment.Attachment_id == "" {
				in.Attachment.Attachment_id = fmt.Sprintf("ATT-%d", time.Now().UnixNano())
			}
			if err := tx.Create(in.Attachment).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	// preload กลับให้ครบ
	if err := preloadReport(db).Where("report_id = ?", rep.Report_id).First(&rep).Error; err != nil {
		return nil, err
	}
	return &rep, nil
}

/* =========================
   Helpers
   ========================= */

func firstNonEmpty(v string, fallback string) string {
	if v != "" {
		return v
	}
	return fallback
}
func firstNonNilTime(v *time.Time, fallback *time.Time) time.Time {
	if v != nil {
		return *v
	}
	return *fallback
}
