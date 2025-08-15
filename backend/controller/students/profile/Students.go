package students

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetStudentID(c *gin.Context) {
	sid := c.Param("id")

	student := entity.Students{}
	db := config.DB()

	result := db.First(&student, "student_id = ?", sid)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	c.JSON(http.StatusOK, student)
}

func CreateStudent(c *gin.Context) {
	student := new(entity.Students)
	if err := c.ShouldBind(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ถ้า Status ว่าง ให้กำหนด ค่า 10
	if student.StatusStudentID == "" {
		student.StatusStudentID = "10"
	}

	db := config.DB()

	result := db.Create(&student)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}
	// เพิ่ม รหัสนักศึกษา , เลขบัตรปชช ลงตาราง Users หลังเพิ่มข้อมูลนักเรียนเเล้ว
	hashPassword, _ := config.HashPassword(student.CitizenID)
	user := &entity.Users{
		Username: student.StudentID, // ดึงรหัสนักศึกษาออกมา
		Password: hashPassword,
		Role:     "student", //กำหนด Role
	}
	if err := db.Create(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":    "Create student success",
		"Student_id": student.StudentID,
		"FirstName":  student.FirstName,
		"LastName":   student.LastName,
	})
}

func GetStudentAll(c *gin.Context) {
	var students []entity.Students
	db := config.DB()

	results := db.
		Preload("Degree").
		Preload("Faculty").
		Preload("Major").
		Preload("StatusStudent").
		Find(&students)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	if results.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}

	var response []map[string]interface{}

	for _, student := range students {
		degreeName := ""
		majorID := ""
		majorName := ""
		facultyID := ""
		facultyName := ""

		if student.Degree != nil {
			degreeName = student.Degree.Degree
		}

		if student.Major != nil {
			majorID = student.Major.MajorID
			majorName = student.Major.MajorName
		}

		if student.Faculty != nil {
			facultyID = student.Faculty.FacultyID
			facultyName = student.Faculty.FacultyName
		}
		s := map[string]interface{}{
			"ID":              student.ID,
			"StudentID":       student.StudentID,
			"FirstName":       student.FirstName,
			"LastName":        student.LastName,
			"CitizenID":       student.CitizenID,
			"StatusStudentID": student.StatusStudentID,
			"MajorID":         majorID,
			"MajorName":       majorName,
			"FacultyID":       facultyID,
			"FacultyName":     facultyName,
			"Degree":          degreeName, // ส่งเฉพาะชื่อปริญญา
			"Email":           student.Email,
			"Phone":           student.Phone,
		}
		response = append(response, s)
	}

	c.JSON(http.StatusOK, response)
}

func CreateStatus(c *gin.Context) {
	status := new(entity.StatusStudent)

	if err := c.ShouldBind(&status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.FirstOrCreate(&status)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &status)
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
