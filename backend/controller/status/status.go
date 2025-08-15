package status

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"
	"github.com/gin-gonic/gin"
)

func GetStatusStudentAll (c *gin.Context){
	var status []entity.StatusStudent
	db := config.DB()
	if err := db.Find(&status).Error; err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get status"})
		return
	}

	c.JSON(http.StatusOK , status)
}