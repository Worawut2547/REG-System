package reporttypes

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"

    "reg_system/config"
    "reg_system/entity"
)

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

// GET /report-types/:id
func GetReportTypeByID(c *gin.Context) {
    id := strings.TrimSpace(c.Param("id"))
    if id == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
        return
    }
    db := config.DB()
    var it entity.ReportType
    if err := db.Where("report_type_id = ?", id).First(&it).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, it)
}

type reportTypePayload struct {
    ReportType_id         string `json:"ReportType_id"`
    ReportType_Name       string `json:"ReportType_Name"`
    ReportTypeDescription string `json:"ReportTypeDescription"`
}

// POST /report-types
func CreateReportType(c *gin.Context) {
    var body reportTypePayload
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
        return
    }
    id := strings.TrimSpace(body.ReportType_id)
    name := strings.TrimSpace(body.ReportType_Name)
    desc := strings.TrimSpace(body.ReportTypeDescription)
    if id == "" || name == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ReportType_id and ReportType_Name are required"})
        return
    }
    db := config.DB()
    var cnt int64
    if err := db.Model(&entity.ReportType{}).Where("report_type_id = ?", id).Count(&cnt).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    if cnt > 0 {
        c.JSON(http.StatusConflict, gin.H{"error": "report type already exists"})
        return
    }
    rt := entity.ReportType{ReportType_id: id, ReportType_Name: name, Description: desc}
    if err := db.Create(&rt).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusCreated, rt)
}

// PUT /report-types/:id
func UpdateReportType(c *gin.Context) {
    id := strings.TrimSpace(c.Param("id"))
    if id == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
        return
    }
    var body reportTypePayload
    if err := c.ShouldBindJSON(&body); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
        return
    }
    updates := map[string]any{}
    if strings.TrimSpace(body.ReportType_Name) != "" {
        updates["report_type_name"] = strings.TrimSpace(body.ReportType_Name)
    }
    // Description column in entity is named Description with json:"ReportTypeDescription"
    updates["description"] = strings.TrimSpace(body.ReportTypeDescription)

    db := config.DB()
    if err := db.Model(&entity.ReportType{}).Where("report_type_id = ?", id).Updates(updates).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    var out entity.ReportType
    _ = db.Where("report_type_id = ?", id).First(&out).Error
    c.JSON(http.StatusOK, out)
}

// DELETE /report-types/:id
func DeleteReportType(c *gin.Context) {
    id := strings.TrimSpace(c.Param("id"))
    if id == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
        return
    }
    db := config.DB()
    if err := db.Transaction(func(tx *gorm.DB) error {
        // หา report ทั้งหมดของประเภทนี้
        var reports []entity.Report
        if err := tx.Where("report_type_id = ?", id).Find(&reports).Error; err != nil { return err }
        if len(reports) > 0 {
            // ลบ attachments ของรายงานเหล่านี้ก่อน
            ids := make([]string, 0, len(reports))
            for _, r := range reports { ids = append(ids, r.Report_id) }
            if err := tx.Where("report_id IN ?", ids).Delete(&entity.Attachment{}).Error; err != nil { return err }
            // ลบตัวรายงาน
            if err := tx.Where("report_type_id = ?", id).Delete(&entity.Report{}).Error; err != nil { return err }
        }
        // ลบตัวประเภทคำร้อง
        if err := tx.Where("report_type_id = ?", id).Delete(&entity.ReportType{}).Error; err != nil { return err }
        return nil
    }); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, gin.H{"ok": true})
}
