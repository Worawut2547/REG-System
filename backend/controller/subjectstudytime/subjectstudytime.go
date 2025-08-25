package subjectstudytime

import (
	"errors"
	"fmt"
	"net/http"
	"reg_system/config"
	"reg_system/entity"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

/* ==========================
   🧩 DTO / Payload ที่ใช้รับจาก Frontend
   ==========================*/

type StudyTimeCreateReq struct {
	SubjectID string `json:"subject_id,omitempty"`         // FK ไปยังรายวิชา (ไม่ต้องส่งก็ได้)
	Start     string `json:"start"     binding:"required"` // "YYYY-MM-DD HH:mm" หรือ RFC3339
	End       string `json:"end"       binding:"required"`
}

type StudyTimeUpdateReq struct {
	Start *string `json:"start,omitempty"` // อัปเดตบางฟิลด์ได้
	End   *string `json:"end,omitempty"`
}

/* ==========================
   ⏱️ helper: parse เวลา (รองรับ ISO และ "YYYY-MM-DD HH:mm")
   ==========================*/

func parseTimeFlexible(s string, loc *time.Location) (time.Time, error) {
	// 1) RFC3339 (ISO)
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t.In(loc), nil
	}
	// 2) "YYYY-MM-DD HH:mm" (รูปแบบที่ฟรอนต์คุณส่ง)
	const layout = "2006-01-02 15:04"
	if t, err := time.ParseInLocation(layout, s, loc); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("invalid time format: %s (use RFC3339 or YYYY-MM-DD HH:mm)", s)
}

/* ==========================
   GET /subjects/:subjectId/times
   ▶️ ดึงช่วงเวลาเรียนทั้งหมดของรายวิชา
   ==========================*/

func GetBySubject(c *gin.Context) {
	subjectID := c.Param("subjectId")
	db := config.DB()

	var times []entity.SubjectStudyTime
	res := db.Where("subject_id = ?", subjectID).
		Order("start_at asc").
		Find(&times)

	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "study times not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		}
		return
	}
	if res.RowsAffected == 0 {
		// ถ้าไม่มี ถือว่า 200 แต่ลิสต์ว่างก็ได้ หรือจะ 404 ก็ได้ตามสไตล์ของคุณ
		c.JSON(http.StatusOK, []entity.SubjectStudyTime{})
		return
	}

	// เลือกส่งเฉพาะฟิลด์ที่ต้องการก็ได้
	c.JSON(http.StatusOK, times)
}

/* ==========================
   GET /subjects/:subjectId/times/:timeId
   ▶️ ดึงช่วงเวลาเรียน 1 รายการของรายวิชา
   ==========================*/

func GetOne(c *gin.Context) {
	subjectID := c.Param("subjectId")
	timeID := c.Param("timeId")
	db := config.DB()

	var st entity.SubjectStudyTime
	err := db.Where("subject_id = ? AND id = ?", subjectID, timeID).
		First(&st).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "study time not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, st)
}

/* ==========================
   POST /subjects/:subjectId/times
   ▶️ เพิ่มช่วงเวลาเรียนใหม่ (หนึ่งรายการ) ให้รายวิชานี้
   ==========================*/

func Create(c *gin.Context) {
	subjectID := c.Param("subjectId")
	db := config.DB()

	// ตรวจว่ามี subject นี้จริงไหม
	var count int64
	if err := db.Model(&entity.Subjects{}).
		Where("subject_id = ?", subjectID).
		Count(&count).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
		return
	}

	// bind body (ไม่ต้องส่ง subject_id มาใน JSON ก็ได้)
	var req StudyTimeCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")
	st, err := parseTimeFlexible(req.Start, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	et, err := parseTimeFlexible(req.End, loc)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !et.After(st) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end must be after start"})
		return
	}

	item := entity.SubjectStudyTime{
		SubjectID: subjectID,
		StartAt:   st,
		EndAt:     et,
	}

	if err := db.Create(&item).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, item)
}

/* ==========================
   PUT /subjects/:subjectId/times/:timeId
   ▶️ อัปเดตช่วงเวลาเรียน 1 รายการ (แก้ start/end บางส่วนได้)
   ==========================*/

func Update(c *gin.Context) {
	subjectID := c.Param("subjectId")
	timeID := c.Param("timeId")
	db := config.DB()

	// โหลดก่อน
	var st entity.SubjectStudyTime
	if err := db.Where("subject_id = ? AND id = ?", subjectID, timeID).
		First(&st).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "study time not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	// bind body
	var req StudyTimeUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")
	if req.Start != nil {
		t, err := parseTimeFlexible(*req.Start, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		st.StartAt = t
	}
	if req.End != nil {
		t, err := parseTimeFlexible(*req.End, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		st.EndAt = t
	}
	if !st.EndAt.After(st.StartAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end must be after start"})
		return
	}

	if err := db.Save(&st).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

	c.JSON(http.StatusOK, st)
}

/* ==========================
   DELETE /subjects/:subjectId/times/:timeId
   ▶️ ลบช่วงเวลาเรียน 1 รายการของรายวิชา
   ==========================*/

func Delete(c *gin.Context) {
	subjectID := c.Param("subjectId")
	timeID := c.Param("timeId")
	db := config.DB()

	res := db.Where("subject_id = ? AND id = ?", subjectID, timeID).
		Delete(&entity.SubjectStudyTime{})

	if res.Error != nil {
		if errors.Is(res.Error, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "study time not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		}
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "study time not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delete study time success"})
}
