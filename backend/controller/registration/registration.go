package registration

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"
	"github.com/gin-gonic/gin"
)

func CreateRegistration(c *gin.Context) {
	registration := new(entity.Registration)

	if err := c.ShouldBind(&registration); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Create(&registration)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Create registration success"})
}
func GetRegistrationAll(c *gin.Context) {
	var registrations []entity.Registration
	db := config.DB()

	result := db.Find(&registrations)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No registrations found"})
		return
	}

	c.JSON(http.StatusOK, registrations)
}
func GetRegistrationByID(c *gin.Context) {
	id := c.Param("id")
	var registration entity.Registration
	db := config.DB()

	result := db.First(&registration, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, registration)
}
func UpdateRegistration(c *gin.Context) {
	id := c.Param("id")
	var registration entity.Registration
	db := config.DB()

	if err := db.First(&registration, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		return
	}

	if err := c.ShouldBind(&registration); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result := db.Save(&registration)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registration updated successfully"})
}
func DeleteRegistration(c *gin.Context) {
	id := c.Param("id")
	var registration entity.Registration
	db := config.DB()

	if err := db.First(&registration, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		return
	}

	result := db.Delete(&registration)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registration deleted successfully"})
}