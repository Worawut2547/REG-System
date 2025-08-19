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

func CreateStatus(c *gin.Context) {
	status := new(entity.StatusStudent)

	if err := c.ShouldBind(&status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.FirstOrCreate(&status)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &status)
}