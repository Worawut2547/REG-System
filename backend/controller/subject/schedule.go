package subject

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetScheduleAll(c *gin.Context) {
	var schedules []entity.SubjectSchedules
	db := config.DB()

	result := db.Preload("DayOfWeek").
		Preload("Subject").
		Find(&schedules)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
		return
	}

	c.JSON(http.StatusOK , schedules)
}