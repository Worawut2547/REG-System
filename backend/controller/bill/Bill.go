package bill

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
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
	StatusMap  map[string]string `json:"status_map,omitempty"` // เพิ่ม map สถานะ
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
	studentID := c.Param("id")
	db := config.DB()

	var bills []entity.Bill
	// ดึงทุก bill ของ student พร้อม preload
	if err := db.Preload("Student.Registration.Subject.Semester").
		Preload("Status").
		Where("student_id = ?", studentID).
		Find(&bills).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bills not found"})
		return
	}

	type SubjectKey string
	subjectMap := map[SubjectKey]SubjectResponse{}
	statusMap := map[string]string{}
	filePathMap := map[string]string{}
	totalPriceMap := map[string]int{}

	for _, bill := range bills {
		status := "-"
		if bill.Status != nil {
			status = bill.Status.Status
		}

		year := bill.AcademicYear
		term := bill.Term
		key := fmt.Sprintf("%d-%d", year, term)

		// เก็บ filePath ต่อเทอม
		if bill.FilePath != "" {
			filePathMap[key] = bill.FilePath
		}

		// รวม totalPrice ต่อเทอม
		totalPriceMap[key] += bill.TotalPrice

		for _, reg := range bill.Student.Registration {
			if reg.Subject != nil && reg.Subject.Semester != nil {
				sKey := SubjectKey(fmt.Sprintf("%d-%d-%s", reg.Subject.Semester.AcademicYear, reg.Subject.Semester.Term, reg.SubjectID))
				if _, exists := subjectMap[sKey]; !exists {
					subjectMap[sKey] = SubjectResponse{
						SubjectID:    reg.SubjectID,
						SubjectName:  reg.Subject.SubjectName,
						Credit:       reg.Subject.Credit,
						Term:         reg.Subject.Semester.Term,
						AcademicYear: reg.Subject.Semester.AcademicYear,
					}
				}
				// เก็บ status per year-term
				statusMap[key] = status
			}
		}
	}

	// แปลง map เป็น slice
	subjects := []SubjectResponse{}
	for _, s := range subjectMap {
		subjects = append(subjects, s)
	}

	// กำหนด default year-term จากวิชาแรก
	defaultYear, defaultTerm := 0, 0
	if len(subjects) > 0 {
		defaultYear = subjects[0].AcademicYear
		defaultTerm = subjects[0].Term
	}

	resp := BillResponse{
		ID:         0, // สามารถใส่ ID ของ bill ล่าสุด หรือ 0
		TotalPrice: totalPriceMap[fmt.Sprintf("%d-%d", defaultYear, defaultTerm)],
		Subjects:   subjects,
		Status:     "-", // ไม่ใช้รวม status
		StatusMap:  statusMap,
		FilePath:   filePathMap[fmt.Sprintf("%d-%d", defaultYear, defaultTerm)],
		Year:       defaultYear,
		Term:       defaultTerm,
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

// POST /bills/upload/:id - นักเรียนอัปโหลดใบเสร็จ --รอดูตอนGET
func UploadReceipt(c *gin.Context) {
	studentID := c.Param("id")
	yearStr := c.Param("year")
	termStr := c.Param("term")
	db := config.DB()

	now := time.Now() //แก้ให้ส่งเวลาจริงเข้าไปในฐานข้อมูล

	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid year"})
		return
	}

	term, err := strconv.Atoi(termStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid term"})
		return
	}

	// หา Registration ของ student ตามปี/เทอม
	var registrations []entity.Registration
	if err := db.Preload("Subject.Semester").
		Where("student_id = ?", studentID).
		Find(&registrations).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "registrations not found"})
		return
	}

	var selectedRegs []entity.Registration
	for _, reg := range registrations {
		if reg.Subject != nil && reg.Subject.Semester != nil &&
			reg.Subject.Semester.AcademicYear == year &&
			reg.Subject.Semester.Term == term {
			selectedRegs = append(selectedRegs, reg)
		}
	}

	if len(selectedRegs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no registrations found for this year and term"})
		return
	}

	// หา Bill ของ student ปี/เทอมนี้ ถ้าไม่มีให้สร้างใหม่
	var bill entity.Bill
	if err := db.Where("student_id = ? AND academic_year = ? AND term = ?", studentID, year, term).First(&bill).Error; err != nil {
		// สร้าง bill ใหม่
		bill = entity.Bill{
			StudentID:    studentID,
			AcademicYear: year,
			Term:         term,
			Registration: selectedRegs,
		}
		if err := db.Create(&bill).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create bill"})
			return
		}
	} else {
		// ถ้ามีแล้ว อัปเดต Registration (กรณีเราต้องการเชื่อม)
		if err := db.Model(&bill).Association("Registration").Replace(selectedRegs); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update bill registrations"})
			return
		}
		if err := db.Model(&bill).Updates(map[string]interface{}{
			"Date": now, // ✅ เซ็ตวันอัปโหลดใหม่
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update bill date"})
			return
		}
	}

	// อัปโหลดไฟล์
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
		"FilePath": fileName,
		"StatusID": 2,
		"Date":     now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update bill"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "upload success",
		"file_path": fileName,
		"status":    "รอตรวจสอบ",
		"uploaded_at": now.Format("2006-01-02 15:04:05"), // ✅ ส่งเวลาให้ frontend
	})
}

