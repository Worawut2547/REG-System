package teachers

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

// Get Teacher by ID
func GetTeacherID(c *gin.Context) {
	tid := c.Param("id")

	teacher := new(entity.Teachers)
	db := config.DB()

	result := db.Preload("Gender").
		Preload("Faculty").
		Preload("Major").
		Preload("Position").
		First(&teacher, "teacher_id = ?", tid)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	// เอาค่า {Gender , FacultyName , MajorName , Position} ออกมาเเสดง
	genderName := ""
	facultyName := ""
	majorName := ""
	positionName := ""

	// Check filed ว่าเป็น nil หรือไม่ ก่อนเข้าถึง field นั้นโดยตรงไม่งั้นจะ error
	//--------------------------------------------------------------------------
	if teacher.Gender != nil{
		genderName = teacher.Gender.Gender
	}

	if teacher.Faculty != nil{
		facultyName = teacher.Faculty.FacultyName
	}

	if teacher.Major != nil{
		majorName = teacher.Major.MajorName
	}

	if teacher.Position != nil{
		positionName = teacher.Position.Position
	}

	// Step 3: สร้าง map สำหรับเก็บข้อมูลที่ต้องการส่งออก
	//--------------------------------------------------------------------------
	response := map[string]interface{}{
		"TeacherID": teacher.TeacherID,
		"FirstName": teacher.FirstName,
		"LastName": teacher.LastName,
		"CitizenID": teacher.CitizenID,
		"Email": teacher.Email,
		"Phone": teacher.Phone,
		"Gender": genderName,
		"FacultyName": facultyName,
		"MajorName": majorName,
		"Position": positionName,
	}

	c.JSON(http.StatusOK, response)
}

// Create Teacher
func CreateTeacher(c *gin.Context) {
	teacher := new(entity.Teachers)
	if err := c.ShouldBind(&teacher); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB()

	result := db.Create(&teacher)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}
	// เพิ่ม รหัสนักศึกษา , เลขบัตรปชช ลงตาราง Users หลังเพิ่มข้อมูลนักเรียนเเล้ว
	hashPassword, _ := config.HashPassword(teacher.CitizenID)
	user := &entity.Users{
		Username: teacher.TeacherID, // ดึงรหัสนักศึกษาออกมา
		Password: hashPassword,
		Role:     "teacher", //กำหนด Role
	}
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":    "Create student success",
		"Teacher_id": teacher.TeacherID,
		"FirstName":  teacher.FirstName,
		"LastName":   teacher.LastName,
	})
}

func GetTeacherAll(c *gin.Context) {
	var teachers []entity.Teachers
	db := config.DB()

	results := db.
		Preload("Major").
		Preload("Faculty").
		Preload("Position").
		Find(&teachers)

	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	if results.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "teacher not found"})
		return
	}

	// เเปลงข้อมูล Struct -> Map Slice
	// เพื่อเลือกส่งข้อมูลที่ต้องการออกไป
	var responce []map[string]interface{}
	i := 0
	for _, teacher := range teachers {
		majorName := ""
		facultyName := ""
		positionName := ""

		// ตรวจสอบว่า Major, Faculty, Position ไม่เป็น nil ก่อนเข้าถึง
		if teacher.Major != nil {
			majorName = teacher.Major.MajorName
		}

		if teacher.Faculty != nil {
			facultyName = teacher.Faculty.FacultyName
		}

		if teacher.Position != nil {
			positionName = teacher.Position.Position
		}

		t := map[string]interface{}{
			"ID":          i + 1,
			"TeacherID":   teacher.TeacherID,
			"FirstName":   teacher.FirstName,
			"LastName":    teacher.LastName,
			"CitizenID":   teacher.CitizenID,
			"Email":       teacher.Email,
			"Phone":       teacher.Phone,
			"MajorID":     teacher.MajorID,
			"MajorName":   majorName,
			"FacultyID":   teacher.FacultyID,
			"FacultyName": facultyName,
			"PositionID":  teacher.PositionID,
			"Position":    positionName,
		}
		i++
		responce = append(responce, t)
	}
	c.JSON(http.StatusOK, responce)
}

func DeleteTeacher(c *gin.Context) {
	tid := c.Param("id")
	teacher := new(entity.Teachers)
	db := config.DB()

	result := db.Delete(&teacher, "teacher_id = ?", tid)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delete teacher success"})
}

func UpdateTeacher(c *gin.Context) {
	tid := c.Param("id")
	db := config.DB()

	teacher := new(entity.Teachers)
	if err := c.ShouldBind(&teacher); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัพเดทข้อมูลอาจารย์
	result := db.Model(&teacher).Where("teacher_id = ?", tid).Updates(&teacher)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "teacher not found"})
		return
	}

	c.JSON(http.StatusOK, teacher)
}
