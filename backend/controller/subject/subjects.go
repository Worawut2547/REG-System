// ======================================================================
// subjects/controller.go
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

// -------------------- Request DTOs --------------------

type SubjectCreateReq struct {
	SubjectID   string `json:"subject_id"   binding:"required"`
	SubjectName string `json:"subject_name" binding:"required"`
	Credit      int    `json:"credit"       binding:"required,min=1,max=5"`
	MajorID     string `json:"major_id"     binding:"required"`
	FacultyID   string `json:"faculty_id"   binding:"required"`
	SemesterID  int    `json:"semester_id"  binding:"required"`
	TeacherID   string `json:"teacher_id"   binding:"omitempty"` // ไม่บังคับ แต่ถ้าส่งมาก็เก็บ
}

type SubjectUpdateReq struct {
	SubjectName *string `json:"subject_name,omitempty"`
	Credit      *int    `json:"credit,omitempty"       binding:"omitempty,min=1,max=5"`
	MajorID     *string `json:"major_id,omitempty"`
	FacultyID   *string `json:"faculty_id,omitempty"`
	SemesterID  *int    `json:"semester_id,omitempty"`
	TeacherID   *string `json:"teacher_id,omitempty"`
}

// -------------------- Helpers --------------------

func validateMajorFaculty(db *gorm.DB, majorID, facultyID string) error {
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
	var fac entity.Faculty
	if err := db.First(&fac, "faculty_id = ?", facultyID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid faculty_id")
		}
		return err
	}
	return nil
}

// -------------------- Handlers --------------------

// POST /subjects
func CreateSubject(c *gin.Context) {
	var req SubjectCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	if err := validateMajorFaculty(db, req.MajorID, req.FacultyID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sub := entity.Subject{
		SubjectID:   req.SubjectID,
		SubjectName: req.SubjectName,
		Credit:      req.Credit,
		MajorID:     req.MajorID,
		FacultyID:   req.FacultyID,
		SemesterID:  req.SemesterID,
		TeacherID:   req.TeacherID,
	}

	if err := db.Create(&sub).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Reload เพื่อให้มีข้อมูล Semester (term/academic_year) ตอนตอบกลับ
	if err := db.Preload("Semester").First(&sub, "subject_id = ?", sub.SubjectID).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"message":      "create subject success",
			"subject_id":   sub.SubjectID,
			"subject_name": sub.SubjectName,
			"credit":       sub.Credit,
			"major_id":     sub.MajorID,
			"faculty_id":   sub.FacultyID,
			"semester_id":  sub.SemesterID,
			"teacher_id":   sub.TeacherID,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "create subject success",
		"subject_id":    sub.SubjectID,
		"subject_name":  sub.SubjectName,
		"credit":        sub.Credit,
		"major_id":      sub.MajorID,
		"faculty_id":    sub.FacultyID,
		"semester_id":   sub.SemesterID,
		"term":          sub.Semester.Term,
		"academic_year": sub.Semester.AcademicYear,
		"teacher_id":    sub.TeacherID,
	})
}

// GET /subjects/:subjectId
func GetSubjectID(c *gin.Context) {
	id := c.Param("subjectId")
	db := config.DB()

	var sub entity.Subject
	if err := db.
		Preload("Major").
		Preload("Faculty").
		Preload("Semester").
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
		"subject_id":    sub.SubjectID,
		"subject_name":  sub.SubjectName,
		"credit":        sub.Credit,
		"major_id":      sub.MajorID,
		"faculty_id":    sub.FacultyID,
		"semester_id":   sub.SemesterID,
		"term":          sub.Semester.Term,
		"academic_year": sub.Semester.AcademicYear,
		"teacher_id":    sub.TeacherID,
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
func GetSubjectAll(c *gin.Context) {
	db := config.DB()

	var subs []entity.Subject
	if err := db.
		Preload("Major").
		Preload("Faculty").
		Preload("Semester").
		Preload("StudyTimes", func(db *gorm.DB) *gorm.DB { return db.Order("start_at ASC") }).
		Find(&subs).Error; err != nil {

	 c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	 return
	}

	out := make([]map[string]interface{}, 0, len(subs))
	for i, s := range subs {
		row := map[string]interface{}{
			"index":         i + 1,
			"subject_id":    s.SubjectID,
			"subject_name":  s.SubjectName,
			"credit":        s.Credit,
			"major_id":      s.MajorID,
			"faculty_id":    s.FacultyID,
			"semester_id":   s.SemesterID,
			"term":          s.Semester.Term,
			"academic_year": s.Semester.AcademicYear,
			"teacher_id":    s.TeacherID,
			// "study_times": s.StudyTimes, // ถ้าต้องการแนบด้วยค่อยเปิด
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
func UpdateSubject(c *gin.Context) {
	id := c.Param("subjectId")
	db := config.DB()

	var req SubjectUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var sub entity.Subject
	if err := db.First(&sub, "subject_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	newMajorID := sub.MajorID
	newFacultyID := sub.FacultyID
	if req.MajorID != nil {
		newMajorID = *req.MajorID
	}
	if req.FacultyID != nil {
		newFacultyID = *req.FacultyID
	}
	if req.MajorID != nil || req.FacultyID != nil {
		if err := validateMajorFaculty(db, newMajorID, newFacultyID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

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
	if req.SemesterID != nil {
		sub.SemesterID = *req.SemesterID
	}
	if req.TeacherID != nil {
		sub.TeacherID = *req.TeacherID
	}

	if err := db.Save(&sub).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Reload เพื่อให้ term/year อัปเดตตอนตอบ
	if err := db.Preload("Semester").First(&sub, "subject_id = ?", sub.SubjectID).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{
			"subject_id":   sub.SubjectID,
			"subject_name": sub.SubjectName,
			"credit":       sub.Credit,
			"major_id":     sub.MajorID,
			"faculty_id":   sub.FacultyID,
			"semester_id":  sub.SemesterID,
			"teacher_id":   sub.TeacherID,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"subject_id":    sub.SubjectID,
		"subject_name":  sub.SubjectName,
		"credit":        sub.Credit,
		"major_id":      sub.MajorID,
		"faculty_id":    sub.FacultyID,
		"semester_id":   sub.SemesterID,
		"term":          sub.Semester.Term,
		"academic_year": sub.Semester.AcademicYear,
		"teacher_id":    sub.TeacherID,
	})
}

// DELETE /subjects/:subjectId
func DeleteSubject(c *gin.Context) {
	id := c.Param("subjectId")
	db := config.DB()

	if err := db.Delete(&entity.Subject{}, "subject_id = ?", id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "delete subject success"})
}
