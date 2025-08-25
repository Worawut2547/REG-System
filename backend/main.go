package main

import (
	"reg_system/config"
	"reg_system/test"

	"reg_system/controller/admins"
	"reg_system/controller/bill"
	"reg_system/controller/gender"
	"reg_system/controller/subject"

	"reg_system/controller/teachers"

	"reg_system/controller/students"

	"reg_system/controller/users"

	"reg_system/controller/registration"

	"reg_system/controller/degree"
	"reg_system/controller/faculty"
	"reg_system/controller/major"
	"reg_system/controller/position"
	"reg_system/controller/status"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const port = "8000"

func main() {
	config.ConnectionDB()
	config.SetupDatabase()

	// Data Test
	test.ExampleData()

	r := gin.Default()

	r.Use(cors.Default())

	r.Use(CORSMiddleware())

	// Authentication
	r.POST("/signin", users.SignIn)

	//---------------------------------------------------------
	//Admin
	adminGroup := r.Group("/admin")
	{
		adminGroup.GET("/:id", admins.GetAdminID)
	}
	//---------------------------------------------------------

	//---------------------------------------------------------
	//Student

	studentGroup := r.Group("/students")
	{
		studentGroup.GET("/:id", students.GetStudentID)
		studentGroup.POST("/", students.CreateStudent)
		studentGroup.GET("/", students.GetStudentAll)

		studentGroup.PUT("/:id", students.UpdateStudent)
		studentGroup.DELETE("/:id", students.DeleteStudent)
	}
	//---------------------------------------------------------

	//---------------------------------------------------------
	//Teacher
	teacherGroup := r.Group("/teachers")
	{
		teacherGroup.GET("/:id", teachers.GetTeacherID)
		teacherGroup.POST("/", teachers.CreateTeacher)
		teacherGroup.GET("/", teachers.GetTeacherAll)
		teacherGroup.PUT("/:id", teachers.UpdateTeacher)
		teacherGroup.DELETE("/:id", teachers.DeleteTeacher)
	}

	//---------------------------------------------------------
	//Major
	majorGroup := r.Group("/majors")
	{
		majorGroup.GET("/", major.GetMajorAll)
		majorGroup.POST("/", major.CreateMajor)
	}

	//---------------------------------------------------------
	//Faculty
	facultyGroup := r.Group("/faculties")
	{
		facultyGroup.GET("/", faculty.GetFacultyAll)
		facultyGroup.POST("/", faculty.CreateFaculty)
	}

	//---------------------------------------------------------
	// Degree
	degreeGroup := r.Group("/degrees")
	{
		degreeGroup.GET("/", degree.GetDegreeAll)
		degreeGroup.POST("/", degree.CreateDegree)
	}

	//---------------------------------------------------------
	// Position
	positionGroup := r.Group("/positions")
	{
		positionGroup.GET("/", position.GetPositionAll)
		positionGroup.POST("/", position.CreatePosition)
	}
	//---------------------------------------------------------
	// Status
	statusGroup := r.Group("statuses")
	{
		statusGroup.GET("/", status.GetStatusStudentAll)
		statusGroup.POST("/", status.CreateStatus)
	}
	//---------------------------------------------------------
	registrationGroup := r.Group("/registrations")
	{
		registrationGroup.GET("/", registration.GetRegistrationAll)
		registrationGroup.GET("/:id", registration.GetRegistrationByID)
		registrationGroup.POST("/", registration.CreateRegistration)
		registrationGroup.PUT("/:id", registration.UpdateRegistration)
		registrationGroup.DELETE("/:id", registration.DeleteRegistration)

		//r.Run(":8000")
	}
	//---------------------------------------------------------
	subjectrGroup := r.Group("/subjects")
	{
		subjectrGroup.GET("/", subject.GetSubjectAll)
		subjectrGroup.GET("/:id", subject.GetSubjectByID)
		subjectrGroup.POST("/", subject.CreateSubject)
		subjectrGroup.PUT("/:id", subject.UpdateSubject)
		subjectrGroup.DELETE("/:id", subject.DeleteSubject)

		//r.Run(":8000")
	}
	//---------------------------------------------------------
	billrGroup := r.Group("/bills")
	{
		billrGroup.GET("/", bill.GetBills)
		billrGroup.GET("/:id", bill.GetBillByID)
		billrGroup.POST("/", bill.CreateBill)
		billrGroup.PUT("/:id", bill.UpdateBill)
		billrGroup.DELETE("/:id", bill.DeleteBill)

		r.Run(":8000")
	}
	//---------------------------------------------------------

	r.GET("/genders", gender.GetGenderAll)

	// Run on port 8000
	r.Run("localhost:" + port)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		// ตั้งค่า CORS headers
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") //อนุญาตให้ port ที่จะมาเชื่อมต่อ (* อนุญาตทั้งหมด)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Method", "GET , POST , PUT , DELETE , OPTIONS")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()

		// ตรวจสอบ error ที่เกิดระหว่างการทำงาน
		if len(c.Errors) > 0 {
			c.JSON(-1, gin.H{
				"status": "error",
				"errors": c.Errors.JSON(),
			})
		}
	}
}
