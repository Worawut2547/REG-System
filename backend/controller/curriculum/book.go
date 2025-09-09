// ======================================================================
// curriculum/books_controller.go — register by path (no upload)
// - ตารางกลาง: curriculum_books { id, book_path, curriculum_id }
// - เปลี่ยนจาก upload -> รับ path จากผู้ใช้แล้วบันทึกตรง
// - ผูก book_id กลับไปที่ตาราง curriculum (อัปเดต Curriculum.BookID)
// - Endpoints:
//     GET    /curriculum-books                (optional: ?curriculum_id=...)
//     GET    /curriculum-books/:id
//     POST   /curriculum-books/register       (json: {book_path, curriculum_id})
//     GET    /curriculum-books/preview/:id    (inline preview PDF)
//     GET    /curriculum-books/download/:id   (download file)
//     DELETE /curriculum-books/:id            (ลบเฉพาะ row; ไม่ลบไฟล์จริง)
// ======================================================================

package curriculum

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

// =============================================================
// 1) Config
// =============================================================

// จำกัดนามสกุลไฟล์ (รองรับเฉพาะ .pdf)
var allowExt = map[string]bool{".pdf": true}

var reUnsafe = regexp.MustCompile(`[^a-zA-Z0-9._-]`)

// =============================================================
// 2) Helpers
// =============================================================

func sanitizeName(name string) string {
	base := filepath.Base(name)
	return reUnsafe.ReplaceAllString(base, "_")
}

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

// normalize/clean path จาก payload (trim space/quote แล้ว Clean)
func normalizePath(p string) string {
	p = strings.TrimSpace(p)
	p = strings.Trim(p, `"'`)
	return filepath.Clean(p)
}

// =============================================================
// 3) Handlers
// =============================================================

// GET /curriculum-books?curriculum_id=...
func GetCurriculumBooks(c *gin.Context) {
	db := config.DB()

	var rows []entity.CurriculumBook
	q := db.Order("id desc")
	if cid := strings.TrimSpace(c.Query("curriculum_id")); cid != "" {
		q = q.Where("curriculum_id = ?", cid)
	}
	if err := q.Find(&rows).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	type resp struct {
		ID           int    `json:"id"`
		BookPath     string `json:"book_path"`
		CurriculumID string `json:"curriculum_id"`
	}
	out := make([]resp, 0, len(rows))
	for _, r := range rows {
		out = append(out, resp{ID: r.ID, BookPath: r.BookPath, CurriculumID: r.CurriculumID})
	}
	c.JSON(http.StatusOK, out)
}

// GET /curriculum-books/:id
func GetCurriculumBookByID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()
	var row entity.CurriculumBook
	if err := db.First(&row, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"id": row.ID, "book_path": row.BookPath, "curriculum_id": row.CurriculumID})
}

// ----------------------------------------------------------------------
// POST /curriculum-books/register
// รับ JSON: {"book_path": "C:\\...\\banana.pdf", "curriculum_id": "CURR-2025-CS"}
// - บันทึก row ลง curriculum_books (ไม่บังคับว่าต้องมีไฟล์จริง ณ ตอนนี้)
// - อัปเดต Curriculum.BookID = id ของเล่มที่เพิ่งสร้าง
// ----------------------------------------------------------------------
type registerReq struct {
	BookPath     string `json:"book_path" binding:"required"`
	CurriculumID string `json:"curriculum_id" binding:"required"`
}

func RegisterCurriculumBookByPath(c *gin.Context) {
	db := config.DB()

	var req registerReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// normalize path + validate basic
	req.BookPath = normalizePath(req.BookPath)

	if err := ensureCurriculumExists(db, req.CurriculumID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ext := strings.ToLower(filepath.Ext(req.BookPath))
	if !allowExt[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only .pdf is allowed"})
		return
	}

	// เดิม: บังคับให้ไฟล์ต้องมี -> ทำให้ 400
	// ใหม่: เก็บ path ได้เลย และบอก file_exists กลับไปเพื่อ debug
	_, statErr := os.Stat(req.BookPath)
	fileExists := statErr == nil

	var created entity.CurriculumBook
	if err := db.Transaction(func(tx *gorm.DB) error {
		created = entity.CurriculumBook{
			BookPath:     req.BookPath,
			CurriculumID: req.CurriculumID,
		}
		if err := tx.Create(&created).Error; err != nil {
			return err
		}
		// อัปเดต book_id ของหลักสูตรให้ชี้มาที่เล่มนี้
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

	c.JSON(http.StatusOK, gin.H{
		"message":       "register success",
		"id":            created.ID,
		"book_path":     created.BookPath,
		"curriculum_id": created.CurriculumID,
		"file_exists":   fileExists, // บอกสถานะไฟล์ให้ฝั่ง FE ทราบ
	})
}

// ----------------------------------------------------------------------
// GET /curriculum-books/preview/:id
// เปิดดู PDF แบบ inline บนเบราว์เซอร์
// ----------------------------------------------------------------------
func PreviewCurriculumBook(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var row entity.CurriculumBook
	if err := db.First(&row, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ถ้าไฟล์ยังไม่อยู่ ให้แจ้ง 404 ชัดเจน
	if _, err := os.Stat(row.BookPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error":     "file not found on server",
			"book_path": row.BookPath,
		})
		return
	}

	if strings.ToLower(filepath.Ext(row.BookPath)) != ".pdf" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "only .pdf preview supported"})
		return
	}

	filename := sanitizeName(filepath.Base(row.BookPath))
	mtype := mime.TypeByExtension(".pdf")
	if mtype == "" {
		mtype = "application/pdf"
	}

	c.Header("Content-Type", mtype)
	c.Header("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, filename))
	c.File(row.BookPath)
}

// GET /curriculum-books/download/:id
func DownloadCurriculumBook(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()
	var row entity.CurriculumBook
	if err := db.First(&row, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if _, err := os.Stat(row.BookPath); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found on server", "book_path": row.BookPath})
		return
	}

	filename := sanitizeName(filepath.Base(row.BookPath))
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.File(row.BookPath)
}

// DELETE /curriculum-books/:id
// หมายเหตุ: ในโหมด “อ้างอิง path ภายนอก” แนะนำ **ไม่ลบไฟล์จริง**
// จะลบเฉพาะ row และเคลียร์ Curriculum.BookID ถ้าชี้มาที่แถวนี้
func DeleteCurriculumBook(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var row entity.CurriculumBook
	if err := db.First(&row, "id = ?", id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "book not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		// ถ้า Curriculum.BookID อ้างเล่มนี้ ให้เคลียร์เป็น 0
		if err := tx.Model(&entity.Curriculum{}).
			Where("curriculum_id = ? AND book_id = ?", row.CurriculumID, row.ID).
			Update("book_id", 0).Error; err != nil {
			return err
		}
		if err := tx.Delete(&row).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ไม่ลบไฟล์จริง
	c.JSON(http.StatusOK, gin.H{"message": "book deleted"})
}