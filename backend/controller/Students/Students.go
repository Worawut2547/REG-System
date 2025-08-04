package students

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetStudents(c *gin.Context) {
	var students []entity.Students
	if err := config.DB().Find(&students).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch students"})
		return
	}
	c.JSON(http.StatusOK, students)
}

func CreateStudent(c *gin.Context) {
	var student entity.Students
	if err := c.ShouldBindJSON(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	if err := config.DB().Create(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create student"})
		return
	}
	c.JSON(http.StatusCreated, student)
}

func UpdateStudent(c *gin.Context) {
	var student entity.Students
	if err := c.ShouldBindJSON(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}
	if err := config.DB().Save(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update student"})
		return
	}
	c.JSON(http.StatusOK, student)
}

func DeleteStudent(c *gin.Context) {
	var student entity.Students
	if err := config.DB().Where("student_id = ?", c.Param("id")).First(&student).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		return
	}
	if err := config.DB().Delete(&student).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete student"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Student deleted successfully"})
}
