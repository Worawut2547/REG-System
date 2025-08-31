package main

import (
	"reg_system/config"
	"reg_system/test"

	// Controllers
	"reg_system/controller/admins"
	"reg_system/controller/gender"
	"reg_system/controller/teachers"
	"reg_system/controller/students"
	"reg_system/controller/users"

	"reg_system/controller/degree"
	"reg_system/controller/faculty"
	"reg_system/controller/major"
	"reg_system/controller/position"
	"reg_system/controller/status"
	"reg_system/controller/reports"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const port = "8000"

func main() {
	// Connect & migrate DB
	config.ConnectionDB()
	config.SetupDatabase()

	// Seed ตัวอย่าง (ถ้ามี)
	test.ExampleData()

	r := gin.Default()

	r.Static("/uploads", "./uploads")

	// CORS
	r.Use(cors.Default())
	r.Use(CORSMiddleware())

	// ---------- Auth (ไม่แตะ auth.go ตามที่ขอ) ----------
	r.POST("/signin", users.SignIn)

	// ---------- Admin ----------
	adminGroup := r.Group("/admin")
	{
		adminGroup.GET("/:id", admins.GetAdminID)
	}

	// ---------- Student ----------
	studentGroup := r.Group("/students")
	{
		studentGroup.GET("/:id", students.GetStudentID)
		studentGroup.POST("/", students.CreateStudent)
		studentGroup.GET("/", students.GetStudentAll)
		studentGroup.PUT("/:id", students.UpdateStudent)
		studentGroup.DELETE("/:id", students.DeleteStudent)
	}

	// ---------- Teacher ----------
	teacherGroup := r.Group("/teachers")
	{
		teacherGroup.GET("/:id", teachers.GetTeacherID)
		teacherGroup.POST("/", teachers.CreateTeacher)
		teacherGroup.GET("/", teachers.GetTeacherAll)
		teacherGroup.PUT("/:id", teachers.UpdateTeacher)
		teacherGroup.DELETE("/:id", teachers.DeleteTeacher)
	}

	// ---------- Major ----------
	majorGroup := r.Group("/majors")
	{
		majorGroup.GET("/", major.GetMajorAll)
		majorGroup.POST("/", major.CreateMajor)
	}

	// ---------- Faculty ----------
	facultyGroup := r.Group("/faculties")
	{
		facultyGroup.GET("/", faculty.GetFacultyAll)
		facultyGroup.POST("/", faculty.CreateFaculty)
	}

	// ---------- Degree ----------
	degreeGroup := r.Group("/degrees")
	{
		degreeGroup.GET("/", degree.GetDegreeAll)
		degreeGroup.POST("/", degree.CreateDegree)
	}

	// ---------- Position ----------
	positionGroup := r.Group("/positions")
	{
		positionGroup.GET("/", position.GetPositionAll)
		positionGroup.POST("/", position.CreatePosition)
	}

	// ---------- Status ----------
	statusGroup := r.Group("/statuses")
	{
		statusGroup.GET("/", status.GetStatusStudentAll)
		statusGroup.POST("/", status.CreateStatus)
	}

	// ---------- Report System ----------
reportGroup := r.Group("/reports")
{
    // Create report + upload file
    reportGroup.POST("/", reports.CreateReport)

    // Read
    reportGroup.GET("/", reports.GetReportAll)
    reportGroup.GET("/:id", reports.GetReportByID)

    // Update
    reportGroup.PUT("/:id", reports.UpdateReport)
    reportGroup.PUT("/:id/status", reports.UpdateStatus)

    // Delete
    reportGroup.DELETE("/:id", reports.DeleteReport)
}

// สำหรับ dropdown
r.GET("/report-types", reports.ListReportTypes)
r.GET("/reviewers", reports.ListReviewers)

// ประวัติคำร้องนักศึกษา
r.GET("/students/reports/:sid", reports.GetReportsByStu)

// reviewer เชื่อมกับ user
r.GET("/reviewers/by-username/:username", reports.GetReviewerByUsername)
r.GET("/reviewers/:rid/reports", reports.GetReportsByReviewer)

	// อื่น ๆ
	r.GET("/genders", gender.GetGenderAll)

	// Run server
	r.Run("localhost:" + port)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers",
			"Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		// แก้เป็นมาตรฐาน: Methods (พหูพจน์)
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()

		if len(c.Errors) > 0 {
			c.JSON(-1, gin.H{
				"status": "error",
				"errors": c.Errors.JSON(),
			})
		}
	}
}
