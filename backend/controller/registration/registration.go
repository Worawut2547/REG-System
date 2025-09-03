package registration

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"reg_system/config"
	"reg_system/entity"
	"reg_system/services"
)

// POST /api/registrations
func CreateRegistration(c *gin.Context) {
	var payload entity.Registration
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if payload.Date.IsZero() {
		payload.Date = time.Now()
	}
	svc := services.RegistrationService{DB: config.DB()}
	if err := svc.Create(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Create registration success"})
}

// POST /api/registrations/bulk
type bulkReq struct {
	StudentID string                `json:"student_id" binding:"required"`
	Items     []entity.Registration `json:"items"       binding:"required,min=1,dive"`
}
func CreateRegistrationBulk(c *gin.Context) {
	var req bulkReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	svc := services.RegistrationService{DB: config.DB()}
	if err := svc.CreateBulk(req.StudentID, req.Items); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Create registrations success", "count": len(req.Items)})
}

// GET /api/registrations?student_id=
func GetRegistrationAll(c *gin.Context) {
    studentID := c.Query("student_id")
    svc := services.RegistrationService{DB: config.DB()}
    rows, err := svc.FindAll(studentID)
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }
    // คืน 200 พร้อม [] กรณีไม่มีข้อมูล เพื่อให้ฝั่งเว็บโหลดหน้าได้
    c.JSON(http.StatusOK, rows)
}

// GET /api/registrations/:id
func GetRegistrationByID(c *gin.Context) {
	id := c.Param("id")
	svc := services.RegistrationService{DB: config.DB()}
	row, err := svc.FindByRegID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		return
	}
	c.JSON(http.StatusOK, row)
}

// PUT /api/registrations/:id
func UpdateRegistration(c *gin.Context) {
	id := c.Param("id")
	var patch entity.Registration
	if err := c.ShouldBindJSON(&patch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	svc := services.RegistrationService{DB: config.DB()}
	if err := svc.UpdateByRegID(id, patch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Registration updated successfully"})
}

// DELETE /api/registrations/:id
func DeleteRegistration(c *gin.Context) {
	id := c.Param("id")
	svc := services.RegistrationService{DB: config.DB()}
	if err := svc.DeleteByRegID(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Registration deleted successfully"})
}
