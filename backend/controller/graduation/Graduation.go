package graduation

import (
	//"fmt"
	//"log"
	"net/http"
	"reg_system/config"
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
	input := &entity.Graduation{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
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
		Preload("Curriculum").
		First(&graduation, "student_id = ?", studentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Graduation request not found"})
		return
	}

	status := ""
	if graduation.Student != nil && graduation.Student.StatusStudent != nil {
		status = graduation.Student.StatusStudent.Status
	}

	curriculumName := ""
	if graduation.Curriculum != nil {
		curriculumName = graduation.Curriculum.CurriculumName
	}

	c.JSON(http.StatusOK, gin.H{"data": gin.H{
		"GraduationID":  graduation.ID,
		"StudentID":     graduation.StudentID,
		"FirstName":     graduation.Student.FirstName,
		"LastName":      graduation.Student.LastName,
		"CurriculumID":  graduation.CurriculumID,
		"Curriculum":    curriculumName,
		"StatusStudent": status,
		"RejectReason":  graduation.RejectReason,
		"Date":          graduation.Date,
	}})
}

// ----------------------
// 3. ดึงคำขอแจ้งจบทั้งหมด (Admin)
// ----------------------
func GetAllGraduation(c *gin.Context) {
	db := config.DB()
	var graduations []entity.Graduation

	if err := db.Preload("Student").
		Preload("Student.StatusStudent").
		Preload("Curriculum").
		Find(&graduations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch graduations"})
		return
	}

	var response []gin.H
	for _, g := range graduations {
		status := ""
		if g.Student != nil && g.Student.StatusStudent != nil {
			status = g.Student.StatusStudent.Status
		}

		curriculumName := ""
		if g.Curriculum != nil {
			curriculumName = g.Curriculum.CurriculumName
		}

		response = append(response, gin.H{
			"GraduationID":  g.ID,
			"StudentID":     g.StudentID,
			"FirstName":     g.Student.FirstName,
			"LastName":      g.Student.LastName,
			"CurriculumID":  g.CurriculumID,
			"Curriculum":    curriculumName,
			"StatusStudent": status,
			"RejectReason":  g.RejectReason,
			"Date":          g.Date,
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

