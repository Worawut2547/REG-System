package curriculum

// === Imports ===

import (
	"errors"
	"fmt"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"reg_system/config"
	"reg_system/entity"
)


// === Constants/Env ===

// อนุญาตเฉพาะ .pdf
var allowExt = map[string]bool{".pdf": true}
// กันชื่อไฟล์แปลก ๆ เวลาใส่ header
var reUnsafe = regexp.MustCompile(`[^a-zA-Z0-9._-]`)


// === Types/Interfaces ===

type registerReq struct {
	BookPath     string `json:"book_path" binding:"required"`
	CurriculumID string `json:"curriculum_id" binding:"required"`
}


// === Utils ===

// ทำความสะอาดชื่อไฟล์ไว้ใส่ใน Content-Disposition
func sanitizeName(name string) string {
	base := filepath.Base(name) // ตัด path ทิ้ง เหลือชื่อไฟล์
	return reUnsafe.ReplaceAllString(base, "_") // แทนตัวอักษรไม่ปลอดภัย
}

// กันผูกไฟล์กับหลักสูตรที่ไม่มีอยู่จริง
func ensureCurriculumExists(db *gorm.DB, curriculumID string) error {
	if strings.TrimSpace(curriculumID) == "" {
		return errors.New("curriculum_id is required")
	}
	var cur entity.Curriculum
	if err := db.First(&cur, "curriculum_id = ?", curriculumID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("invalid curriculum_id")
		}
		return err
	}
	return nil
}

// เก็บ path ให้สะอาด ป้องกัน "..." และ '...' และ .. traversal
func normalizePath(p string) string {
	p = strings.TrimSpace(p)           // ตัดช่องว่างหัวท้าย
	p = strings.Trim(p, `"'`)          // ตัด quote ออก
	return filepath.Clean(p)           // normalize path
}


// === Handlers ===

func GetCurriculumBooks(c *gin.Context) {
	db := config.DB() // ต่อ DB
	var rows []entity.CurriculumBook

	// โหลดลิสต์หนังสือ เรียงใหม่สุดก่อน
	q := db.Order("id desc")
	// ถ้าส่ง curriculum_id มาก็กรองให้
	if cid := strings.TrimSpace(c.Query("curriculum_id")); cid != "" {
		q = q.Where("curriculum_id = ?", cid) // กรองด้วย curriculum_id
	}
	// ดึงข้อมูล
	if err := q.Find(&rows).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// รูปแบบตอบกลับสั้น ๆ สำหรับตาราง
	type resp struct {
		ID           int    `json:"id"`
		BookPath     string `json:"book_path"`
		CurriculumID string `json:"curriculum_id"`
	}

	// map ออกเป็น JSON พร้อมใช้
	out := make([]resp, 0, len(rows))
	for _, r := range rows {
		out = append(out, resp{
			ID:           r.ID,
			BookPath:     r.BookPath,
			CurriculumID: r.CurriculumID,
		})
	}

	// ส่งกลับลิสต์ทั้งหมด
	c.JSON(http.StatusOK, out)
}

