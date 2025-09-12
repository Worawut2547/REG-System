// === Package ===
package curriculum

// === Imports ===
import (
	"errors"
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// === Types / Request DTOs ===
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

type bookResp struct {
	ID       int    `json:"id"`
	BookPath string `json:"book_path"`
}

// === Helpers / Validation & Mapping ===
// ตรวจ Major/Faculty ให้เข้าคู่กัน
func validateMajorFaculty(db *gorm.DB, majorID, facultyID string) error {
	if majorID != "" {
		// หา major ก่อน เผื่อส่งมาผิด
		var major entity.Majors
		if err := db.First(&major, "major_id = ?", majorID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("invalid major_id")
			}
			return err
		}
		// major ต้องอยู่คณะเดียวกันกับ faculty ที่อ้างมา
		if major.FacultyID != "" && major.FacultyID != facultyID {
			return errors.New("major_id does not belong to faculty_id")
		}
	}
	if facultyID != "" {
		// เช็กว่ามี faculty นี้จริง
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

// ดึงไฟล์เอกสารของหลักสูตรนี้
func listBooksFor(db *gorm.DB, curriculumID string) ([]bookResp, error) {
	var rows []entity.CurriculumBook
	if err := db.Where("curriculum_id = ?", curriculumID).Order("id desc").Find(&rows).Error; err != nil {
		return nil, err
	}
	// แปลงเป็นโครงตอบกลับสั้น ๆ
	out := make([]bookResp, 0, len(rows))
	for _, r := range rows {
		out = append(out, bookResp{ID: r.ID, BookPath: r.BookPath})
	}
	return out, nil
}

// แปลง entity → payload สำหรับตอบกลับ
func curriculumToResp(db *gorm.DB, cur entity.Curriculum) gin.H {
	// รวมหนังสือแนบไว้ด้วย เผื่อหน้าแสดงผล
	books, _ := listBooksFor(db, cur.CurriculumID)
	out := gin.H{
		"curriculum_id":   cur.CurriculumID,
		"curriculum_name": cur.CurriculumName,
		"total_credit":    cur.TotalCredit,
		"start_year":      cur.StartYear,
		"faculty_id":      cur.FacultyID,
		"major_id":        cur.MajorID,
		"description":     cur.Description,
		"books":           books,
	}
	// ถ้ามี preload ชื่อคณะ/สาขา ติดไปให้ครบ
	if cur.Faculty != nil {
		out["faculty_name"] = cur.Faculty.FacultyName
	}
	if cur.Major != nil {
		out["major_name"] = cur.Major.MajorName
	}
	return out
}

// === Handlers ===
func CreateCurriculum(c *gin.Context) {
	// รับ body จากผู้ใช้
	var req CurriculumCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// ต่อ DB
	db := config.DB()

	// เช็คความสัมพันธ์ Major ↔ Faculty ให้ถูกคู่
	if err := validateMajorFaculty(db, req.MajorID, req.FacultyID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เตรียมข้อมูลก่อนบันทึก
	cur := entity.Curriculum{
		CurriculumID:   req.CurriculumID,
		CurriculumName: req.CurriculumName,
		TotalCredit:    req.TotalCredit,
		StartYear:      req.StartYear,
		FacultyID:      req.FacultyID,
		MajorID:        req.MajorID,
		Description:    req.Description,
	}
	// บันทึกลงฐาน
	if err := db.Create(&cur).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เติมข้อมูลความสัมพันธ์ไว้ตอบ (ชื่อคณะ/สาขา)
	_ = db.Preload("Faculty").Preload("Major").First(&cur, "curriculum_id = ?", cur.CurriculumID).Error
	// ตอบกลับสำเร็จ
	c.JSON(http.StatusOK, gin.H{"message": "create curriculum success", "data": curriculumToResp(db, cur)})
}

func GetCurriculumByID(c *gin.Context) {
	// รับ id จาก path
	id := c.Param("curriculumId")
	db := config.DB()

	// preload คณะ/สาขา มาด้วย
	var cur entity.Curriculum
	if err := db.Preload("Faculty").Preload("Major").First(&cur, "curriculum_id = ?", id).Error; err != nil {
		// ถ้าไม่เจอ ส่ง 404 ให้ชัด
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// แปลงแล้วส่งคืน
	c.JSON(http.StatusOK, curriculumToResp(db, cur))
}

func GetCurriculumAll(c *gin.Context) {
	db := config.DB()
	// preload แล้วดึงทั้งหมด
	var curs []entity.Curriculum
	if err := db.Preload("Faculty").Preload("Major").Find(&curs).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// ใส่ลำดับเผื่อหน้า table ใช้
	out := make([]gin.H, 0, len(curs))
	for i, cur := range curs {
		row := curriculumToResp(db, cur)
		row["index"] = i + 1
		out = append(out, row)
	}
	// ส่งกลับทั้งชุด
	c.JSON(http.StatusOK, out)
}

func UpdateCurriculum(c *gin.Context) {
	// รับ id จาก path
	id := c.Param("curriculumId")
	db := config.DB()

	// อ่าน JSON ที่ส่งมาเพื่อแก้ไข
	var req CurriculumUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// หารายการเดิมก่อน
	var cur entity.Curriculum
	if err := db.First(&cur, "curriculum_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "curriculum not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// คำนวณค่าใหม่ไว้ตรวจ Major/Faculty
	newFacultyID := cur.FacultyID
	newMajorID := cur.MajorID
	if req.FacultyID != nil {
		newFacultyID = *req.FacultyID
	}
	if req.MajorID != nil {
		newMajorID = *req.MajorID
	}
	// ถ้ามีแก้ field ฝั่งคณะ/สาขา ให้ตรวจให้ผ่านก่อน
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

	// เซฟลงฐาน
	if err := db.Save(&cur).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เติมข้อมูลสัมพันธ์ไว้ตอบกลับ
	_ = db.Preload("Faculty").Preload("Major").First(&cur, "curriculum_id = ?", cur.CurriculumID).Error
	// ส่งกลับผลล่าสุด
	c.JSON(http.StatusOK, curriculumToResp(db, cur))
}

func DeleteCurriculum(c *gin.Context) {
	// รับ id จาก path
	id := c.Param("curriculumId")
	db := config.DB()

	// ลบออก (gorm ใช้ soft delete ถ้ามี gorm.DeletedAt)
	if err := db.Delete(&entity.Curriculum{}, "curriculum_id = ?", id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// ตอบว่าเรียบร้อย
	c.JSON(http.StatusOK, gin.H{"message": "delete curriculum success"})
}
