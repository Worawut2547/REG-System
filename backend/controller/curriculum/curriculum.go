// ======================================================================
// curriculum/controller.go (refactored)
// - ใช้ตารางกลาง curriculum_books (ID, book_path, curriculum_id)
// - ตัดความสัมพันธ์ BookID ออกจาก DTO/Response
// - response เป็น snake_case และแนบรายการหนังสือตาม curriculum_id
// ======================================================================

package curriculum

import (
	"errors"
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// =============================================================
// 1) Request DTOs
// =============================================================

type CurriculumCreateReq struct {
	CurriculumID   string `json:"curriculum_id"   binding:"required"`
	CurriculumName string `json:"curriculum_name" binding:"required"`
	TotalCredit    int    `json:"total_credit"    binding:"required"`
	StartYear      int    `json:"start_year"      binding:"required"`
	FacultyID      string `json:"faculty_id"      binding:"required"`
	MajorID        string `json:"major_id"        binding:"omitempty"`
	Description    string `json:"description"     binding:"omitempty"`
}

type CurriculumUpdateReq struct {
	CurriculumName *string `json:"curriculum_name,omitempty"`
	TotalCredit    *int    `json:"total_credit,omitempty"`
	StartYear      *int    `json:"start_year,omitempty"`
	FacultyID      *string `json:"faculty_id,omitempty"`
	MajorID        *string `json:"major_id,omitempty"`
	Description    *string `json:"description,omitempty"`
}

// =============================================================
// 2) Helpers
// =============================================================

// ตรวจว่า major_id ↔ faculty_id ถูกต้อง
func validateMajorFaculty(db *gorm.DB, majorID, facultyID string) error {
	if majorID != "" {
		var major entity.Majors
		if err := db.First(&major, "major_id = ?", majorID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) { return errors.New("invalid major_id") }
			return err
		}
		if major.FacultyID != "" && major.FacultyID != facultyID {
			return errors.New("major_id does not belong to faculty_id")
		}
	}
	if facultyID != "" {
		var fac entity.Faculty
		if err := db.First(&fac, "faculty_id = ?", facultyID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) { return errors.New("invalid faculty_id") }
			return err
		}
	}
	return nil
}

// ดึงรายการไฟล์ของหลักสูตรจากตารางกลาง
type bookResp struct {
	ID       int    `json:"id"`
	BookPath string `json:"book_path"`
}

func listBooksFor(db *gorm.DB, curriculumID string) ([]bookResp, error) {
	var rows []entity.CurriculumBook
	if err := db.Where("curriculum_id = ?", curriculumID).Order("id desc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]bookResp, 0, len(rows))
	for _, r := range rows {
		out = append(out, bookResp{ID: r.ID, BookPath: r.BookPath})
	}
	return out, nil
}

// แปลง entity.Curriculum → response (แนบ books)
func curriculumToResp(db *gorm.DB, cur entity.Curriculum) gin.H {
	books, _ := listBooksFor(db, cur.CurriculumID)
	out := gin.H{
		"curriculum_id":   cur.CurriculumID,
		"curriculum_name": cur.CurriculumName,
		"total_credit":    cur.TotalCredit,
		"start_year":      cur.StartYear,
		"faculty_id":      cur.FacultyID,
		"major_id":        cur.MajorID,
		"description":     cur.Description,
		"books":           books, // [{id, book_path}, ...]
	}
	if cur.Faculty != nil { out["faculty_name"] = cur.Faculty.FacultyName }
	if cur.Major != nil { out["major_name"] = cur.Major.MajorName }
	return out
}

// =============================================================
// 3) Handlers
// =============================================================

// POST /curriculums
func CreateCurriculum(c *gin.Context) {
	var req CurriculumCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB()

	if err := validateMajorFaculty(db, req.MajorID, req.FacultyID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	cur := entity.Curriculum{
		CurriculumID:   req.CurriculumID,
		CurriculumName: req.CurriculumName,
		TotalCredit:    req.TotalCredit,
		StartYear:      req.StartYear,
		FacultyID:      req.FacultyID,
		MajorID:        req.MajorID,
		Description:    req.Description,
	}
	if err := db.Create(&cur).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = db.Preload("Faculty").Preload("Major").First(&cur, "curriculum_id = ?", cur.CurriculumID).Error
	c.JSON(http.StatusOK, gin.H{"message": "create curriculum success", "data": curriculumToResp(db, cur)})
}

// GET /curriculums/:curriculumId
func GetCurriculumByID(c *gin.Context) {
	id := c.Param("curriculumId")
	db := config.DB()

	var cur entity.Curriculum
	if err := db.Preload("Faculty").Preload("Major").First(&cur, "curriculum_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, curriculumToResp(db, cur))
}

// GET /curriculums
func GetCurriculumAll(c *gin.Context) {
	db := config.DB()
	var curs []entity.Curriculum
	if err := db.Preload("Faculty").Preload("Major").Find(&curs).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	out := make([]gin.H, 0, len(curs))
	for i, cur := range curs {
		row := curriculumToResp(db, cur)
		row["index"] = i + 1
		out = append(out, row)
	}
	c.JSON(http.StatusOK, out)
}

// PUT /curriculums/:curriculumId (Partial update)
func UpdateCurriculum(c *gin.Context) {
	id := c.Param("curriculumId")
	db := config.DB()

	var req CurriculumUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var cur entity.Curriculum
	if err := db.First(&cur, "curriculum_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newFacultyID := cur.FacultyID
	newMajorID := cur.MajorID
	if req.FacultyID != nil { newFacultyID = *req.FacultyID }
	if req.MajorID != nil { newMajorID = *req.MajorID }
	if req.FacultyID != nil || req.MajorID != nil {
		if err := validateMajorFaculty(db, newMajorID, newFacultyID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	if req.CurriculumName != nil { cur.CurriculumName = *req.CurriculumName }
	if req.TotalCredit != nil { cur.TotalCredit = *req.TotalCredit }
	if req.StartYear != nil { cur.StartYear = *req.StartYear }
	if req.FacultyID != nil { cur.FacultyID = *req.FacultyID }
	if req.MajorID != nil { cur.MajorID = *req.MajorID }
	if req.Description != nil { cur.Description = *req.Description }

	if err := db.Save(&cur).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = db.Preload("Faculty").Preload("Major").First(&cur, "curriculum_id = ?", cur.CurriculumID).Error
	c.JSON(http.StatusOK, curriculumToResp(db, cur))
}

// DELETE /curriculums/:curriculumId
func DeleteCurriculum(c *gin.Context) {
	id := c.Param("curriculumId")
	db := config.DB()
	if err := db.Delete(&entity.Curriculum{}, "curriculum_id = ?", id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "delete curriculum success"})
}
