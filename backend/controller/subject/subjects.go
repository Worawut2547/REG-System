// ======================================================================
// subjects/controller.go
// เส้นทางและ handler สำหรับจัดการ "รายวิชา" (Subjects)
// - รองรับ faculty_id ตาม entity ใหม่
// - ตรวจสอบความสอดคล้อง Major ↔ Faculty (ถ้า Major ผูก Faculty อยู่แล้ว)
// - ตอบกลับเป็น snake_case ให้ตรงกับ JSON tag
// ======================================================================

package subjects

import (
	"errors"
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ======================================================================
// Section 1: Request DTOs (รับข้อมูลจากฝั่ง Frontend)
// ======================================================================

// SubjectCreateReq ใช้รับข้อมูลตอนสร้างรายวิชา
// หมายเหตุ:
// - ถ้าให้ระบบ generate subject_id เอง ให้ปรับ binding ของ SubjectID เป็น omitempty หรือเอาออก
type SubjectCreateReq struct {
	SubjectID   string `json:"subject_id"   binding:"required"` // เปลี่ยนเป็น omitempty ถ้าไม่บังคับกรอก
	SubjectName string `json:"subject_name" binding:"required"`
	Credit      int    `json:"credit"       binding:"required,min=1,max=5"`
	MajorID     string `json:"major_id"     binding:"required"`
	FacultyID   string `json:"faculty_id"   binding:"required"`
}

// SubjectUpdateReq ใช้รับข้อมูลตอนแก้ไขรายวิชา
type SubjectUpdateReq struct {
	SubjectName *string `json:"subject_name,omitempty"`
	Credit      *int    `json:"credit,omitempty"    binding:"omitempty,min=1,max=5"`
	MajorID     *string `json:"major_id,omitempty"`
	FacultyID   *string `json:"faculty_id,omitempty"`
}

// ======================================================================
// Section 2: Helper Functions (ฟังก์ชันช่วยเหลือ)
// ======================================================================

// validateMajorFaculty ตรวจสอบว่า major_id และ faculty_id มีอยู่จริง
// และถ้า major ผูก faculty อยู่แล้ว ต้องสอดคล้องกับ faculty_id ที่รับมา
func validateMajorFaculty(db *gorm.DB, majorID, facultyID string) error {
	var major entity.Majors
	if err := db.First(&major, "major_id = ?", majorID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid major_id")
		}
		return err
	}

	// ถ้ามี constraint ว่า Major อยู่ภายใต้ Faculty ใด ต้องเช็คให้ตรง
	if major.FacultyID != "" && major.FacultyID != facultyID {
		return errors.New("major_id does not belong to faculty_id")
	}

	var fac entity.Faculty
	if err := db.First(&fac, "faculty_id = ?", facultyID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid faculty_id")
		}
		return err
	}
	return nil
}

// ======================================================================
// Section 3: Handlers - Create / Read / Update / Delete
// ======================================================================

