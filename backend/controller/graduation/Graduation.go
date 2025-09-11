package graduation

import (
	//"fmt"
	"log"
	"net/http"
	"reg_system/config"
	"reg_system/services"

	//"reg_system/controller/graduation"
	"reg_system/entity"

	//"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// ----------------------
// 1. สร้างคำขอแจ้งจบ (นักศึกษา)
// ----------------------
func CreateGraduation(c *gin.Context) {

	//มีการแก้ไข 2 บบรทัดด้านล่าง AutoMigrate เพื่อทำการสร้างตารางขึ้นมาอัตโนมัติ **ตอนแรกไม่มีตารางนี้
	//และใช้ gorm transaction เพื่อให้การสร้างคำขอแจ้งจบและการอัพเดทสถานะนักเรียนเป็น atomic operation
	db := config.DB()
	db.AutoMigrate(&entity.Graduation{})

	input := &entity.Graduation{}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	graduation := entity.Graduation{
		StudentID:    input.StudentID,
		CurriculumID: input.CurriculumID,
	}

	// ใช้ transaction
	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&graduation).Error; err != nil {
			return err
		}
		if err := tx.Model(&entity.Students{}).
			Where("student_id = ?", input.StudentID).
			Update("status_student_id", "20").Error; err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Graduation created and status updated successfully",
		"data":    graduation,
	})
}

// ----------------------
// 2. ดึงคำขอแจ้งจบของนักศึกษาปัจจุบัน
// ----------------------
func GetMyGraduation(c *gin.Context) {
	studentID := c.Param("id")

	db := config.DB()
	var graduation entity.Graduation

	if err := db.Preload("Student").
		Preload("Student.StatusStudent").
		Preload("Student.Curriculum").
		Preload("Student.Grade.Subject").
		First(&graduation, "student_id = ?", studentID).Error; err != nil {

		// 🔹 ถ้าไม่พบ graduation ให้ดึง student แทน
		var student entity.Students
		if err := db.Preload("StatusStudent").
			Preload("Curriculum").
			Preload("Grade.Subject").
			First(&student, "student_id = ?", studentID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
			return
		}

		totalCredits, _ := services.CalculateTotalCredits(studentID)
		gpa := services.CalculateGPA(student.Grade)

		c.JSON(http.StatusOK, gin.H{"data": gin.H{
			"GraduationID":  0,
			"StudentID":     student.StudentID,
			"FirstName":     student.FirstName,
			"LastName":      student.LastName,
			"CurriculumID":  student.Curriculum.CurriculumID,
			"Curriculum":    student.Curriculum.CurriculumName,
			"StatusStudent": student.StatusStudent.Status,
			"RejectReason":  "",
			"Date":          nil,
			"TotalCredits":  totalCredits,
			"GPA":           gpa,
		}})
		return
	}
}

// ----------------------
// 3. ดึงคำขอแจ้งจบทั้งหมด (Admin)
// ----------------------
func GetAllGraduation(c *gin.Context) {
	db := config.DB()
	var graduations []entity.Graduation

	// ดึง graduations พร้อม preload
	if err := db.Preload("Student").
		Preload("Student.StatusStudent").
		Preload("Student.Curriculum").
		Preload("Student.Grade.Subject").
		Find(&graduations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch graduations"})
		return
	}

	var response []gin.H
	for _, g := range graduations {
		var totalCredits int
		db.Table("registrations").
			Joins("JOIN subjects ON registrations.subject_id = subjects.subject_id").
			Where("registrations.student_id = ?", g.StudentID).
			Select("SUM(subjects.credit)").
			Scan(&totalCredits)

		status := ""
		if g.Student != nil && g.Student.StatusStudent != nil {
			status = g.Student.StatusStudent.Status
		}

		// ✅ ดึง curriculum จาก student
		curriculumName := ""
		curriculumID := ""
		if g.Student != nil {
			curriculumID = g.Student.CurriculumID
			if g.Student.Curriculum != nil {
				curriculumName = g.Student.Curriculum.CurriculumName
			}
		}

		// GPA
		gpa := 0.0
		if g.Student != nil && len(g.Student.Grade) > 0 {
			gpa = services.CalculateGPA(g.Student.Grade)
		}

		// --- Debug log ---
		if g.Student != nil {
			log.Println("StudentID:", g.Student.StudentID)
			log.Println("CurriculumID:", g.Student.CurriculumID)
			if g.Student.Curriculum != nil {
				log.Println("CurriculumName:", g.Student.Curriculum.CurriculumName)
			} else {
				log.Println("Curriculum is nil")
			}
		}

		// append response
		response = append(response, gin.H{
			"GraduationID":  g.ID,
			"StudentID":     g.StudentID,
			"FirstName":     g.Student.FirstName,
			"LastName":      g.Student.LastName,
			"CurriculumID":  curriculumID,
			"Curriculum":    curriculumName,
			"StatusStudent": status,
			"RejectReason":  g.RejectReason,
			"Date":          g.Date,
			"TotalCredits":  totalCredits,
			"GPA":           gpa,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// ----------------------
// 4. อัพเดทสถานะคำขอแจ้งจบ (Admin)
// ----------------------
func UpdateGraduation(c *gin.Context) {
	graduationID := c.Param("id")

	type UpdateInput struct {
		StatusStudentID string  `json:"StatusStudentID"`
		RejectReason    *string `json:"RejectReason,omitempty"` // ใช้ pointer
	}

	var input UpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	err := db.Transaction(func(tx *gorm.DB) error {
		var graduation entity.Graduation
		if err := tx.First(&graduation, "id = ?", graduationID).Error; err != nil {
			return err
		}

		// อัปเดต StatusStudent ของนักเรียน
		if err := tx.Model(&entity.Students{}).
			Where("student_id = ?", graduation.StudentID).
			Update("status_student_id", input.StatusStudentID).Error; err != nil {
			return err
		}

		// อัปเดต RejectReason เฉพาะถ้ามีค่า
		if err := tx.Model(&graduation).
			Update("reject_reason", input.RejectReason).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Graduation status updated successfully"})
}

