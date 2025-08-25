package curriculum

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"reg_system/config"
	"reg_system/entity"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

const (
	// ควรกำหนดจาก ENV/Config
	uploadBaseDir = "../../uploads/curriculums"
	publicBaseURL = "/static/curriculums" // เสิร์ฟผ่าน Static middleware เช่น r.Static("/static", "../../uploads")
	maxUploadSize = 20 << 20              // 20MB
)

// GET /books
func GetBookPathAll(c *gin.Context) {
	var books []entity.BookPath
	db := config.DB()

	if err := db.Order("id desc").Find(&books).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, books)
}

// GET /books/:id
func GetBookPathByID(c *gin.Context) {
	id := c.Param("id")
	var book entity.BookPath

	db := config.DB()
	if err := db.First(&book, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, book)
}

// POST /books/upload  (form field: currBook)
func UploadBookFile(c *gin.Context) {
	// จำกัดขนาด
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadSize)

	file, err := c.FormFile("currBook")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no file received"})
		return
	}

	// ตรวจนามสกุล (ยอมรับ .pdf เท่านั้นเป็นตัวอย่าง)
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only .pdf is allowed"})
		return
	}

	// เตรียมไดเรกทอรี
	if err := os.MkdirAll(uploadBaseDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot prepare upload dir"})
		return
	}

	// ตั้งชื่อไฟล์ใหม่ด้วย UUID
	storedName := uuid.New().String() + ext
	fullPath := filepath.Join(uploadBaseDir, storedName)

	// เปิดไฟล์ปลายทาง
	dst, err := os.Create(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create file"})
		return
	}
	defer dst.Close()

	// เปิด src เพื่อคำนวณแฮช + ก๊อปปี้
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot open uploaded file"})
		return
	}
	defer src.Close()

	h := sha256.New()
	size, err := io.Copy(io.MultiWriter(dst, h), src)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save file"})
		return
	}
	checksum := hex.EncodeToString(h.Sum(nil))

	// เดา mime ตามนามสกุล (หรือจะใช้ http.DetectContentType เพิ่มก็ได้)
	mimeType := mime.TypeByExtension(ext)
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	// public path สำหรับเสิร์ฟไฟล์ (ตั้งค่า static route ใน router)
	publicPath := filepath.ToSlash(filepath.Join(publicBaseURL, storedName))

	book := &entity.BookPath{
		OriginalName: file.Filename,
		StoredName:   storedName,
		Path:         fullPath,
		PublicPath:   publicPath,
		MimeType:     mimeType,
		Size:         size,
		Checksum:     checksum,
	}

	db := config.DB()
	if err := db.Create(book).Error; err != nil {
		_ = os.Remove(fullPath) // rollback ไฟล์
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "file uploaded successfully",
		"book":    book,
	})
}

// GET /books/download/:id   — ดาวน์โหลดไฟล์ตาม id
func DownloadBookFile(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var book entity.BookPath
	if err := db.First(&book, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ถ้าอยากเปิดแทนดาวน์โหลด ให้ใช้ c.File(book.Path)
	c.Header("Content-Type", book.MimeType)
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, sanitizeForHeader(book.OriginalName)))
	c.File(book.Path)
}

// DELETE /books/:id   — ลบทั้ง DB และไฟล์บนดิสก์ (หรือจะ soft delete ก็ได้)
func DeleteBookFile(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var book entity.BookPath
	if err := db.First(&book, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ลบไฟล์จริงก่อน (ถ้าพลาด ควรตัดสินใจว่าจะยกเลิกหรือไปต่อ)
	_ = os.Remove(book.Path)

	// ลบแถว (soft delete ตาม gorm.DeletedAt)
	if err := db.Delete(&book).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "book deleted"})
}

// ป้องกันอักขระแปลกๆ ใน header
func sanitizeForHeader(name string) string {
	name = strings.ReplaceAll(name, "\n", "_")
	name = strings.ReplaceAll(name, "\r", "_")
	return name
}
