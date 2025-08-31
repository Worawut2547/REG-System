package reports

import (
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"reg_system/config"
	"reg_system/entity"
)

/* ============================================================
   Helpers
   ============================================================ */

func preloadReport(q *gorm.DB) *gorm.DB {
    return q.Preload("ReportType").Preload("Reviewer.User").Preload("Attachments")
}

func orderReport(q *gorm.DB) *gorm.DB { return q.Order("submittion_date DESC").Order("created_at DESC") }

func getRoleByReviewerID(db *gorm.DB, reviewerID string) (string, error) {
	type row struct{ Role string }
	var r row
	err := db.
		Table("reviewers r").
		Select("u.role AS role").
		Joins("JOIN users u ON u.id = r.user_id").
		Where("r.reviewer_id = ?", reviewerID).
		Limit(1).
		Scan(&r).Error
	return r.Role, err
}

/* ============================================================
   Core handlers (ฟังก์ชันชื่อ “ใหม่/อ่านง่าย”)
   ============================================================ */

// POST /reports (multipart)  → fields: student_id, report_type_id, reviewer_id, details, file(optional)
func CreateReport(c *gin.Context) {
	studentID := strings.TrimSpace(c.PostForm("student_id"))
	reportTypeID := strings.TrimSpace(c.PostForm("report_type_id"))
	reviewerID := strings.TrimSpace(c.PostForm("reviewer_id"))
	details := c.PostForm("details")

	if studentID == "" || reportTypeID == "" || reviewerID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "student_id, report_type_id, reviewer_id are required"})
		return
	}

	var att *entity.Attachment
	// แนบไฟล์ถ้ามี
	if file, err := c.FormFile("file"); err == nil && file != nil {
		filename := time.Now().Format("20060102_150405.000000000") + "_" + filepath.Base(file.Filename)
		savePath := filepath.Join("uploads", filename)
		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed: " + err.Error()})
			return
		}
		att = &entity.Attachment{
			Attachment_id: "ATT-" + time.Now().Format("150405000000000"),
			File_Name:     file.Filename,
			File_Path:     "/" + savePath, // ให้ FE เปิดผ่าน /uploads/...
			Uploaded_date: time.Now(),
		}
	}

	now := time.Now()
	rep := entity.Report{
		Report_id:       "RPT-" + time.Now().Format("20060102150405.000000000"),
		Report_details:  details,
		Submittion_date: now,
		Status:          "รอดำเนินการ",
		StudentID:       studentID,
		Reviewer_id:     reviewerID,
		ReportType_id:   reportTypeID,
		Created_at:      now,
		Updated_at:      now,
	}

	db := config.DB()
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&rep).Error; err != nil {
			return err
		}
		if att != nil {
			att.Report_id = rep.Report_id
			if att.Attachment_id == "" {
				att.Attachment_id = "ATT-" + time.Now().Format("150405000000000")
			}
			if err := tx.Create(att).Error; err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// preload กลับ
	if err := preloadReport(db).Where("report_id = ?", rep.Report_id).First(&rep).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, rep)
}

