package students

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetStudentID(c *gin.Context) {
	sid := c.Param("id")

	students := entity.Students{}
	db := config.DB()

	result := db.
		Preload("Faculty").
		Preload("Major").
		Preload("Degree").
		Preload("StatusStudent").
		Preload("Gender").
		Preload("Curriculum").
		First(&students, "student_id = ?", sid)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		return
	}
	// Step 2: เอาค่า {Gender , FacultyName , MajorName , Degree} ออกมาเเสดง
	// เพื่อเลือกส่งข้อมูลที่ต้องการออกไป
	//--------------------------------------------------------------------------
	degreeName := ""
	majorID := ""
	majorName := ""
	facultyID := ""
	facultyName := ""
	status := ""
	curriculumName := ""

	// Check filed ว่าเป็น nil หรือไม่ ก่อนเข้าถึง field นั้นโดยตรงไม่งั้นจะ error
	//--------------------------------------------------------------------------
	if students.Degree != nil {
		degreeName = students.Degree.Degree
	}

	if students.Major != nil {
		majorID = students.Major.MajorID
		majorName = students.Major.MajorName
	}

	if students.Faculty != nil {
		facultyID = students.Faculty.FacultyID
		facultyName = students.Faculty.FacultyName
	}

	if students.StatusStudent != nil {
		status = students.StatusStudent.Status
	}

	if students.Curriculum != nil {
		curriculumName = students.Curriculum.CurriculumName
	}
	//--------------------------------------------------------------------------

	// Step 3: สร้าง map สำหรับเก็บข้อมูลที่ต้องการส่งออก
	//--------------------------------------------------------------------------
	response := map[string]interface{}{
		"StudentID": students.StudentID,
		"FirstName": students.FirstName,
		"LastName":  students.LastName,
		"CitizenID": students.CitizenID,

		"MajorID":   majorID,
		"MajorName": majorName,

		"FacultyID":   facultyID,
		"FacultyName": facultyName,

		"Degree":          degreeName, // ส่งเฉพาะชื่อปริญญา
		"Email":           students.Email,
		"Phone":           students.Phone,
		"Gender":          students.Gender.Gender,
		"StatusStudentID": students.StatusStudentID,
		"StatusStudent":   status,

		"CurriculumID": students.CurriculumID,
		"CurriculumName": curriculumName,
	}

	c.JSON(http.StatusOK, response)
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

	// Step 1: โหลดข้อมูล student ขึ้นมา
	//--------------------------------------------------------------------------
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
	//--------------------------------------------------------------------------

	// Step 2: เเปลงข้อมูล Struct -> Map Slice
	// เพื่อเลือกส่งข้อมูลที่ต้องการออกไป
	//--------------------------------------------------------------------------
	var response []map[string]interface{}
	i := 0
	for _, student := range students {
		degreeName := ""
		majorID := ""
		majorName := ""
		facultyID := ""
		facultyName := ""

		// Check filed ว่าเป็น nil หรือไม่ ก่อนเข้าถึง field นั้นโดยตรงไม่งั้นจะ error
		//--------------------------------------------------------------------------
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
		//--------------------------------------------------------------------------

		// Step 3: สร้าง map สำหรับเก็บข้อมูลที่ต้องการส่งออก
		//--------------------------------------------------------------------------
		s := map[string]interface{}{
			"ID":              i + 1,
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
		i++
		response = append(response, s)
	}

	c.JSON(http.StatusOK, response)
}

func UpdateStudent(c *gin.Context) {
	sid := c.Param("id")
	db := config.DB()

	student := new(entity.Students)
	if err := c.ShouldBind(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัพเดทข้อมูลนักเรียน
	result := db.Model(&student).Where("student_id = ?", sid).Updates(&student)
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

func DeleteStudent(c *gin.Context) {
	sid := c.Param("id")
	student := new(entity.Students)

	db := config.DB()
	result := db.Delete(&student, "student_id = ?", sid)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delete student success"})
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
