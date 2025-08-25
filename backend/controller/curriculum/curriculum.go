// ======================================================================
// curriculum/controller.go
// เส้นทางและ handler สำหรับจัดการ "หลักสูตร" (Curriculums)
// - DTO ใช้ string IDs (ตาม subjects/controller.go)
// - แปลง book_id (string จาก FE) -> int ก่อนบันทึก (เพราะ BookPath.ID เป็น int)
// - ตอบกลับเป็น snake_case
// - ตรวจสอบความสอดคล้อง Major ↔ Faculty (ถ้า Major ผูก Faculty อยู่แล้ว)
// - ตรวจสอบว่า book_id มีอยู่จริงในตาราง book_paths
// ======================================================================

package curriculum

import (
	"errors"
	"net/http"
	"reg_system/config"
	"reg_system/entity"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ======================================================================
// Section 1: Request DTOs (รับข้อมูลจากฝั่ง Frontend)
// ======================================================================

// เปลี่ยนเป็น omitempty ถ้าต้องการให้ระบบ gen id เอง
type CurriculumCreateReq struct {
	CurriculumID   string `json:"curriculum_id"   binding:"required"`
	CurriculumName string `json:"curriculum_name" binding:"required"`
	TotalCredit    int    `json:"total_credit"    binding:"required"`
	StartYear      int    `json:"start_year"      binding:"required"`
	FacultyID      string `json:"faculty_id"      binding:"required"`
	MajorID        string `json:"major_id"        binding:"omitempty"`
	BookID         string `json:"book_id"         binding:"omitempty"` // FE ส่ง string
	Description    string `json:"description"     binding:"omitempty"`
}

type CurriculumUpdateReq struct {
	CurriculumName *string `json:"curriculum_name,omitempty"`
	TotalCredit    *int    `json:"total_credit,omitempty"`
	StartYear      *int    `json:"start_year,omitempty"`
	FacultyID      *string `json:"faculty_id,omitempty"`
	MajorID        *string `json:"major_id,omitempty"`
	BookID         *string `json:"book_id,omitempty"` // FE ส่ง string
	Description    *string `json:"description,omitempty"`
}

// ======================================================================
// Section 2: Helpers
// ======================================================================

// ตรวจว่า major_id และ faculty_id มีอยู่จริง
// และถ้า Major ผูก Faculty อยู่แล้ว ต้องตรงกับ faculty_id ที่รับมา
func validateMajorFaculty(db *gorm.DB, majorID, facultyID string) error {
	if majorID != "" {
		var major entity.Majors
		if err := db.First(&major, "major_id = ?", majorID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("invalid major_id")
			}
			return err
		}
		if major.FacultyID != "" && major.FacultyID != facultyID {
			return errors.New("major_id does not belong to faculty_id")
		}
	}
	if facultyID != "" {
		var fac entity.Faculty
		if err := db.First(&fac, "faculty_id = ?", facultyID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("invalid faculty_id")
			}
			return err
		}
	}
	return nil
}

// ตรวจว่า book_id (int) มีจริงในตาราง book_paths
func validateBookID(db *gorm.DB, bookID int) error {
	if bookID == 0 {
		return nil // อนุญาตให้ว่าง/0 = ไม่ผูกหนังสือ
	}
	var bp entity.BookPath
	if err := db.First(&bp, "id = ?", bookID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid book_id")
		}
		return err
	}
	return nil
}

// แปลง string → *int ("" = nil)
func parseOptInt(s string) (*int, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil, nil
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return nil, errors.New("book_id must be a number")
	}
	return &v, nil
}

func curriculumToResp(cur entity.Curriculum) gin.H {
	out := gin.H{
		"curriculum_id":   cur.CurriculumID,
		"curriculum_name": cur.CurriculumName,
		"total_credit":    cur.TotalCredit,
		"start_year":      cur.StartYear,
		"faculty_id":      cur.FacultyID,
		"major_id":        cur.MajorID,
		"book_id":         cur.BookID, // number (int) ตาม entity
		"description":     cur.Description,
	}
	if cur.Faculty != nil {
		out["faculty_name"] = cur.Faculty.FacultyName
	}
	if cur.Major != nil {
		out["major_name"] = cur.Major.MajorName
	}
	if cur.Book != nil {
		out["book_path"] = cur.Book.Path
	}
	return out
}

// ======================================================================
// Section 3: Handlers
// ======================================================================

