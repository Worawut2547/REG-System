package faculty

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetFacultyAll(c *gin.Context) {
	var faculty []entity.Faculty
	db := config.DB()
	if err := db.
		Preload("Majors").
		Find(&faculty).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get faculty"})
		return
	}

	c.JSON(http.StatusOK, faculty)
}

func CreateFaculty(c *gin.Context) {
	faculty := new(entity.Faculty)

	if err := c.ShouldBind(&faculty); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.FirstOrCreate(&faculty)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, faculty)
}