// GET /reports
func GetReports(c *gin.Context) {
	db := config.DB()
	var items []entity.Report
	if err := preloadReport(orderReport(db)).Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GET /reports/:id
func GetReport(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()
	var it entity.Report
	if err := preloadReport(db).Where("report_id = ?", id).First(&it).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "report not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, it)
}

// PUT /reports/:id  (แก้ไข field ที่อนุญาต)
func UpdateReport(c *gin.Context) {
	id := c.Param("id")
	var payload struct {
		ReportType_id  *string `json:"report_type_id"`
		Reviewer_id    *string `json:"reviewer_id"`
		Report_details *string `json:"report_details"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json body"})
		return
	}
	patch := map[string]interface{}{"updated_at": time.Now()}
	if payload.ReportType_id != nil {
		patch["report_type_id"] = strings.TrimSpace(*payload.ReportType_id)
	}
	if payload.Reviewer_id != nil {
		patch["reviewer_id"] = strings.TrimSpace(*payload.Reviewer_id)
	}
	if payload.Report_details != nil {
		patch["report_details"] = *payload.Report_details
	}
	db := config.DB()
	if err := db.Model(&entity.Report{}).Where("report_id = ?", id).Updates(patch).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	var it entity.Report
	if err := preloadReport(db).Where("report_id = ?", id).First(&it).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, it)
}

// PUT /reports/:id/status  ({ "status": "อนุมัติ" | "ไม่อนุมัติ" | "รอดำเนินการ" })
func UpdateReportStatus(c *gin.Context) {
	id := c.Param("id")
	var body struct{ Status string `json:"status"` }
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json body"})
		return
	}
	if strings.TrimSpace(body.Status) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
		return
	}
	db := config.DB()
	if err := db.Model(&entity.Report{}).
		Where("report_id = ?", id).
		Updates(map[string]interface{}{"status": body.Status, "updated_at": time.Now()}).
		Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DELETE /reports/:id
func DeleteReport(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()
	// ลบแนบไฟล์ก่อน (ถ้ามี)
	_ = db.Where("report_id = ?", id).Delete(&entity.Attachment{}).Error
	if err := db.Where("report_id = ?", id).Delete(&entity.Report{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /report-types
func ListReportTypes(c *gin.Context) {
	db := config.DB()
	var items []entity.ReportType
	if err := db.Order("report_type_id ASC").Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

// GET /reviewers (dropdown)
func ListAssignableReviewers(c *gin.Context) {
    db := config.DB()
    type row struct {
        ReviewerID string
        Username   string
        Role       string
    }
    var rows []row
    if err := db.
        Table("reviewers r").
        Select("r.reviewer_id, u.username, u.role").
        Joins("JOIN users u ON u.id = r.user_id").
        Where("u.role IN ('teacher','admin')").
        Order("u.role DESC, r.reviewer_id ASC").
        Scan(&rows).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    type option struct{ Value, Label string }
    out := make([]option, 0, len(rows))
    for _, r := range rows {
        lbl := r.Username
        if r.Role != "" { lbl = r.Username + " (" + r.Role + ")" }
        out = append(out, option{Value: r.ReviewerID, Label: lbl})
    }
    c.JSON(http.StatusOK, out)
}

// GET /reviewers/by-username/:username → { reviewer_id }
func GetReviewerIDByUsername(c *gin.Context) {
	username := c.Param("username")
	if strings.TrimSpace(username) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username is required"})
		return
	}
	db := config.DB()
	type row struct{ ReviewerID string }
	var r row
	if err := db.
		Table("reviewers r").
		Select("r.reviewer_id").
		Joins("JOIN users u ON u.id = r.user_id").
		Where("LOWER(u.username) = LOWER(?)", username).
		Limit(1).
		Scan(&r).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if r.ReviewerID == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "reviewer not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reviewer_id": r.ReviewerID})
}

// GET /reviewers/:rid/reports[?only=admin]
func GetReportsByReviewer(c *gin.Context) {
    rid := c.Param("rid")
    only := c.Query("only")
    db := config.DB()

    if only == "admin" {
        // 1) ตรวจ role ของ reviewer
        role, err := getRoleByReviewerID(db, rid)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        if role != "admin" {
            // ไม่ใช่เจ้าหน้าที่ → ไม่คืน (ป้องกันปนของครู)
            c.JSON(http.StatusOK, []entity.Report{})
            return
        }
        // 2) คืนเฉพาะที่ส่งให้ reviewer (admin) คนนี้
        var items []entity.Report
        if err := preloadReport(orderReport(db)).
            Where("reviewer_id = ?", rid).
            Find(&items).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        c.JSON(http.StatusOK, items)
        return
    }

    // กรณีครู/อาจารย์ (ไม่ใส่ only=admin)
    var items []entity.Report
    if err := preloadReport(orderReport(db)).
        Where("reviewer_id = ?", rid).
        Find(&items).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, items)
}

// GET /students/reports/:sid
func GetReportsByStudent(c *gin.Context) {
  sid := c.Param("sid")
  db := config.DB()
  var items []entity.Report
  if err := preloadReport(orderReport(db)).
      Where("student_id = ? OR studentid = ?", sid, sid).
      Find(&items).Error; err != nil {
    c.JSON(500, gin.H{"error": err.Error()})
    return
  }
  c.JSON(200, items)
}

/* ============================================================
   Alias functions (ให้ชื่อ “ตรงกับที่ main.go เรียก”)
   ============================================================ */

// กลุ่ม /reports
func GetReportAll(c *gin.Context)            { GetReports(c) }
func GetReportByID(c *gin.Context)           { GetReport(c) }
func UpdateStatus(c *gin.Context)            { UpdateReportStatus(c) }
// ถ้าโปรเจกต์คุณยังไม่ใช้ UpdateReport/DeleteReport ก็ยังคงอยู่ (ทำงานจริงแล้วด้านบน)
func DeleteReportAlias(c *gin.Context)       { DeleteReport(c) } // กันบางโปรเจกต์เรียกชื่อไม่ตรง
// ถ้า main.go เรียกชื่อ DeleteReport / UpdateReport ตรง ๆ ก็ใช้อันนี้ได้เลย
// (เราได้ประกาศข้างบนชื่อเดียวกันอยู่แล้ว)

// dropdown / master
func ListReviewers(c *gin.Context)         { ListAssignableReviewers(c) }
func GetReportsByStu(c *gin.Context)       { GetReportsByStudent(c) }
func GetReviewerByUsername(c *gin.Context) { GetReviewerIDByUsername(c) }
