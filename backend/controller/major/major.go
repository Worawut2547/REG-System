package major

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"reg_system/config"
	"reg_system/entity"
)

func GetMajorAll(c *gin.Context) {
	var major []entity.Majors
	db := config.DB()
	if err := db.
		Preload("Faculty").
		Find(&major).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get major"})
		return
	}

	c.JSON(http.StatusOK, major)
}

func CreateMajor(c *gin.Context) {
	major := new(entity.Majors)

	if err := c.ShouldBind(&major); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.FirstOrCreate(&major)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, major)
}
