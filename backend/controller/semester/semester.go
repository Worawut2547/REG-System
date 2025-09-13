package semester

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetSemesterAll (c *gin.Context){
	var semesters []entity.Semester
	db := config.DB()

	if err := db.Find(&semesters).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, semesters)
}