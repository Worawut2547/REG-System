// === Package ===
package subjects

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
type SubjectCreateReq struct {
	SubjectID   string `json:"subject_id"   binding:"required"`
	SubjectName string `json:"subject_name" binding:"required"`
	Credit      int    `json:"credit"       binding:"required,min=1,max=5"`
	MajorID     string `json:"major_id"     binding:"required"`
	FacultyID   string `json:"faculty_id"   binding:"required"`
	SemesterID  int    `json:"semester_id"  binding:"required"`
	TeacherID   string `json:"teacher_id"   binding:"omitempty"`
}

type SubjectUpdateReq struct {
	SubjectName *string `json:"subject_name,omitempty"`
	Credit      *int    `json:"credit,omitempty"       binding:"omitempty,min=1,max=5"`
	MajorID     *string `json:"major_id,omitempty"`
	FacultyID   *string `json:"faculty_id,omitempty"`
	SemesterID  *int    `json:"semester_id,omitempty"`
	TeacherID   *string `json:"teacher_id,omitempty"`
}

// === Helpers ===
func validateMajorFaculty(db *gorm.DB, majorID, facultyID string) error {
	// เช็ก major ก่อน กันส่งมาผิด
	var major entity.Majors
	if err := db.First(&major, "major_id = ?", majorID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid major_id")
		}
		return err
	}
	// major ต้องสังกัด faculty เดียวกัน
	if major.FacultyID != "" && major.FacultyID != facultyID {
		return errors.New("major_id does not belong to faculty_id")
	}
	// เช็ก faculty ว่ามีจริง
	var fac entity.Faculty
	if err := db.First(&fac, "faculty_id = ?", facultyID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid faculty_id")
		}
		return err
	}
	return nil
}

// === Handlers ===
func CreateSubject(c *gin.Context) {
	// อ่าน body ที่ส่งมา
	var req SubjectCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB() // ต่อ DB

	// ตรวจคู่ major ↔ faculty ให้เข้ากัน
	if err := validateMajorFaculty(db, req.MajorID, req.FacultyID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// รวมข้อมูลก่อนบันทึก
	sub := entity.Subject{
		SubjectID:   req.SubjectID,
		SubjectName: req.SubjectName,
		Credit:      req.Credit,
		MajorID:     req.MajorID,
		FacultyID:   req.FacultyID,
		SemesterID:  req.SemesterID,
		TeacherID:   req.TeacherID,
	}

	// ส่งไปหลังบ้าน (บันทึก)
	if err := db.Create(&sub).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เติมข้อมูลเทอม/ปี ไว้ตอบกลับ
	if err := db.Preload("Semester").First(&sub, "subject_id = ?", sub.SubjectID).Error; err != nil {
		// พรีโหลดไม่ได้ก็ส่งแบบพื้นฐาน
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

	// ตอบกลับพร้อม term/year ให้หน้าใช้ได้ทันที
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

func GetSubjectID(c *gin.Context) {
	id := c.Param("subjectId") // รับ id จาก path
	db := config.DB()

	// โหลดความสัมพันธ์ให้ครบ
	var sub entity.Subject
	if err := db.
		Preload("Major").
		Preload("Faculty").
		Preload("StudyTimes", func(db *gorm.DB) *gorm.DB { return db.Order("start_at ASC") }).
		Preload("Semester").
		First(&sub, "subject_id = ?", id).Error; err != nil {
		// ไม่เจอ → 404 / อื่น ๆ → 400
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เตรียม payload สำหรับหน้า
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
	// แถมชื่อสาขา/คณะ ถ้ามี
	if sub.Major != nil {
		resp["major_name"] = sub.Major.MajorName
	}
	if sub.Faculty != nil {
		resp["faculty_name"] = sub.Faculty.FacultyName
	}

	// ส่งกลับตัวเดียว
	c.JSON(http.StatusOK, resp)
}

func GetSubjectAll(c *gin.Context) {
	db := config.DB()

	// โหลดทั้งหมดพร้อมความสัมพันธ์
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

	// เตรียมตารางตอบกลับ
	out := make([]map[string]interface{}, 0, len(subs))
	for i, s := range subs {
		// แปลงเป็นบรรทัด ๆ ให้หน้า table
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
		}
		// เติมชื่อจากความสัมพันธ์ ถ้ามี
		if s.Major != nil {
			row["major_name"] = s.Major.MajorName
		}
		if s.Faculty != nil {
			row["faculty_name"] = s.Faculty.FacultyName
		}
		out = append(out, row)
	}

	// ส่งกลับทั้งชุด
	c.JSON(http.StatusOK, out)
}

func UpdateSubject(c *gin.Context) {
	id := c.Param("subjectId") // รับ id
	db := config.DB()

	// อ่านฟิลด์ที่อยากแก้
	var req SubjectUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// หาเดิมมาก่อน
	var sub entity.Subject
	if err := db.First(&sub, "subject_id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// คำนวณค่าใหม่ไว้ตรวจคู่ major/faculty
	newMajorID := sub.MajorID
	newFacultyID := sub.FacultyID
	if req.MajorID != nil {
		newMajorID = *req.MajorID
	}
	if req.FacultyID != nil {
		newFacultyID = *req.FacultyID
	}
	// ถ้าแก้คู่ใดคู่หนึ่ง ให้ตรวจความเข้ากันก่อน
	if req.MajorID != nil || req.FacultyID != nil {
		if err := validateMajorFaculty(db, newMajorID, newFacultyID); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// อัปเฉพาะฟิลด์ที่ส่งมา
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

	// บันทึกลงฐาน
	if err := db.Save(&sub).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เติมเทอม/ปีไว้ตอบกลับ
	if err := db.Preload("Semester").First(&sub, "subject_id = ?", sub.SubjectID).Error; err != nil {
		// เติมไม่สำเร็จ ส่งแบบพื้นฐาน
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

	// ส่งกลับเวอร์ชันครบ
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

func DeleteSubject(c *gin.Context) {
	id := c.Param("subjectId") // รับ id
	db := config.DB()

	// ลบออกจากฐาน
	if err := db.Delete(&entity.Subject{}, "subject_id = ?", id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// บอกว่าเรียบร้อย
	c.JSON(http.StatusOK, gin.H{"message": "delete subject success"})
}