// GET /bills/admin/all - ดึงบิลทั้งหมด สำหรับแอดมิน
func GetAllBills(c *gin.Context) {
	db := config.DB()

	var bills []entity.Bill
	if err := db.Preload("Registration.Subject.Semester").
		Preload("Student").
		Preload("Status").
		Find(&bills).Error; err != nil {
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

	ratePerCredit := 800 // ✅ เรทต่อหน่วยกิต
	resp := []AdminBill{}

	// สร้าง map เก็บข้อมูลแบบ student+year+term
	type BillKey struct {
		StudentID string
		Year      int
		Term      int
	}
	grouped := map[BillKey][]services.Subject{}
	statusMap := map[BillKey]string{}
	filePathMap := map[BillKey]string{}
	latestID := map[BillKey]int{}
	dateMap := map[BillKey]string{}
	nameMap := map[BillKey]string{}

	for _, bill := range bills {
		if bill.Student == nil {
			continue
		}

		fullName := bill.Student.FirstName + " " + bill.Student.LastName

		// ✅ ใช้ bill.Registration ไม่ใช่ Student.Registration
		for _, reg := range bill.Registration {
			if reg.Subject != nil && reg.Subject.Semester != nil {
				key := BillKey{
					StudentID: bill.StudentID,
					Year:      reg.Subject.Semester.AcademicYear,
					Term:      reg.Subject.Semester.Term,
				}
				// เก็บ subject
				grouped[key] = append(grouped[key], services.Subject{
					SubjectID:   reg.Subject.SubjectID,
					SubjectName: reg.Subject.SubjectName,
					Credit:      reg.Subject.Credit,
				})

				// เก็บค่าอื่น ๆ
				if bill.Status != nil {
					statusMap[key] = bill.Status.Status
				}
				if bill.FilePath != "" {
					filePathMap[key] = bill.FilePath
				}
				if existing, ok := latestID[key]; !ok || bill.ID > existing {
					latestID[key] = bill.ID
					dateMap[key] = bill.Date.Format("2006-01-02")
					nameMap[key] = fullName
				}
			}
		}
	}

	// ✅ แปลงเป็น response
	for key, subjects := range grouped {
		totalPrice := services.CalculateTotalPrice(subjects, ratePerCredit)
		resp = append(resp, AdminBill{
			ID:         latestID[key],
			StudentID:  key.StudentID,
			FullName:   nameMap[key],
			TotalPrice: totalPrice,
			Status:     statusMap[key],
			FilePath:   filePathMap[key],
			Date:       dateMap[key],
			Year:       key.Year,
			Term:       key.Term,
		})
	}

	c.JSON(http.StatusOK, resp)
}

// GET /bills/preview/:id - เปิด PDF inline

func ShowFile(c *gin.Context) {
	filename := c.Param("id")
	filePath := fmt.Sprintf("./uploads/%s", filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "file not found"})
		return
	}

	c.File(filePath)
}

// PUT /bills/status/:id
func UpdateBillStatus(c *gin.Context) {
	billID := c.Param("id")
	db := config.DB()

	var req struct {
		StatusID int `json:"status_id"` // แก้เป็น int
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	var bill entity.Bill
	if err := db.First(&bill, billID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bill not found"})
		return
	}

	bill.StatusID = req.StatusID // ตอนนี้ตรงชนิดแล้ว
	if err := db.Save(&bill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update bill status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "bill status updated",
		"bill_id": bill.ID,
		"status":  req.StatusID,
	})
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
