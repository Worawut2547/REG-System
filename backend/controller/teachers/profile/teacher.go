package teachers

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

// Get Teacher by ID
func GetTeacherID (c *gin.Context){
	tid := c.Param("id")

	teacher := new(entity.Teachers)
	db := config.DB()

	result := db.First(&teacher , "teacher_id = ?" , tid)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
        return	
	}

	c.JSON(http.StatusOK , teacher)
}

// Create Teacher
func CreateTeacher (c *gin.Context){
	teacher := new(entity.Teachers)
	if err := c.ShouldBind(&teacher); err != nil {
		c.JSON(http.StatusBadRequest , gin.H{"error": err.Error()})
		return
	}
	db := config.DB()

	result := db.Create(&teacher)
	
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}
	// เพิ่ม รหัสอาจารย์ , เลขบัตรปชช ลงตาราง Users หลังเพิ่มข้อมูลอาจรย์เเล้ว
	hashPassword , _ := config.HashPassword(teacher.Citizen_id)
	user := &entity.Users{
		Username: teacher.Teacher_id, // ดึงรหัสอาจารย์ออกมา
		Password: hashPassword,
		Role: "teacher", //กำหนด Role
	}
	if err := db.Create(&user).Error; err != nil{
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK , gin.H{
		"message": "Create teacher success",
		"Teacher_id": teacher.Teacher_id,
		"FirstName": teacher.FirstName,
		"LastName": teacher.LastName,
	})
}