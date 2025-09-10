package reports

import (
    "net/http"
    "path/filepath"
    "regexp"
    "fmt"
    "strconv"
    "strings"
    "time"
    "os"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"

    "reg_system/config"
    "reg_system/entity"
)

// ---------- Helpers ----------
func preloadReport(q *gorm.DB) *gorm.DB {
    return q.Preload("ReportType").Preload("Reviewer.User").Preload("Attachments")
}
// บางสภาพแวดล้อมอาจยังไม่มีคอลัมน์ created_at จากฐานข้อมูลเก่า
// เพื่อลดความเสี่ยง 500 ในการ Order ให้เรียงตาม submittion_date อย่างเดียว
func orderReport(q *gorm.DB) *gorm.DB { return q.Order("submittion_date DESC") }

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

    // Reject multiple files in create endpoint
    if form, err := c.MultipartForm(); err == nil && form != nil {
        if files := form.File["file"]; len(files) > 1 {
            c.JSON(http.StatusBadRequest, gin.H{"error": "only one file allowed"})
            return
        }
    }

    var att *entity.Attachment
    if file, err := c.FormFile("file"); err == nil && file != nil {
        // Save upload under uploads/ folder
        // Note: ensure the folder exists in deployment
        _ = os.MkdirAll("uploads", 0o755)
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
    // Generate sequential Report_id: REP001, REP002, ...
    nextID := func(tx *gorm.DB) (string, error) {
        // Find last id that starts with REP
        var last string
        // Order by length then lexicographically to keep REP1000 after REP0999
        if err := tx.Raw("SELECT report_id FROM reports WHERE report_id LIKE 'REP%' ORDER BY LENGTH(report_id) DESC, report_id DESC LIMIT 1").Scan(&last).Error; err != nil {
            return "", err
        }
        re := regexp.MustCompile(`(?i)^REP(\d+)$`)
        if m := re.FindStringSubmatch(strings.TrimSpace(last)); m != nil {
            n, _ := strconv.Atoi(m[1])
            n++
            if n < 1000 {
                return "REP" + fmt.Sprintf("%03d", n), nil
            }
            return "REP" + strconv.Itoa(n), nil
        }
        // default start
        return "REP001", nil
    }

    db := config.DB()
    var rep entity.Report
    if err := db.Transaction(func(tx *gorm.DB) error {
        nid, err := nextID(tx)
        if err != nil { return err }
        rep = entity.Report{
            Report_id:       nid,
            Report_details:  details,
            Submittion_date: now,
            Status:          "รอดำเนินการ",
            StudentID:       studentID,
            Reviewer_id:     reviewerID,
            ReportType_id:   reportTypeID,
            Created_at:      now,
            Updated_at:      now,
        }
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

// POST /reports/:id/attachments
// form field: file (single)
func AddReportAttachment(c *gin.Context) {
    reportID := strings.TrimSpace(c.Param("id"))
    if reportID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "report id is required"})
        return
    }
    // Reject multiple files for single-attach endpoint
    if form, err := c.MultipartForm(); err == nil && form != nil {
        if files := form.File["file"]; len(files) > 1 {
            c.JSON(http.StatusBadRequest, gin.H{"error": "only one file allowed"})
            return
        }
    }
    file, err := c.FormFile("file")
    if err != nil || file == nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
        return
    }

    // save file under uploads/
    _ = os.MkdirAll("uploads", 0o755)
    filename := time.Now().Format("20060102_150405.000000000") + "_" + filepath.Base(file.Filename)
    savePath := filepath.Join("uploads", filename)
    if err := c.SaveUploadedFile(file, savePath); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed: " + err.Error()})
        return
    }

    att := entity.Attachment{
        Attachment_id: "ATT-" + time.Now().Format("150405000000000"),
        File_Name:     file.Filename,
        File_Path:     "/" + savePath,
        Uploaded_date: time.Now(),
        Report_id:     reportID,
    }
    db := config.DB()
    if err := db.Create(&att).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, att)
}

// DELETE /reports/:id/attachments/:attId
func DeleteReportAttachment(c *gin.Context) {
    reportID := strings.TrimSpace(c.Param("id"))
    attID := strings.TrimSpace(c.Param("attId"))
    if reportID == "" || attID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "id and attId are required"})
        return
    }
    db := config.DB()
    if err := db.Where("report_id = ? AND attachment_id = ?", reportID, attID).Delete(&entity.Attachment{}).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GET /reports
func GetReports(c *gin.Context) {
    db := config.DB()
    role := strings.ToLower(strings.TrimSpace(c.Query("role")))
    var items []entity.Report
    q := preloadReport(orderReport(db))
    if role == "admin" || role == "teacher" {
        q = q.Joins("JOIN reviewers r ON r.reviewer_id = reports.reviewer_id").
            Joins("JOIN users u ON u.id = r.user_id").
            Where("LOWER(u.role) = ?", role)
    }
    if err := q.Find(&items).Error; err != nil {
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

// ---------- Comments ----------

// GET /reports/:id/comments
func GetReportComments(c *gin.Context) {
    id := c.Param("id")
    db := config.DB()
    var items []entity.ReviewerComment
    if err := db.Preload("Reviewer.User").
        Where("report_id = ?", id).
        Order("comment_date ASC").
        Find(&items).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, items)
}

// POST /reports/:id/comments { reviewer_id?: string, comment?: string }
func CreateReportComment(c *gin.Context) {
    id := strings.TrimSpace(c.Param("id"))
    type payload struct {
        ReviewerID string `json:"reviewer_id"`
        Comment    string `json:"comment"`
        CommentText string `json:"CommentText"`
    }
    var body payload
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
        return
    }
    text := strings.TrimSpace(firstNonEmpty(body.Comment, body.CommentText))
    if text == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "comment is required"})
        return
    }
    db := config.DB()
    // fallback reviewer id to report's reviewer if not provided
    rid := strings.TrimSpace(body.ReviewerID)
    if rid == "" {
        var rep entity.Report
        if err := db.Select("reviewer_id").Where("report_id = ?", id).First(&rep).Error; err == nil {
            rid = strings.TrimSpace(rep.Reviewer_id)
        }
    }
    item := entity.ReviewerComment{
        Comment_id:  "COM-" + time.Now().Format("150405000000000"),
        CommentText: text,
        CommentDate: time.Now(),
        Reviewer_id: rid,
        Report_id:   id,
    }
    if err := db.Create(&item).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    // return with reviewer preloaded for display
    _ = db.Preload("Reviewer.User").First(&item, "comment_id = ?", item.Comment_id).Error
    c.JSON(http.StatusCreated, item)
}

func firstNonEmpty(ss ...string) string {
    for _, s := range ss { if strings.TrimSpace(s) != "" { return s } }
    return ""
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
        Where("student_id = ?", sid).
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