// POST /curriculums
func CreateCurriculum(c *gin.Context) {
	var req CurriculumCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// ตรวจความสอดคล้อง Major ↔ Faculty
	if err := validateMajorFaculty(db, req.MajorID, req.FacultyID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// แปลงและตรวจ book_id (ถ้าส่งมา)
	var bookID int
	if bptr, err := parseOptInt(req.BookID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	} else if bptr != nil {
		bookID = *bptr
		if err := validateBookID(db, bookID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	cur := entity.Curriculum{
		CurriculumID:   req.CurriculumID,
		CurriculumName: req.CurriculumName,
		TotalCredit:    req.TotalCredit,
		StartYear:      req.StartYear,
		FacultyID:      req.FacultyID,
		MajorID:        req.MajorID,
		BookID:         bookID, // ถ้า entity เป็น uint ให้ใช้ uint(bookID)
		Description:    req.Description,
	}

	if err := db.Create(&cur).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = db.Preload("Faculty").Preload("Major").Preload("Book").
		First(&cur, "curriculum_id = ?", cur.CurriculumID).Error

	c.JSON(http.StatusOK, gin.H{
		"message": "create curriculum success",
		"data":    curriculumToResp(cur),
	})
}

// GET /curriculums/:curriculumId
func GetCurriculumByID(c *gin.Context) {
	id := c.Param("curriculumId")
	db := config.DB()

	var cur entity.Curriculum
	if err := db.Preload("Faculty").Preload("Major").Preload("Book").
		First(&cur, "curriculum_id = ?", id).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, curriculumToResp(cur))
}

// GET /curriculums
func GetCurriculumAll(c *gin.Context) {
	db := config.DB()

	var curs []entity.Curriculum
	if err := db.Preload("Faculty").Preload("Major").Preload("Book").
		Find(&curs).Error; err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	out := make([]map[string]interface{}, 0, len(curs))
	for i, cur := range curs {
		row := curriculumToResp(cur)
		row["index"] = i + 1 // ใช้โชว์ลำดับในตาราง (จะลบก็ได้)
		out = append(out, row)
	}
	c.JSON(http.StatusOK, out)
}

// PUT /curriculums/:curriculumId
// รองรับ partial update (PATCH-style)
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

	// เตรียมค่าใหม่เพื่อเช็คความสอดคล้อง (ถ้ามีการแก้ faculty/major)
	newFacultyID := cur.FacultyID
	newMajorID := cur.MajorID
	if req.FacultyID != nil {
		newFacultyID = *req.FacultyID
	}
	if req.MajorID != nil {
		newMajorID = *req.MajorID
	}
	if req.FacultyID != nil || req.MajorID != nil {
		if err := validateMajorFaculty(db, newMajorID, newFacultyID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// อัปเดตเฉพาะฟิลด์ที่ส่งมา
	if req.CurriculumName != nil {
		cur.CurriculumName = *req.CurriculumName
	}
	if req.TotalCredit != nil {
		cur.TotalCredit = *req.TotalCredit
	}
	if req.StartYear != nil {
		cur.StartYear = *req.StartYear
	}
	if req.FacultyID != nil {
		cur.FacultyID = *req.FacultyID
	}
	if req.MajorID != nil {
		cur.MajorID = *req.MajorID
	}
	if req.Description != nil {
		cur.Description = *req.Description
	}
	if req.BookID != nil {
		s := strings.TrimSpace(*req.BookID)
		if s != "" {
			v, err := strconv.Atoi(s)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "book_id must be a number"})
				return
			}
			// ตรวจว่ามีจริง
			if err := validateBookID(db, v); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			cur.BookID = v // ถ้า entity เป็น uint ให้ใช้: cur.BookID = uint(v)
		} else {
			// ถ้าต้องการรองรับ "ล้างค่า" book_id เมื่อส่ง "" ให้ตัดสินใจ:
			// 1) ตั้งเป็น 0 (unassigned)
			// cur.BookID = 0
			// หรือ 2) ปล่อยผ่านไม่เปลี่ยนแปลง (คงค่าดิม)
			// ตอนนี้เลือก "ปล่อยผ่าน" เพื่อความปลอดภัยของข้อมูลเดิม
		}
	}

	if err := db.Save(&cur).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = db.Preload("Faculty").Preload("Major").Preload("Book").
		First(&cur, "curriculum_id = ?", cur.CurriculumID).Error

	c.JSON(http.StatusOK, curriculumToResp(cur))
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
