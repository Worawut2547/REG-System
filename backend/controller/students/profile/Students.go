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
	hashPassword , _ := config.HashPassword(student.Citizen_id)
	user := &entity.Users{
		Username: student.Student_id, // ดึงรหัสนักศึกษาออกมา
		Password: hashPassword,
		Role: "student", //กำหนด Role
	}
	if err := db.Create(&user).Error; err != nil{
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK , gin.H{
		"message": "Create student success",
		"Student_id": student.Student_id,
		"FirstName": student.FirstName,
		"LastName": student.LastName,
	})
}

func GetStudentAll (c *gin.Context){
	var students []entity.Students
	db := config.DB()

	results := db.Find(&students)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	if results.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
        return	
	}

	c.JSON(http.StatusOK , students)
}

/*func CreateStudent(c *gin.Context) {
	student := new(entity.Students)
	if err := c.ShouldBind(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// 👉 Step 1: ตรวจสอบก่อนว่ามี username นี้ใน Users แล้วหรือยัง
	var existingUser entity.Users
	if err := db.Where("username = ?", student.Student_id).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Student ID already exists in Users table"})
		return
	}

	// 👉 Step 2: สร้าง password จากเลขบัตร
	hashPassword, err := config.HashPassword(student.Citizen_id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// 👉 Step 3: สร้าง transaction เพื่อความปลอดภัย
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 👉 Step 4: Insert ลงตาราง Students
	if err := tx.Create(&student).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create student"})
		return
	}

	// 👉 Step 5: Insert ลงตาราง Users
	user := &entity.Users{
		Username: student.Student_id,
		Password: hashPassword,
		Role:     "student",
	}
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user (possibly duplicate username)"})
		return
	}

	// 👉 Step 6: Commit transaction
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Create student success",
		"Student_id": student.Student_id,
		"FirstName":  student.FirstName,
		"LastName":   student.LastName,
	})
}*/
