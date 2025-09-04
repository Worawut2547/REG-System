package bill

import (
	"log"
	"net/http"
	"reg_system/config"
	"reg_system/entity"
	"reg_system/services"
	"time"

	"github.com/gin-gonic/gin"
)

// ใช้สำหรับ GetBillByStudentID
//----------------------------------------------------
type BillResponse struct {
    ID         int              `json:"id"`
    TotalPrice int               `json:"total_price"`
    Subjects   []SubjectResponse `json:"subjects"`
}

type SubjectResponse struct {
    SubjectID   string `json:"subject_id"`
    SubjectName string `json:"subject_name"`
    Credit      int    `json:"credit"`
}
//----------------------------------------------------

func GetBillByStudentID(c *gin.Context) {
	id := c.Param("id")
	var bill entity.Bill
	db := config.DB()

	result := db.Preload("Student").
		Preload("Student.Registration").
		Preload("Student.Registration.Subject").
		First(&bill, "student_id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// map subject
	subjects := []SubjectResponse{}
	for _,reg := range bill.Student.Registration {
		if reg.Subject != nil {
			subjects = append(subjects , SubjectResponse{
				SubjectID: reg.SubjectID,
				SubjectName: reg.Subject.SubjectName,
				Credit: reg.Subject.Credit,
			})
		}
	}

	response := BillResponse {
		ID: bill.ID,
		TotalPrice: bill.TotalPrice,
		Subjects: subjects,

	}
	c.JSON(http.StatusOK, response)
}

func CreateBill(c *gin.Context) {
	sid := c.Param("id")
	db := config.DB()

	// ดึง Registration ของนักศึกษาพร้อม Subject
	var registration []entity.Registration
	err := db.Preload("Subject").Find(&registration, "student_id = ?", sid)
	if err.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "not found student"})
		return
	}

	if len(registration) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no registration found for this student"})
		return
	}

	// เเปลง registration เป็น Subject สำหรับ services
	subjects := []services.Subject{}
	for _, reg := range registration {
		subjects = append(subjects, services.Subject{
			SubjectID:   reg.SubjectID,
			SubjectName: reg.Subject.SubjectName,
			Credit:      reg.Subject.Credit,
		})
	}
	log.Println("subject:",subjects)

	// คำนวณ TotalPrice
	// กำหนดราคาหน่วยกิตละ 800 บาท
	ratePerCredit := 800
	totalPrice := services.CalculateTotalPrice(subjects, ratePerCredit)

	// สร้าง bill
	bill := &entity.Bill{
		StudentID:  sid,
		Date:       time.Now(),
		TotalPrice: totalPrice,
	}

	/*if err := c.ShouldBind(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}*/
	result := db.Create(&bill)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, bill)
}

func GetBills(c *gin.Context) {
	var bills []entity.Bill
	db := config.DB()
	if err := db.
		Preload("Registration").
		Preload("Registration.Student").
		Find(&bills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, bills)
}


func UpdateBill(c *gin.Context) {
	id := c.Param("id")
	var bill entity.Bill

	if err := c.ShouldBind(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Model(&bill).Where("id = ?", id).Updates(bill)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Update bill success"})
}
func DeleteBill(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	result := db.Delete(&entity.Bill{}, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bill not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delete bill success"})
}

