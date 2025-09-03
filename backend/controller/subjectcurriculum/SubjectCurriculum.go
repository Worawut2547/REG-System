package subjectcurriculum

import (
	"fmt"
	"net/http"

	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

// GET /subject-curriculums
func GetSubjectCurriculumAll(c *gin.Context) {
	db := config.DB()
	var links []entity.SubjectCurriculum
	if err := db.Find(&links).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get subject_curriculum"})
		return
	}
	c.JSON(http.StatusOK, links)
}

// ใช้ DTO บังคับเฉพาะคู่รหัสที่ต้องมี
type createReq struct {
	SubjectID    string `json:"subject_id" binding:"required"`
	CurriculumID string `json:"curriculum_id" binding:"required"`
}

// POST /subject-curriculums
func CreateSubjectCurriculum(c *gin.Context) {
	var req createReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		fmt.Print("Error binding JSON: ", err.Error())
		return
	}

	db := config.DB()
	link := entity.SubjectCurriculum{
		SubjectID:    req.SubjectID,
		CurriculumID: req.CurriculumID,
	}

	// FirstOrCreate โดยใช้ "คู่รหัส" เป็นเงื่อนไขกันซ้ำ
	result := db.Where("subject_id = ? AND curriculum_id = ?", req.SubjectID, req.CurriculumID).
		FirstOrCreate(&link)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// ถ้าสร้างใหม่ -> 201, ถ้าเจออยู่แล้ว -> 200 พร้อม flag created=false
	statusCode := http.StatusCreated
	created := true
	if result.RowsAffected == 0 {
		statusCode = http.StatusOK
		created = false
	}

	c.JSON(statusCode, gin.H{
		"data":    link,
		"created": created,
	})
}

// GET /subject-curriculums/:id
func GetSubjectCurriculumByID(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()
	var link entity.SubjectCurriculum

	// หาตาม primary key (subject_curriculum_id)
	if err := db.First(&link, "subject_curriculum_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "subject_curriculum not found"})
		return
	}

	c.JSON(http.StatusOK, link)
}

// DELETE /subject-curriculums/:id
func DeleteSubjectCurriculum(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()
	// ลบตาม primary key
	if err := db.Delete(&entity.SubjectCurriculum{}, "subject_curriculum_id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete subject_curriculum"})
		return
	}

	c.Status(http.StatusNoContent) // 204
}
