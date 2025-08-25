package subject

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetSubjectAll(c *gin.Context) {
	var subject []entity.Subject
	db := config.DB()

	result := db.Preload("Major").
		Preload("Faculty").
		Preload("Semester").
		Preload("Grade").
		Preload("SubjectSchedules.DayOfWeek").
		Find(&subject)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "subject not found"})
		return
	}

	c.JSON(http.StatusOK , subject)
}

func CreateSubject (c *gin.Context){
	subject := new(entity.Subject)

	if err := c.ShouldBind(&subject); err != nil{
		c.JSON(http.StatusBadRequest , gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Create(&subject)
	if result.Error != nil {
		c.JSON(http.StatusNotFound , gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK , subject)
}


