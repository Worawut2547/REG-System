package students

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetStudentID (c *gin.Context){
	sid := c.Param("id")

	student := new(entity.Students)
	db := config.DB()

	result := db.First(&student , "student_id = ?" , sid)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
        return	
	}

	c.JSON(http.StatusOK , student)
}

func CreateStudent (c *gin.Context){
	student := new(entity.Students)
	if err := c.ShouldBind(&student); err != nil {
		c.JSON(http.StatusBadRequest , gin.H{"error": err.Error()})
		return
	}
	db := config.DB()

	result := db.Create(&student)
	
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}
	// เพิ่ม รหัสนักศึกษา , เลขบัตรปชช ลงตาราง Users หลังเพิ่มข้อมูลนักเรียนเเล้ว
	hashPassword , _ := config.HashPassword(student.CitizenID)
	user := &entity.Users{
		Username: student.StudentID, // ดึงรหัสนักศึกษาออกมา
		Password: hashPassword,
		Role: "student", //กำหนด Role
	}
	if err := db.Create(&user).Error; err != nil{
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK , gin.H{
		"message": "Create student success",
		"Student_id": student.StudentID,
		"FirstName": student.FirstName,
		"LastName": student.LastName,
	})
}