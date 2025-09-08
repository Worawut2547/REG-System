package bill

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"reg_system/config"
	"reg_system/entity"
	"reg_system/services"

	"github.com/gin-gonic/gin"
)

// ======================================================
// 1) Response DTOs
// ======================================================

type BillResponse struct {
	ID         int               `json:"id"`
	TotalPrice int               `json:"total_price"`
	Subjects   []SubjectResponse `json:"subjects"`
	Status     string            `json:"status"`
	FilePath   string            `json:"file_path,omitempty"`
	Year       int               `json:"year,omitempty"`
	Term       int               `json:"term,omitempty"`
}

type SubjectResponse struct {
	SubjectID    string `json:"subject_id"`
	SubjectName  string `json:"subject_name"`
	Credit       int    `json:"credit"`
	Term         int    `json:"term"`
	AcademicYear int    `json:"academic_year"`
}

// ======================================================
// 2) Handlers
// ======================================================

// GET /bills/:id - ดึงบิลนักเรียน
func GetBillByStudentID(c *gin.Context) {
	id := c.Param("id")
	var bill entity.Bill
	db := config.DB()

	if err := db.Preload("Student.Registration.Subject.Semester").
		Preload("Status").
		First(&bill, "student_id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bill not found"})
		return
	}

	subjects := []SubjectResponse{}
	for _, reg := range bill.Student.Registration {
		if reg.Subject != nil && reg.Subject.Semester != nil {
			subjects = append(subjects, SubjectResponse{
				SubjectID:    reg.SubjectID,
				SubjectName:  reg.Subject.SubjectName,
				Credit:       reg.Subject.Credit,
				Term:         reg.Subject.Semester.Term,
				AcademicYear: reg.Subject.Semester.AcademicYear,
			})
		}
	}

	status := "-"
	if bill.Status != nil {
		status = bill.Status.Status
	}

	year := 0
	term := 0
	if len(bill.Student.Registration) > 0 && bill.Student.Registration[0].Subject.Semester != nil {
		year = bill.Student.Registration[0].Subject.Semester.AcademicYear
		term = bill.Student.Registration[0].Subject.Semester.Term
	}

	resp := BillResponse{
		ID:         bill.ID,
		TotalPrice: bill.TotalPrice,
		Subjects:   subjects,
		Status:     status,
		FilePath:   bill.FilePath,
		Year:       year,
		Term:       term,
	}

	c.JSON(http.StatusOK, resp)
}

// POST /bills/:id/create - สร้างบิลใหม่จาก registration
func CreateBill(c *gin.Context) {
	studentID := c.Param("id")
	db := config.DB()

	var regs []entity.Registration
	if err := db.Preload("Subject").Preload("Subject.Semester").Find(&regs, "student_id = ?", studentID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch registrations"})
		return
	}

	if len(regs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no registration found"})
		return
	}

	var subjects []services.Subject
	for _, reg := range regs {
		if reg.Subject != nil {
			subjects = append(subjects, services.Subject{
				SubjectID:   reg.SubjectID,
				SubjectName: reg.Subject.SubjectName,
				Credit:      reg.Subject.Credit,
			})
		}
	}

	ratePerCredit := 800
	totalPrice := services.CalculateTotalPrice(subjects, ratePerCredit)

	bill := entity.Bill{
		StudentID:  studentID,
		Date:       time.Now(),
		TotalPrice: totalPrice,
		StatusID:   1, // 1 = ยังไม่ชำระเงิน
	}

	if err := db.Create(&bill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create bill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "bill created",
		"bill_id": bill.ID,
		"status":  "ยังไม่ชำระเงิน",
	})
}

