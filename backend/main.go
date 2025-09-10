package main

import (
	"net/http"
	"reg_system/config"
	"reg_system/test"

	"reg_system/controller/admins"
	"reg_system/controller/bill"
	"reg_system/controller/curriculum"
	"reg_system/controller/gender"
	"reg_system/controller/grade"
	scores "reg_system/controller/score"

	"reg_system/controller/degree"
	"reg_system/controller/faculty"
	"reg_system/controller/graduation"
	"reg_system/controller/major"
	"reg_system/controller/position"
	"reg_system/controller/registration"
	"reg_system/controller/status"
	"reg_system/controller/students"
	subjects "reg_system/controller/subject"
	"reg_system/controller/subjectcurriculum"
	"reg_system/controller/subjectstudytime"
	"reg_system/controller/teachers"
	"reg_system/controller/users"

	"github.com/gin-gonic/gin"

	"reg_system/middlewares"
)

const port = "8000"

func main() {
	// -------------------- Database --------------------
	config.ConnectionDB()
	config.SetupDatabase()

	// -------------------- Seed/Test Data --------------------
	test.ExampleData()

	// -------------------- Gin Setup --------------------
	r := gin.Default()
	r.RedirectTrailingSlash = true

	r.Static("/uploads", "./uploads")

	r.Use(CORSMiddleware())

	// -------------------- Auth --------------------
	r.POST("/signin", users.SignIn)

	// -------------------- Users --------------------
	userGroup := r.Group("/users")
	{
		userGroup.PUT("/reset/", users.ResetPassword)
		userGroup.PUT("/:id", users.ChangePassword)
	}

	// AuthMiddleware ตรวจ token ก่อน
	r.Use(middlewares.AuthMiddleware())

	// จากนั้นทุก route สามารถใช้ PermissionMiddleware เเบบ global
	r.Use(middlewares.PermissionMiddleware())

	// -------------------- Admin --------------------
	adminGroup := r.Group("/admin")
	{
		adminGroup.GET("/:id", admins.GetAdminID) //ทำเเล้ว
	}

	// -------------------- Students --------------------
	studentGroup := r.Group("/students")
	{
		studentGroup.GET("/:id", students.GetStudentID) //ทำเเล้ว
		studentGroup.POST("/", students.CreateStudent) //ทำเเล้ว
		studentGroup.GET("/", students.GetStudentAll) //ทำเเล้ว
		studentGroup.PUT("/:id", students.UpdateStudent)
		studentGroup.DELETE("/:id", students.DeleteStudent) //ทำเเล้ว

		studentGroup.GET("/:id/grades", grade.GetGradeByStudentID) //ทำเเล้ว
		studentGroup.GET("/:id/scores", scores.GetScoreByStudentID) // ทำเเล้ว
	}

	// -------------------- Teachers --------------------
	teacherGroup := r.Group("/teachers")
	{
		teacherGroup.GET("/:id", teachers.GetTeacherID) //ทำเเล้ว
		teacherGroup.POST("/", teachers.CreateTeacher) //ทำเเล้ว
		teacherGroup.GET("/", teachers.GetTeacherAll) // admin :Earth //ทำเเล้ว
		teacherGroup.PUT("/:id", teachers.UpdateTeacher)
		teacherGroup.DELETE("/:id", teachers.DeleteTeacher) //ทำเเล้ว

		teacherGroup.GET("/:id/subjects", teachers.GetSubjectByTeacherID) //ทำเเล้ว
		teacherGroup.POST("/grades", grade.CreateGrade) //ทำเเล้ว
		teacherGroup.GET("/:id/students", teachers.GetStudentByTeacherID)

		teacherGroup.POST("/scores", scores.CreateScores) //ทำเเล้ว
	}

	// -------------------- Majors --------------------
	majorGroup := r.Group("/majors") //ทำเเล้ว any
	{
		majorGroup.GET("/", major.GetMajorAll) // admin  :Earth
		majorGroup.POST("/", major.CreateMajor)
	}

	// -------------------- Faculties --------------------
	facultyGroup := r.Group("/faculties") //ทำเเล้ว any
	{
		facultyGroup.GET("/", faculty.GetFacultyAll) // admin, student, teacher  :Earth
		facultyGroup.POST("/", faculty.CreateFaculty)
	}

	// -------------------- Degrees --------------------
	degreeGroup := r.Group("/degrees") //ทำเเล้ว any
	{
		degreeGroup.GET("/", degree.GetDegreeAll)
		degreeGroup.POST("/", degree.CreateDegree)
	}

	// -------------------- Positions --------------------
	positionGroup := r.Group("/positions/") //ทำเเล้ว any
	{
		positionGroup.GET("/", position.GetPositionAll)
		positionGroup.POST("/", position.CreatePosition)
	}
	// -------------------- Statuses ------------------
	statusGroup := r.Group("/statuses")
	{
		statusGroup.GET("/", status.GetStatusStudentAll)
		statusGroup.POST("/", status.CreateStatus)
	}
	//---------------------------------------------------------
	registrationGroup := r.Group("/registrations")
	{
		registrationGroup.GET("/", registration.GetRegistrationAll)
		registrationGroup.GET("/:id", registration.GetRegistrationByStudentID)
		registrationGroup.POST("/", registration.CreateRegistration)
		registrationGroup.PUT("/:id", registration.UpdateRegistration)
		registrationGroup.DELETE("/:id", registration.DeleteRegistration)

		registrationGroup.GET("/subjects/:id", registration.GetStudentBySubjectID) //ทำเเล้ว
	}

	// -------------------- Curriculums --------------------
	curriculumGroup := r.Group("/curriculums")
	{
		curriculumGroup.GET("/", curriculum.GetCurriculumAll) // admin, student, teacher  :Earth //ทำเเล้ว
		curriculumGroup.GET("/:curriculumId", curriculum.GetCurriculumByID)
		curriculumGroup.POST("/", curriculum.CreateCurriculum)                // admin  :Earth ทำเเล้ว
		curriculumGroup.PUT("/:curriculumId", curriculum.UpdateCurriculum)    // admin  :Earth ทำเเล้ว
		curriculumGroup.PATCH("/:curriculumId", curriculum.UpdateCurriculum)  // admin  :Earth 
		curriculumGroup.DELETE("/:curriculumId", curriculum.DeleteCurriculum) // admin  :Earth ทำเเล้ว
	}

	// -------------------- Curriculum Books (files) --------------------
	cb := r.Group("/curriculum-books")
	{
		cb.GET("/", curriculum.GetCurriculumBooks)
		cb.GET("/:id", curriculum.GetCurriculumBookByID)
		cb.POST("/register", curriculum.RegisterCurriculumBookByPath) // admin :Earth ทำเเล้ว
		cb.GET("/preview/:id", curriculum.PreviewCurriculumBook)      // admin, student, teacher  :Earth any(ยังไม่เสร็จ)
		cb.GET("/download/:id", curriculum.DownloadCurriculumBook)
		cb.DELETE("/:id", curriculum.DeleteCurriculumBook)
	}

	// -------------------- Subject-Curriculums (link) --------------------
	subjectCurriculumGroup := r.Group("/subject-curriculums")
	{
		subjectCurriculumGroup.GET("/", subjectcurriculum.GetSubjectCurriculumAll) // admin, student, teacher  :Earth ทำเเล้ว any
		subjectCurriculumGroup.GET("/:id", subjectcurriculum.GetSubjectCurriculumByID)
		subjectCurriculumGroup.POST("/", subjectcurriculum.CreateSubjectCurriculum)      // admin  :Earth ทำเเล้ว
		subjectCurriculumGroup.DELETE("/:id", subjectcurriculum.DeleteSubjectCurriculum) // admin  :Earth ทำเเล้ว
	}

	// -------------------- Subjects & Study Times --------------------
	subjectGroup := r.Group("/subjects")
	{
		subjectGroup.GET("/", subjects.GetSubjectAll)  // admin, student, teacher  :Earth ทำเเล้ว any
		subjectGroup.POST("/", subjects.CreateSubject) // admin  :Earth ทำเเล้ว

		subjectItem := subjectGroup.Group("/:subjectId")
		{
			subjectItem.GET("", subjects.GetSubjectID)
			subjectItem.PUT("", subjects.UpdateSubject)    // admin  :Earth ทำเเล้ว
			subjectItem.DELETE("", subjects.DeleteSubject) // admin  :Earth ทำเเล้ว

			// -------------------- Subject Study Times --------------------

			times := subjectItem.Group("/times")
			{
				times.GET("", subjectstudytime.GetBySubject) // admin  :Earth ทำเเล้ว
				times.GET("/:timeId", subjectstudytime.GetOne)
				times.POST("", subjectstudytime.Create)           // admin  :Earth ทำเเล้ว
				times.PUT("/:timeId", subjectstudytime.Update)    // admin  :Earth ทำเเล้ว
				times.DELETE("/:timeId", subjectstudytime.Delete) // admin  :Earth ทำเเล้ว
			}
		}
	}

	//---------------------------------------------------------
	billGroup := r.Group("/bills")
	{
		billGroup.GET("/:id", bill.GetBillByStudentID)    //student ทำเเล้ว
		billGroup.POST("/:id/create", bill.CreateBill)    // student ทำเเล้ว
		billGroup.POST("/upload/:id/:year/:term", bill.UploadReceipt) //student ทำเเล้ว
		billGroup.GET("/preview/:id", bill.ShowFile)      // admin ทำเเล้ว
		billGroup.GET("/download/:id", bill.DownloadBill)
		billGroup.GET("/admin/all", bill.GetAllBills) // admin ทำเเล้ว
		billGroup.PUT("/:id", bill.UpdateBillStatus)  // ใช้สำหรับอนุมัติใบเสร็จ ทำเเล้ว
	}

	//---------------------------------------------------------
	// Grades
	gradeGroup := r.Group("/grades")
	{
		gradeGroup.GET("/", grade.GetGradeAll)
		gradeGroup.POST("/", grade.CreateGrade)
	}

	//---------------------------------------------------------
	// Score
	scoreGroup := r.Group("/scores")
	{
		scoreGroup.GET("/:id", scores.GetScoreByStudentID)
		scoreGroup.POST("/", scores.CreateScores)
	}

	//---------------------------------------------------------

	// -------------------- Genders --------------------
	r.GET("/genders/", gender.GetGenderAll) //ทำเเล้ว any

	graduationGroup := r.Group("/graduations")
	{
		graduationGroup.GET("/", graduation.GetAllGraduation)
		graduationGroup.POST("/", graduation.CreateGraduation)
		graduationGroup.GET("/:id", graduation.GetMyGraduation)
		graduationGroup.PUT("/:id", graduation.UpdateGraduation)
	}

	// -------------------- Run Server --------------------
	// เปิดให้บริการที่ localhost:8000

	r.Run("localhost:" + port)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Vary", "Origin")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers",
			"Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Accept, Origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