func GetCurriculumBookByID(c *gin.Context) {
	id := c.Param("id") // รับพารามิเตอร์จาก path
	db := config.DB()

	// หาเรคคอร์ดตาม id
	var row entity.CurriculumBook
	if err := db.First(&row, "id = ?", id).Error; err != nil {
		// ไม่เจอ → 404
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		// อื่น ๆ → 400
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ส่งรายละเอียดกลับ
	c.JSON(http.StatusOK, gin.H{
		"id":            row.ID,
		"book_path":     row.BookPath,
		"curriculum_id": row.CurriculumID,
	})
}

func RegisterCurriculumBookByPath(c *gin.Context) {
	db := config.DB() // ต่อ DB

	// อ่าน JSON ที่ส่งมา
	var req registerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// เก็บ path ให้สะอาดก่อนใช้
	req.BookPath = normalizePath(req.BookPath)

	// เช็คว่า curriculum_id มีจริง
	if err := ensureCurriculumExists(db, req.CurriculumID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจนามสกุลไฟล์
	ext := strings.ToLower(filepath.Ext(req.BookPath))
	if !allowExt[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only .pdf is allowed"})
		return
	}

	// เช็คว่ามีไฟล์จริงในเครื่องไหม (ใช้แค่ flag แจ้งกลับ)
	_, statErr := os.Stat(req.BookPath)
	fileExists := statErr == nil // true = มีไฟล์

	var created entity.CurriculumBook
	// ทำงานแบบธุรกรรม: สร้าง record + อัปเดต book_id ใน curriculum
	if err := db.Transaction(func(tx *gorm.DB) error {
		// ใส่บันทึกใหม่
		created = entity.CurriculumBook{
			BookPath:     req.BookPath,
			CurriculumID: req.CurriculumID,
		}
		if err := tx.Create(&created).Error; err != nil {
			return err
		}
		// ผูก book_id กับหลักสูตร
		if err := tx.Model(&entity.Curriculum{}).
			Where("curriculum_id = ?", req.CurriculumID).
			Update("book_id", created.ID).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "register failed"})
		return
	}

	// ตอบกลับสำเร็จ พร้อมสถานะไฟล์ว่ามีจริงไหม
	c.JSON(http.StatusOK, gin.H{
		"message":       "register success",
		"id":            created.ID,
		"book_path":     created.BookPath,
		"curriculum_id": created.CurriculumID,
		"file_exists":   fileExists,
	})
}

func PreviewCurriculumBook(c *gin.Context) {
	id := c.Param("id") // รับ id
	db := config.DB()

	// หาเรคคอร์ดก่อน
	var row entity.CurriculumBook
	if err := db.First(&row, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เช็คว่ามีไฟล์ในดิสก์จริงไหม
	if _, err := os.Stat(row.BookPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":     "file not found on server",
			"book_path": row.BookPath,
		})
		return
	}

	// อนุญาตพรีวิวเฉพาะ PDF
	if strings.ToLower(filepath.Ext(row.BookPath)) != ".pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only .pdf preview supported"})
		return
	}

	// ตั้ง header ให้เปิดในเบราว์เซอร์ (inline)
	filename := sanitizeName(filepath.Base(row.BookPath)) // กันชื่อไฟล์แปลก
	mtype := mime.TypeByExtension(".pdf")
	if mtype == "" {
		mtype = "application/pdf"
	}

	c.Header("Content-Type", mtype) // บอกว่าคือ PDF
	c.Header("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, filename)) // เปิดในแท็บ
	c.File(row.BookPath) // ส่งไฟล์ออก
}

func DownloadCurriculumBook(c *gin.Context) {
	id := c.Param("id") // รับ id
	db := config.DB()

	// ดึงเรคคอร์ด
	var row entity.CurriculumBook
	if err := db.First(&row, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// เช็คไฟล์ในดิสก์
	if _, err := os.Stat(row.BookPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found on server", "book_path": row.BookPath})
		return
	}

	// ตั้ง header ให้เป็นดาวน์โหลด
	filename := sanitizeName(filepath.Base(row.BookPath))
	c.Header("Content-Type", "application/octet-stream") // บังคับดาวน์โหลด
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.File(row.BookPath) // ส่งไฟล์
}

func DeleteCurriculumBook(c *gin.Context) {
	id := c.Param("id") // รับ id
	db := config.DB()

	// หาเรคคอร์ดก่อนจะลบ
	var row entity.CurriculumBook
	if err := db.First(&row, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ยกเลิกผูก book_id ออกจาก curriculum แล้วค่อยลบ record
	if err := db.Transaction(func(tx *gorm.DB) error {
		// ถ้า curriculum ชี้มาเราคนนี้อยู่ ให้เคลียร์เป็น 0
		if err := tx.Model(&entity.Curriculum{}).
			Where("curriculum_id = ? AND book_id = ?", row.CurriculumID, row.ID).
			Update("book_id", 0).Error; err != nil {
			return err
		}
		// ลบ record หนังสือ (soft delete ถ้า model รองรับ)
		if err := tx.Delete(&row).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ตอบว่าเรียบร้อย
	c.JSON(http.StatusOK, gin.H{"message": "book deleted"})
}