// POST /subjects
// สร้างรายวิชาใหม่
func CreateSubject(c *gin.Context) {
	var req SubjectCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// --- ตรวจสอบความสอดคล้อง Major ↔ Faculty และการมีอยู่จริง ---
	if err := validateMajorFaculty(db, req.MajorID, req.FacultyID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sub := entity.Subjects{
		SubjectID:   req.SubjectID,
		SubjectName: req.SubjectName,
		Credit:      req.Credit,
		MajorID:     req.MajorID,
		FacultyID:   req.FacultyID,
	}

	if err := db.Create(&sub).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตอบกลับ (snake_case)
	c.JSON(http.StatusOK, gin.H{
		"message":      "create subject success",
		"subject_id":   sub.SubjectID,
		"subject_name": sub.SubjectName,
		"credit":       sub.Credit,
		"major_id":     sub.MajorID,
		"faculty_id":   sub.FacultyID,
	})
}

// GET /subjects/:subjectId
// อ่านรายวิชา + preload ความสัมพันธ์ (Major, Faculty, StudyTimes)
func GetSubjectID(c *gin.Context) {
	id := c.Param("subjectId")
	db := config.DB()

	var sub entity.Subjects
	if err := db.
		Preload("Major").
		Preload("Faculty").
		Preload("StudyTimes", func(db *gorm.DB) *gorm.DB { return db.Order("start_at ASC") }).
		First(&sub, "subject_id = ?", id).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp := map[string]interface{}{
		"subject_id":   sub.SubjectID,
		"subject_name": sub.SubjectName,
		"credit":       sub.Credit,
		"major_id":     sub.MajorID,
		"faculty_id":   sub.FacultyID,
		"study_times":  sub.StudyTimes, // อ่านอย่างเดียว (CRUD แยกใน study time controller)
	}
	if sub.Major != nil {
		resp["major_name"] = sub.Major.MajorName
	}
	if sub.Faculty != nil {
		resp["faculty_name"] = sub.Faculty.FacultyName
	}

	c.JSON(http.StatusOK, resp)
}

// GET /subjects
// อ่านรายการรายวิชาทั้งหมด
func GetSubjectAll(c *gin.Context) {
	db := config.DB()

	var subs []entity.Subjects
	if err := db.
		Preload("Major").
		Preload("Faculty").
		Preload("StudyTimes", func(db *gorm.DB) *gorm.DB { return db.Order("start_at ASC") }).
		Find(&subs).Error; err != nil {

		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	out := make([]map[string]interface{}, 0, len(subs))
	for i, s := range subs {
		row := map[string]interface{}{
			"index":        i + 1, // ใช้สำหรับแสดงลำดับในตาราง (ถ้าไม่ใช้จะลบออกก็ได้)
			"subject_id":   s.SubjectID,
			"subject_name": s.SubjectName,
			"credit":       s.Credit,
			"major_id":     s.MajorID,
			"faculty_id":   s.FacultyID,
			"study_times":  s.StudyTimes,
		}
		if s.Major != nil {
			row["major_name"] = s.Major.MajorName
		}
		if s.Faculty != nil {
			row["faculty_name"] = s.Faculty.FacultyName
		}
		out = append(out, row)
	}

	c.JSON(http.StatusOK, out)
}

// PUT /subjects/:subjectId
// แก้ไขรายวิชา (รองรับแก้ชื่อ, หน่วยกิต, major_id, faculty_id)
// ถ้าแก้ major/faculty ให้ตรวจสอบความสอดคล้องก่อน
func UpdateSubject(c *gin.Context) {
	id := c.Param("subjectId")
	db := config.DB()

	var req SubjectUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var sub entity.Subjects
	if err := db.First(&sub, "subject_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เตรียมค่าที่จะตรวจความสอดคล้อง
	newMajorID := sub.MajorID
	newFacultyID := sub.FacultyID
	if req.MajorID != nil {
		newMajorID = *req.MajorID
	}
	if req.FacultyID != nil {
		newFacultyID = *req.FacultyID
	}

	// ถ้ามีการเปลี่ยน Major/Faculty -> ตรวจสอบ
	if req.MajorID != nil || req.FacultyID != nil {
		if err := validateMajorFaculty(db, newMajorID, newFacultyID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// อัปเดตฟิลด์ที่ส่งมา
	if req.SubjectName != nil {
		sub.SubjectName = *req.SubjectName
	}
	if req.Credit != nil {
		sub.Credit = *req.Credit
	}
	if req.MajorID != nil {
		sub.MajorID = *req.MajorID
	}
	if req.FacultyID != nil {
		sub.FacultyID = *req.FacultyID
	}

	if err := db.Save(&sub).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// แนะนำตอบเป็น snake_case
	c.JSON(http.StatusOK, gin.H{
		"subject_id":   sub.SubjectID,
		"subject_name": sub.SubjectName,
		"credit":       sub.Credit,
		"major_id":     sub.MajorID,
		"faculty_id":   sub.FacultyID,
	})
}

// DELETE /subjects/:subjectId
// ลบรายวิชา (ถ้ามี constraint:OnDelete:CASCADE ที่ StudyTimes จะลบเวลาที่เกี่ยวข้องตาม)
func DeleteSubject(c *gin.Context) {
	id := c.Param("subjectId")
	db := config.DB()

	if err := db.Delete(&entity.Subjects{}, "subject_id = ?", id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "delete subject success"})
}
