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

// ---------- Helpers ----------
func preloadReport(q *gorm.DB) *gorm.DB {
    return q.Preload("ReportType").Preload("Reviewer.User").Preload("Attachments")
}
func orderReport(q *gorm.DB) *gorm.DB { return q.Order("submittion_date DESC").Order("created_at DESC") }

// ---------- Reports ----------

// POST /reports (multipart form)
// fields: student_id, report_type_id, reviewer_id, details, file(optional)
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
    if file, err := c.FormFile("file"); err == nil && file != nil {
        // Save upload under uploads/ folder
        // Note: ensure the folder exists in deployment
        filename := time.Now().Format("20060102_150405.000000000") + "_" + filepath.Base(file.Filename)
        savePath := filepath.Join("uploads", filename)
        if err := c.SaveUploadedFile(file, savePath); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed: " + err.Error()})
            return
        }
        att = &entity.Attachment{
            Attachment_id: "ATT-" + time.Now().Format("150405000000000"),
            File_Name:     file.Filename,
            File_Path:     "/" + savePath,
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
    if err := db.Transaction(func(tx *gorm.DB) error {
        if err := tx.Create(&rep).Error; err != nil { return err }
        if att != nil {
            att.Report_id = rep.Report_id
            if att.Attachment_id == "" {
                att.Attachment_id = "ATT-" + time.Now().Format("150405000000000")
            }
            if err := tx.Create(att).Error; err != nil { return err }
        }
        return nil
    }); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

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
        c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, it)
}

// PUT /reports/:id/status  { status }
func UpdateReportStatus(c *gin.Context) {
    id := c.Param("id")
    var body struct{ Status string `json:"status"` }
    if err := c.ShouldBindJSON(&body); err != nil || strings.TrimSpace(body.Status) == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
        return
    }
    db := config.DB()
    if err := db.Model(&entity.Report{}).
        Where("report_id = ?", id).
        Updates(map[string]any{"status": body.Status, "updated_at": time.Now()}).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"ok": true})
}

// DELETE /reports/:id
func DeleteReport(c *gin.Context) {
    id := c.Param("id")
    db := config.DB()
    _ = db.Where("report_id = ?", id).Delete(&entity.Attachment{}).Error
    if err := db.Where("report_id = ?", id).Delete(&entity.Report{}).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"ok": true})
}

// ---------- Masters / Dropdown ----------

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

// GET /reviewers (teacher/admin only)
func ListAssignableReviewers(c *gin.Context) {
    db := config.DB()
    type row struct{ ReviewerID, Username, Role string }
    var rows []row
    if err := db.Table("reviewers r").
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
    username := strings.TrimSpace(c.Param("username"))
    if username == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "username is required"})
        return
    }
    db := config.DB()
    type row struct{ ReviewerID string }
    var r row
    if err := db.Table("reviewers r").
        Select("r.reviewer_id").
        Joins("JOIN users u ON u.id = r.user_id").
        Where("LOWER(u.username) = LOWER(?)", username).
        Limit(1).Scan(&r).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if r.ReviewerID == "" {
        c.JSON(http.StatusNotFound, gin.H{"error": "reviewer not found"})
        return
    }
    c.JSON(http.StatusOK, gin.H{"reviewer_id": r.ReviewerID})
}

// ---------- Queries by owner ----------

// GET /reviewers/:rid/reports
func GetReportsByReviewer(c *gin.Context) {
    rid := c.Param("rid")
    db := config.DB()
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
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, items)
}

// ---------- Aliases (main.go uses these names) ----------
func GetReportAll(c *gin.Context)            { GetReports(c) }
func GetReportByID(c *gin.Context)           { GetReport(c) }
func UpdateStatus(c *gin.Context)            { UpdateReportStatus(c) }
func DeleteReportAlias(c *gin.Context)       { DeleteReport(c) }
func ListReviewers(c *gin.Context)           { ListAssignableReviewers(c) }
func GetReportsByStu(c *gin.Context)         { GetReportsByStudent(c) }
func GetReviewerByUsername(c *gin.Context)   { GetReviewerIDByUsername(c) }