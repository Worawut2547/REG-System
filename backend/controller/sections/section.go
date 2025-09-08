package sections

import (
    "errors"
    "fmt"
    "net/http"
    "regexp"
    "strconv"
    "reg_system/config"
    "reg_system/entity"

    "github.com/gin-gonic/gin"
    "gorm.io/gorm"
)

// GetSectionAll returns all sections with related subject preloaded
func GetSectionAll(c *gin.Context) {
    var secs []entity.Section
    db := config.DB()

    if err := db.Preload("Subject").Find(&secs).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, secs)
}

// GetSectionByID returns a section by its SectionID (string key)
func GetSectionByID(c *gin.Context) {
    sid := c.Param("sectionId")
    if sid == "" { // fallback to :id if used
        sid = c.Param("id")
    }

    var sec entity.Section
    db := config.DB()

    if err := db.Preload("Subject").Where("section_id = ?", sid).First(&sec).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": "section not found"})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, sec)
}

// GetSectionsBySubject lists sections under a given subject
func GetSectionsBySubject(c *gin.Context) {
    subjectID := c.Param("subjectId")
    if subjectID == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "subjectId is required"})
        return
    }

    var secs []entity.Section
    db := config.DB()
    if err := db.Where("subject_id = ?", subjectID).Find(&secs).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, secs)
}

// CreateSection creates a new section
func CreateSection(c *gin.Context) {
    sec := new(entity.Section)
    if err := c.ShouldBind(&sec); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    db := config.DB()
    // Enforce unique group per subject
    if sec.SubjectID != "" && sec.Group != 0 {
        var cnt int64
        if err := db.Model(&entity.Section{}).
            Where("subject_id = ? AND `group` = ?", sec.SubjectID, sec.Group).
            Count(&cnt).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            return
        }
        if cnt > 0 {
            c.JSON(http.StatusBadRequest, gin.H{"error": "group already exists for this subject"})
            return
        }
    }
    // Autogenerate SectionID if empty -> SECNNN
    if sec.SectionID == "" {
        next, genErr := nextSectionID(db)
        if genErr != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": genErr.Error()})
            return
        }
        sec.SectionID = next
    }

    if err := db.Create(&sec).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, sec)
}

// nextSectionID generates the next running id like SEC001, SEC002 ...
func nextSectionID(db *gorm.DB) (string, error) {
    // Try to find the max numeric suffix from existing section_ids
    var all []entity.Section
    if err := db.Select("section_id").Find(&all).Error; err != nil {
        return "", err
    }
    re := regexp.MustCompile(`(?i)^SEC(\d+)$`)
    maxN := 0
    for _, s := range all {
        m := re.FindStringSubmatch(s.SectionID)
        if len(m) == 2 {
            if n, err := strconv.Atoi(m[1]); err == nil && n > maxN {
                maxN = n
            }
        }
    }
    return fmt.Sprintf("SEC%03d", maxN+1), nil
}

// UpdateSection updates a section by SectionID (string key)
func UpdateSection(c *gin.Context) {
    sid := c.Param("sectionId")
    if sid == "" { // fallback to :id
        sid = c.Param("id")
    }
    db := config.DB()

    // load existing to ensure it exists
    var existing entity.Section
    if err := db.Where("section_id = ?", sid).First(&existing).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": "section not found"})
            return
        }
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // bind incoming updates
    var payload entity.Section
    if err := c.ShouldBind(&payload); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // prevent SectionID change through payload
    payload.SectionID = existing.SectionID

    if err := db.Model(&existing).Updates(&payload).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // return latest
    if err := db.Preload("Subject").Where("section_id = ?", sid).First(&existing).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, existing)
}

// DeleteSection deletes a section by SectionID
func DeleteSection(c *gin.Context) {
    sid := c.Param("sectionId")
    if sid == "" { // fallback to :id
        sid = c.Param("id")
    }
    db := config.DB()

    res := db.Where("section_id = ?", sid).Delete(&entity.Section{})
    if res.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
        return
    }
    if res.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "section not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Delete section success"})
}