// POST /bills/upload/:id - นักเรียนอัปโหลดใบเสร็จ
func UploadReceipt(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var bill entity.Bill
	if err := db.First(&bill, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bill not found"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file not found"})
		return
	}

	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create upload folder"})
		return
	}

	timestamp := time.Now().Format("20060102150405")
	fileName := fmt.Sprintf("%s_%s", timestamp, file.Filename)
	filePath := filepath.Join(uploadDir, fileName)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// อัปเดต bill: FilePath + StatusID = 2 (รอตรวจสอบ)
	if err := db.Model(&bill).Updates(map[string]interface{}{
		"FilePath": fileName, // เก็บเฉพาะชื่อไฟล์
		"StatusID": 2,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update bill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "upload success",
		"file_path": fileName,
		"status":    "รอตรวจสอบ",
	})
}

// PUT /bills/admin/update/:id - แอดมินตรวจสอบบิลแล้วอัปเดทสถานะ
func AdminUpdateBillStatus(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var req struct {
		StatusID int `json:"status_id" binding:"required"` // 3 = ชำระเงินแล้ว
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	var bill entity.Bill
	if err := db.First(&bill, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bill not found"})
		return
	}

	if err := db.Model(&bill).Update("StatusID", req.StatusID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "status updated",
		"status":  req.StatusID,
	})
}

// GET /bills/admin/all - ดึงบิลทั้งหมด สำหรับแอดมิน
func GetAllBills(c *gin.Context) {
	db := config.DB()

	var bills []entity.Bill
	if err := db.Preload("Student.Registration.Subject.Semester").
		Preload("Status").Find(&bills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch bills"})
		return
	}

	type AdminBill struct {
		ID         int    `json:"id"`
		StudentID  string `json:"student_id"`
		FullName   string `json:"full_name"`
		TotalPrice int    `json:"total_price"`
		Status     string `json:"status"`
		FilePath   string `json:"file_path,omitempty"`
		Date       string `json:"date"`
		Year       int    `json:"year"`
		Term       int    `json:"term"`
	}

	var resp []AdminBill
	for _, bill := range bills {
		fullName := "-"
		status := "-"
		year := 0
		term := 0
		if bill.Student != nil {
			fullName = bill.Student.FirstName + " " + bill.Student.LastName
			if len(bill.Student.Registration) > 0 && bill.Student.Registration[0].Subject.Semester != nil {
				year = bill.Student.Registration[0].Subject.Semester.AcademicYear
				term = bill.Student.Registration[0].Subject.Semester.Term
			}
		}
		if bill.Status != nil {
			status = bill.Status.Status
		}
		resp = append(resp, AdminBill{
			ID:         bill.ID,
			StudentID:  bill.StudentID,
			FullName:   fullName,
			TotalPrice: bill.TotalPrice,
			Status:     status,
			FilePath:   bill.FilePath,
			Date:       bill.Date.Format("2006-01-02"),
			Year:       year,
			Term:       term,
		})
	}

	c.JSON(http.StatusOK, resp)
}

// GET /bills/preview/:id - เปิด PDF inline

func ShowFile (c *gin.Context) {
	filename := c.Param("id")
	filePath := fmt.Sprintf("./uploads/%s", filename)

	if _,err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	c.File(filePath)
}

// GET /bills/download/:id - ดาวน์โหลด PDF
func DownloadBill(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var bill entity.Bill
	if err := db.First(&bill, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bill not found"})
		return
	}

	if bill.FilePath == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not uploaded"})
		return
	}

	path := filepath.Join("./uploads", bill.FilePath)
	if _, err := os.Stat(path); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filepath.Base(path)))
	c.File(path)
}

// ======================================================
// 6) Register routes (ใน main.go / router)
// ======================================================
// r.Static("/uploads", "./uploads")
// billGroup := r.Group("/bills") {
//   billGroup.GET("/:id", GetBillByStudentID)
//   billGroup.POST("/:id/create", CreateBill)
//   billGroup.POST("/upload/:id", UploadReceipt)
//   billGroup.PUT("/admin/update/:id", AdminUpdateBillStatus)
//   billGroup.GET("/admin/all", GetAllBills)
//   billGroup.GET("/preview/:id", PreviewBill)
//   billGroup.GET("/download/:id", DownloadBill)
// }
