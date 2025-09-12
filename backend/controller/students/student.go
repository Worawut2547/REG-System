package students

import (
	"errors"
	"net/http"

	"reg_system/config"
	"reg_system/entity"
	"reg_system/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetStudentID(c *gin.Context) {
	sid := c.Param("id")

	students := entity.Students{}

	// เริ่มต้น transaction
	db := config.DB()
	tx := db.Begin()

	err := tx.
		Preload("Faculty").
		Preload("Major").
		Preload("Degree").
		Preload("StatusStudent").
		Preload("Gender").
		Preload("Curriculum").
		Preload("Grade").
		Preload("Grade.Subject").
		Preload("Teacher").
		First(&students, "student_id = ?", sid).Error

	if err != nil {
		tx.Rollback()

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// ไม่เจอ
			c.JSON(http.StatusNotFound, gin.H{"error": "Student not found"})
		} else {
			// database error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		}
		return
	}
	tx.Commit()

	// Step 2: เอาค่า {Gender , FacultyName , MajorName , Degree} ออกมาเเสดง
	//--------------------------------------------------------------------------
	degreeName := ""
	majorID := ""
	majorName := ""
	facultyID := ""
	facultyName := ""
	status := ""
	curriculumName := ""
	genderName := ""

	// Check filed ว่าเป็น nil หรือไม่ ก่อนเข้าถึง field นั้นโดยตรง
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

	if students.Gender != nil {
		genderName = students.Gender.Gender
	}

	// คำนวณ GPA
	gpa := services.CalculateGPA(students.Grade)

	// คำนวณหน่วยกิตรวม
	totalCredits, _ := services.CalculateTotalCredits(students.StudentID)

	// Step 3: สร้าง map สำหรับเก็บข้อมูลที่ต้องการส่งออก
	//------------------------------------------------------------------
	response := map[string]interface{}{
		"StudentID": students.StudentID,
		"FirstName": students.FirstName,
		"LastName":  students.LastName,
		"CitizenID": students.CitizenID,

		"MajorID":   majorID,
		"MajorName": majorName,

		"FacultyID":   facultyID,
		"FacultyName": facultyName,

		"Degree":          degreeName,
		"Email":           students.Email,
		"Phone":           students.Phone,
		"Gender":          genderName,
		"StatusStudentID": students.StatusStudentID,
		"StatusStudent":   status,

		"CurriculumID":   students.CurriculumID,
		"CurriculumName": curriculumName,
		"Teacher":        students.Teacher,
		"GPAX":           gpa,
		"TotalCredits":   totalCredits,

		"Address":     students.Address,
		"Religion":    students.Religion,
		"Nationality": students.Nationality,
		"Ethnicity":   students.Ethnicity,
		"BirthDay":    students.BirthDay,
		"Parent":      students.Parent,
	}

	c.JSON(http.StatusOK, response)
}

func CreateStudent(c *gin.Context) {
	student := new(entity.Students)
	if err := c.ShouldBind(&student); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// สร้าง transaction เพื่อความปลอดภัย
	db := config.DB()
	tx := db.Begin()

	// ตรวจสอบว่ามี username นี้ในระบบเเล้วหรือยัง เพื่อกัน username ซ้ำกัน
	// โดยเช็คจากตาราง Users
	existingUser := &entity.Users{}
	err := tx.First(&existingUser, "username = ?", student.StudentID).Error
	if err == nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Student ID already exists in Users table"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// ถ้า Status ว่าง ให้กำหนด ค่า 10
	if student.StatusStudentID == "" {
		student.StatusStudentID = "10"
	}

	// เพิ่ม student ลงฐานข้อมูล
	if err := tx.Create(&student).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create student"})
		return
	}

	// กำหนด Username: รหัสนักศึกษา , Password: เลขบัตรปชช
	hashPassword, _ := config.HashPassword(student.CitizenID)
	user := &entity.Users{
		Username: student.StudentID, // ดึงรหัสนักศึกษาออกมา
		Password: hashPassword,
		Role:     "student", //กำหนด Role
	}

	if err := tx.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user (possibly duplicate username)"})
		return
	}

	// commit transaction
	tx.Commit()

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

	// สร้าง transaction
	db := config.DB()
	tx := db.Begin()

	err := tx.
		Preload("Degree").
		Preload("Faculty").
		Preload("Major").
		Preload("StatusStudent").
		Find(&students).Error

	if err != nil {
		tx.Rollback()

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// หาไม่เจอ
			c.JSON(http.StatusNotFound, gin.H{"error": "student not found"})
		} else {
			// database error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		}
		return
	}
	tx.Commit()

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

	// สร้าง transaction
	db := config.DB()
	tx := db.Begin()

	input := new(entity.Students)
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// หา Student ก่อนจะ update
	student := &entity.Students{}
	if err := tx.First(&student , "student_id = ?",sid).Error; err != nil {
		tx.Rollback()
		
		if errors.Is(err , gorm.ErrRecordNotFound){
			// หาไม่เจอ
			c.JSON(http.StatusNotFound , gin.H{"error": "student not found"})
		}else{
			// database error
			c.JSON(http.StatusInternalServerError , gin.H{"error": "database error"})
		}
		return
	}

	// อัพเดทข้อมูลนักเรียน
	err := tx.Model(&student).Updates(&input).Error
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError , gin.H{"error": "Failed to update student"})
		return
	}
	
	// commit transaction
	tx.Commit()

	c.JSON(http.StatusOK, student)
}

func DeleteStudent(c *gin.Context) {
	sid := c.Param("id")

	// สร้าง transaction
	db := config.DB()
	tx := db.Begin()

	result := tx.Delete(&entity.Students{}, "student_id = ?", sid)
	if result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError , gin.H{"error": result.Error.Error()})
		return
	}

	// เช็คว่ามี student จริงหรือไม่
	if result.RowsAffected == 0 {
		tx.Rollback()
		c.JSON(http.StatusNotFound , gin.H{"error":"student not found"})
		return
	}
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Delete student success"})
}