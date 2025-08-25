package subject
import (
	"reg_system/config"
	"reg_system/entity"
	"net/http"
	"github.com/gin-gonic/gin"
)
func CreateSubject(c *gin.Context) {
	subject := new(entity.Subject)

	if err := c.ShouldBind(&subject); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Create(&subject)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Create subject success"})
}
func GetSubjectAll(c *gin.Context) {
	var subjects []entity.Subject
	db := config.DB()

	result := db.Find(&subjects)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No subjects found"})
		return
	}

	c.JSON(http.StatusOK, subjects)
}
func GetSubjectByID(c *gin.Context) {
	id := c.Param("id")
	var subject entity.Subject
	db := config.DB()

	result := db.First(&subject, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, subject)
}
func UpdateSubject(c *gin.Context) {
	id := c.Param("id")
	var subject entity.Subject

	if err := c.ShouldBind(&subject); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Model(&subject).Where("id = ?", id).Updates(subject)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subject not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Update subject success"})
}
func DeleteSubject(c *gin.Context) {
	id := c.Param("id")
	var subject entity.Subject
	db := config.DB()

	result := db.First(&subject, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Subject not found"})
		return
	}

	result = db.Delete(&subject)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delete subject success"})
}

