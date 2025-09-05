package teachers

import (
	"errors"
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Get Teacher by ID
func GetTeacherID(c *gin.Context) {
	tid := c.Param("id")

	teacher := new(entity.Teachers)

	// สร้าง transaction
	db := config.DB()
	tx := db.Begin()

	err := tx.
		Preload("Gender").
		Preload("Faculty").
		Preload("Major").
		Preload("Position").
		Preload("Subject").
		First(&teacher, "teacher_id = ?", tid).Error

	if err != nil {
		tx.Rollback()

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// not found
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		} else {
			// database error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		}

		return
	}

	// commit transaction
	tx.Commit()

	// เอาค่า {Gender , FacultyName , MajorName , Position} ออกมาเเสดง
	genderName := ""
	facultyName := ""
	majorName := ""
	positionName := ""

	// Check filed ว่าเป็น nil หรือไม่ ก่อนเข้าถึง field นั้นโดยตรงไม่งั้นจะ error
	//--------------------------------------------------------------------------
	if teacher.Gender != nil {
		genderName = teacher.Gender.Gender
	}

	if teacher.Faculty != nil {
		facultyName = teacher.Faculty.FacultyName
	}

	if teacher.Major != nil {
		majorName = teacher.Major.MajorName
	}

	if teacher.Position != nil {
		positionName = teacher.Position.Position
	}

	// Step 3: สร้าง map สำหรับเก็บข้อมูลที่ต้องการส่งออก
	//--------------------------------------------------------------------------
	response := map[string]interface{}{
		"TeacherID":   teacher.TeacherID,
		"FirstName":   teacher.FirstName,
		"LastName":    teacher.LastName,
		"CitizenID":   teacher.CitizenID,
		"Email":       teacher.Email,
		"Phone":       teacher.Phone,
		"Gender":      genderName,
		"FacultyName": facultyName,
		"MajorName":   majorName,
		"Position":    positionName,
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
	// สร้าง transaction เพื่อความปลอดภัย
	db := config.DB()
	tx := db.Begin()

	// ตรวจสอบว่ามี username นี้ในระบบเเล้วหรือยัง เพื่อกัน username ซ้ำกัน
	// โดยเช็คจากตาราง Users
	existingUser := &entity.Users{}
	err := tx.First(&existingUser, "username = ?", teacher.TeacherID).Error
	if err == nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Teacher ID already exists in Users table"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// เพิ่ม teacher ลงฐานข้อมูล
	if err := tx.Create(&teacher).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create teacher"})
		return
	}

	// กำหนด Username: รหัสอาจารย์ , Password: เลขบัตรปชช
	hashPassword, _ := config.HashPassword(teacher.CitizenID)
	user := &entity.Users{
		Username: teacher.TeacherID, // ดึงรหัสนักศึกษาออกมา
		Password: hashPassword,
		Role:     "teacher", //กำหนด Role
	}
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// commit transaction
	tx.Commit()

	c.JSON(http.StatusOK, gin.H{
		"message":    "Create teacher success",
		"Teacher_id": teacher.TeacherID,
		"FirstName":  teacher.FirstName,
		"LastName":   teacher.LastName,
	})
}

func GetTeacherAll(c *gin.Context) {
	var teachers []entity.Teachers

	// สร้าง transaction
	db := config.DB()
	tx := db.Begin()

	err := tx.
		Preload("Major").
		Preload("Faculty").
		Preload("Position").
		Find(&teachers).Error

	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// not found
			c.JSON(http.StatusNotFound, gin.H{"error": "students not found"})
		} else {
			// database error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		}
		return
	}

	// commit transaction
	tx.Commit()

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

	// สร้าง transaction
	db := config.DB()
	tx := db.Begin()

	result := tx.Delete(&entity.Teachers{}, "teacher_id = ?", tid)
	if result.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// เช็คว่ามี Teacher จริงหรือไม่
	if result.RowsAffected == 0 {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "teacher not found"})
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Delete teacher success"})
}

func UpdateTeacher(c *gin.Context) {
	tid := c.Param("id")

	// สร้าง transaction
	db := config.DB()
	tx := db.Begin()

	input := new(entity.Teachers)
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// หา Teacher ก่อน Update
	teacher := &entity.Teachers{}
	if err := tx.First(&teacher, "teacher_id = ?", tid).Error; err != nil {
		tx.Rollback()

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// not found
			c.JSON(http.StatusNotFound, gin.H{"error": "teacher not found"})
		} else {
			// database error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		}
		return
	}

	// อัพเดทข้อมูลอาจารย์
	if err := tx.Model(&teacher).Updates(&input).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update teacher"})
		return
	}

	// commit transaction
	tx.Commit()

	c.JSON(http.StatusOK, teacher)
}

func GetStudentByTeacherID(c *gin.Context) {
	tid := c.Param("id")
	var teacher entity.Teachers

	// สร้าง transaction
	db := config.DB()
	tx := db.Begin()

	err := tx.
		Preload("Student").
		Preload("Student.Degree").
		Find(&teacher, "teacher_id = ?", tid).Error

	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// not found
			c.JSON(http.StatusNotFound, gin.H{"error": "teacher not found"})
		} else {
			// database error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		}
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, teacher)
}

func GetSubjectByTeacherID(c *gin.Context) {
	tid := c.Param("id")
	var teacher entity.Teachers

	db := config.DB()
	tx := db.Begin()

	err := tx.
		Preload("Subject").
		Preload("Subject.Semester").
		First(&teacher, "teacher_id = ?", tid).Error

	if err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// not found
			c.JSON(http.StatusNotFound, gin.H{"error": "teacher not found"})
		} else {
			// database error
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
		}
		return
	}

	tx.Commit()

	if len(teacher.Subject) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "teacher subject not found"})
		return
	}

	var response []SubjectTeacherResponse
	for _, subj := range teacher.Subject {
		response = append(response, SubjectTeacherResponse{
			SubjectID:    subj.SubjectID,
			SubjectName:  subj.SubjectName,
			Credit:       subj.Credit,
			Term:         subj.Semester.Term,
			AcademicYear: subj.Semester.AcademicYear,
		})
	}
	c.JSON(http.StatusOK, response)
}

type SubjectTeacherResponse struct {
	SubjectID    string `json:"SubjectID"`
	SubjectName  string `json:"SubjectName"`
	Credit       int    `json:"Credit"`
	Term         int    `json:"Term"`
	AcademicYear int    `json:"AcademicYear"`
}
