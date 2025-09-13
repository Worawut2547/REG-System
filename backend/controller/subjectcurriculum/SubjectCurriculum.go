package subjectcurriculum

// === Imports ===

import (
	"fmt"
	"net/http"

	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)


// === Types/Interfaces ===

type createReq struct {
	SubjectID    string `json:"subject_id" binding:"required"`
	CurriculumID string `json:"curriculum_id" binding:"required"`
}


// === Handlers ===

func GetSubjectCurriculumAll(c *gin.Context) {
	db := config.DB() // ต่อ DB
	var links []entity.SubjectCurriculum

	// ดึงทุกลิงก์ subject ↔ curriculum
	if err := db.Find(&links).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get subject_curriculum"})
		return
	}

	// ส่งกลับทั้งชุด
	c.JSON(http.StatusOK, links)
}

func CreateSubjectCurriculum(c *gin.Context) {
	// อ่าน body ที่ส่งมา
	var req createReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		fmt.Print("Error binding JSON: ", err.Error())
		return
	}

	db := config.DB() // ต่อ DB

	// เตรียมข้อมูลก่อนบันทึก
	link := entity.SubjectCurriculum{
		SubjectID:    req.SubjectID,
		CurriculumID: req.CurriculumID,
	}

	// กันซ้ำ: ถ้ามีคู่นี้แล้ว ไม่ต้องสร้างใหม่
	result := db.Where("subject_id = ? AND curriculum_id = ?", req.SubjectID, req.CurriculumID).FirstOrCreate(&link)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// เช็กผลว่าเพิ่งสร้าง หรือเคยมีแล้ว
	statusCode := http.StatusCreated
	created := true
	if result.RowsAffected == 0 {
		statusCode = http.StatusOK
		created = false
	}

	// ส่งกลับพร้อมสถานะ created
	c.JSON(statusCode, gin.H{
		"data":    link,
		"created": created,
	})
}

func GetSubjectCurriculumByID(c *gin.Context) {
	id := c.Param("id") // รับ id จาก path

	db := config.DB() // ต่อ DB
	var link entity.SubjectCurriculum

	// หาเรคคอร์ดเดียว ไม่เจอ = 404
	if err := db.First(&link, "subject_curriculum_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "subject_curriculum not found"})
		return
	}

	// ส่งกลับตัวเดียว
	c.JSON(http.StatusOK, link)
}

func DeleteSubjectCurriculum(c *gin.Context) {
	id := c.Param("id") // รับ id จาก path
	db := config.DB()   // ต่อ DB

	// ลบลิงก์นี้ทิ้ง
	if err := db.Delete(&entity.SubjectCurriculum{}, "subject_curriculum_id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete subject_curriculum"})
		return
	}

	// ตอบ 204 เปล่า ๆ
	c.Status(http.StatusNoContent)
}

