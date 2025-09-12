// === Package ===
package subjectstudytime

// === Imports ===
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

// === Types / DTOs ===
type StudyTimeCreateReq struct {
	SubjectID string `json:"subject_id,omitempty"`
	Start     string `json:"start"     binding:"required"`
	End       string `json:"end"       binding:"required"`
}

type StudyTimeUpdateReq struct {
	Start *string `json:"start,omitempty"`
	End   *string `json:"end,omitempty"`
}

// === Utils / Helpers ===
// รองรับสองรูปแบบเวลา: RFC3339 หรือ "YYYY-MM-DD HH:mm"
func parseTimeFlexible(s string, loc *time.Location) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t.In(loc), nil
	}
	const layout = "2006-01-02 15:04"
	if t, err := time.ParseInLocation(layout, s, loc); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("invalid time format: %s (use RFC3339 or YYYY-MM-DD HH:mm)", s)
}

// === Handlers ===
func GetBySubject(c *gin.Context) {
	subjectID := c.Param("subjectId") // รับ subject_id จาก path
	db := config.DB()                 // ต่อ DB

	// ดึงช่วงเวลาทั้งหมดของวิชานี้ (เรียงเริ่มก่อน)
	var times []entity.SubjectStudyTime
	res := db.Where("subject_id = ?", subjectID).Order("start_at asc").Find(&times)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	// ถ้าไม่มี ให้ส่งลิสต์ว่าง
	if res.RowsAffected == 0 {
		c.JSON(http.StatusOK, []entity.SubjectStudyTime{})
		return
	}
	// ส่งกลับลิสต์ช่วงเวลา
	c.JSON(http.StatusOK, times)
}

func GetOne(c *gin.Context) {
	subjectID := c.Param("subjectId") // รับ subject_id
	timeID := c.Param("timeId")       // รับ time_id
	db := config.DB()                 // ต่อ DB

	// ดึงช่วงเวลาหนึ่งรายการ
	var st entity.SubjectStudyTime
	err := db.Where("subject_id = ? AND id = ?", subjectID, timeID).First(&st).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "study time not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// ส่งกลับรายการเดียว
	c.JSON(http.StatusOK, st)
}

func Create(c *gin.Context) {
	subjectID := c.Param("subjectId") // รับ subject_id จาก path
	db := config.DB()                 // ต่อ DB

	// ตรวจว่ามีวิชานี้จริงก่อนสร้างเวลา
	var count int64
	if err := db.Model(&entity.Subject{}).Where("subject_id = ?", subjectID).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if count == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
		return
	}

	// อ่าน body ที่ส่งมา
	var req StudyTimeCreateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// แปลงเวลาเป็น time ตามโซน "Asia/Bangkok"
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
	// กันเวลาสลับ (end ต้องหลัง start)
	if !et.After(st) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end must be after start"})
		return
	}

	// เตรียมข้อมูลก่อนบันทึก
	item := entity.SubjectStudyTime{
		SubjectID: subjectID,
		StartAt:   st,
		EndAt:     et,
	}
	// บันทึกลงฐาน
	if err := db.Create(&item).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// ส่งกลับรายการที่สร้าง
	c.JSON(http.StatusOK, item)
}

func Update(c *gin.Context) {
	subjectID := c.Param("subjectId") // รับ subject_id
	timeID := c.Param("timeId")       // รับ time_id
	db := config.DB()                 // ต่อ DB

	// โหลดรายการเดิมก่อน
	var st entity.SubjectStudyTime
	if err := db.Where("subject_id = ? AND id = ?", subjectID, timeID).First(&st).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "study time not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// รับฟิลด์ที่จะอัปเดต
	var req StudyTimeUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// แปลงเวลาที่ส่งมา (ถ้ามี)
	loc, _ := time.LoadLocation("Asia/Bangkok")
	if req.Start != nil {
		t, err := parseTimeFlexible(*req.Start, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		st.StartAt = t // ปรับเวลาเริ่ม
	}
	if req.End != nil {
		t, err := parseTimeFlexible(*req.End, loc)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		st.EndAt = t // ปรับเวลาจบ
	}
	// กันเวลาสลับ (end ต้องหลัง start)
	if !st.EndAt.After(st.StartAt) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "end must be after start"})
		return
	}

	// เซฟการเปลี่ยนแปลง
	if err := db.Save(&st).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// ส่งกลับรายการที่อัปเดต
	c.JSON(http.StatusOK, st)
}

func Delete(c *gin.Context) {
	subjectID := c.Param("subjectId") // รับ subject_id
	timeID := c.Param("timeId")       // รับ time_id
	db := config.DB()                 // ต่อ DB

	// ลบรายการตามคู่ subject_id + id
	res := db.Where("subject_id = ? AND id = ?", subjectID, timeID).Delete(&entity.SubjectStudyTime{})
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": res.Error.Error()})
		return
	}
	// ไม่เจอให้ลบ → แจ้ง 404
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "study time not found"})
		return
	}
	// ลบสำเร็จ
	c.JSON(http.StatusOK, gin.H{"message": "Delete study time success"})
}
