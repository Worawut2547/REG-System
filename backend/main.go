package main

import (
	"net/http"
	"reg_system/config"
	"reg_system/test"

	// Controllers
	"reg_system/controller/admins"
	"reg_system/controller/bill"
	"reg_system/controller/curriculum"
	"reg_system/controller/gender"
	"reg_system/controller/grade"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"reg_system/controller/degree"
	"reg_system/controller/faculty"
	"reg_system/controller/major"
	"reg_system/controller/position"
	"reg_system/controller/reports"
	"reg_system/controller/reporttypes"
	"reg_system/controller/registration"
	"reg_system/controller/status"
	"reg_system/controller/students"
	"reg_system/controller/subject"
	"reg_system/controller/subjectcurriculum"
	"reg_system/controller/subjectstudytime"
	"reg_system/controller/teachers"
	"reg_system/controller/users"
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
	r.RedirectTrailingSlash = true // ถ้า /path/ หรือ /path Gin จะ redirect อัตโนมัติให้ตรงกัน
	r.Use(cors.Default())
	r.Use(CORSMiddleware())

	// Serve uploaded files (attachments)
	r.Static("/uploads", "./uploads")

	// -------------------- Auth --------------------
	r.POST("/signin", users.SignIn)

	// -------------------- Users --------------------
	userGroup := r.Group("/users")
	{
		userGroup.PUT("/reset/",users.ResetPassword)
		userGroup.PUT("/:id",users.ChangePassword)
	}

	// -------------------- Admin --------------------
	adminGroup := r.Group("/admin")
	{
		adminGroup.GET("/:id", admins.GetAdminID)
	}

	// -------------------- Students --------------------
	studentGroup := r.Group("/students")
	{
		studentGroup.GET("/:id", students.GetStudentID)
		studentGroup.POST("/", students.CreateStudent)
		studentGroup.GET("/", students.GetStudentAll)
		studentGroup.PUT("/:id", students.UpdateStudent)
		studentGroup.DELETE("/:id", students.DeleteStudent)

		studentGroup.GET("/:id/grades", grade.GetGradeByStudentID)
		// คำร้องของนักศึกษา
		studentGroup.GET("/reports/:sid", reports.GetReportsByStu)
	}

	// -------------------- Teachers --------------------
	teacherGroup := r.Group("/teachers")
	{
		teacherGroup.GET("/:id", teachers.GetTeacherID)
		teacherGroup.POST("/", teachers.CreateTeacher)
		teacherGroup.GET("/", teachers.GetTeacherAll)
		teacherGroup.PUT("/:id", teachers.UpdateTeacher)
		teacherGroup.DELETE("/:id", teachers.DeleteTeacher)

		teacherGroup.GET("/:id/subjects", teachers.GetSubjectByTeacherID)
		teacherGroup.POST("/grades", grade.CreateGrade)
	}

	// -------------------- Majors --------------------
	majorGroup := r.Group("/majors")
	{
		majorGroup.GET("/", major.GetMajorAll)
		majorGroup.POST("/", major.CreateMajor)
	}

	// -------------------- Faculties --------------------
	facultyGroup := r.Group("/faculties")
	{
		facultyGroup.GET("/", faculty.GetFacultyAll)
		facultyGroup.POST("/", faculty.CreateFaculty)
	}

	// -------------------- Degrees --------------------
	degreeGroup := r.Group("/degrees")
	{
		degreeGroup.GET("/", degree.GetDegreeAll)
		degreeGroup.POST("/", degree.CreateDegree)
	}

	// -------------------- Positions --------------------
	positionGroup := r.Group("/positions")
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

		registrationGroup.GET("/subjects/:id" ,registration.GetStudentBySubjectID)
	}

	// -------------------- Curriculums --------------------
	curriculumGroup := r.Group("/curriculums")
	{
		curriculumGroup.GET("/", curriculum.GetCurriculumAll)                 // GET /curriculums
		curriculumGroup.GET("/:curriculumId", curriculum.GetCurriculumByID)   // GET /curriculums/:id
		curriculumGroup.POST("/", curriculum.CreateCurriculum)                // POST /curriculums
		curriculumGroup.PUT("/:curriculumId", curriculum.UpdateCurriculum)    // PUT /curriculums/:id
		curriculumGroup.PATCH("/:curriculumId", curriculum.UpdateCurriculum)  // PATCH /curriculums/:id
		curriculumGroup.DELETE("/:curriculumId", curriculum.DeleteCurriculum) // DELETE /curriculums/:id
	}

	// -------------------- Books (files) --------------------
	bookGroup := r.Group("/books")
	{
		bookGroup.GET("/", curriculum.GetBookPathAll)               // GET /books
		bookGroup.GET("/:id", curriculum.GetBookPathByID)           // GET /books/:id (อ่าน metadata ไฟล์)
		bookGroup.POST("/upload", curriculum.UploadBookFile)        // POST /books/upload (อัปโหลดไฟล์)
		bookGroup.GET("/download/:id", curriculum.DownloadBookFile) // GET /books/download/:id (ดาวน์โหลดไฟล์)
		bookGroup.DELETE("/:id", curriculum.DeleteBookFile)         // DELETE /books/:id (ลบไฟล์ + metadata)
	}
	// -------------------- Subject-Curriculums (link) --------------------
	subjectCurriculumGroup := r.Group("/subject-curriculums")
	{
		subjectCurriculumGroup.GET("/", subjectcurriculum.GetSubjectCurriculumAll)       // GET /subject-curriculums (ดึงทั้งหมด)
		subjectCurriculumGroup.GET("/:id", subjectcurriculum.GetSubjectCurriculumByID)   // GET /subject-curriculums/:id (ดูทีละรายการ)
		subjectCurriculumGroup.POST("/", subjectcurriculum.CreateSubjectCurriculum)      // POST /subject-curriculums (สร้างใหม่)
		subjectCurriculumGroup.DELETE("/:id", subjectcurriculum.DeleteSubjectCurriculum) // DELETE /subject-curriculums/:id (ลบตาม id)
	}

	// -------------------- Subjects & Study Times --------------------
    subjectGroup := r.Group("/subjects")
    {
        // รายการวิชาทั้งหมด (รองรับทั้ง /subjects และ /subjects/)
        subjectGroup.GET("/", subjects.GetSubjectAll)
        subjectGroup.GET("", subjects.GetSubjectAll)

        // สร้างวิชาใหม่ (รองรับทั้งสองรูปแบบ)
        subjectGroup.POST("/", subjects.CreateSubject)
        subjectGroup.POST("", subjects.CreateSubject)

		// กลุ่มเส้นทางของวิชาเฉพาะตัว (RESTful)
		subjectItem := subjectGroup.Group("/:subjectId")
		{
			subjectItem.GET("", subjects.GetSubjectID)
			subjectItem.PUT("", subjects.UpdateSubject)
			subjectItem.DELETE("", subjects.DeleteSubject)

			// เวลาศึกษาของวิชานั้นๆ
			// Allow trailing slash in study time routes
			times := subjectItem.Group("/times")
			{
				times.GET("", subjectstudytime.GetBySubject)
				times.GET("/:timeId", subjectstudytime.GetOne)
				times.POST("", subjectstudytime.Create)
				times.PUT("/:timeId", subjectstudytime.Update)
				times.DELETE("/:timeId", subjectstudytime.Delete)
			}
		}
	}

	// -------------------- Reports --------------------
	reportGroup := r.Group("/reports")
	{
		reportGroup.GET("/", reports.GetReportAll)
		reportGroup.GET("/:id", reports.GetReportByID)
		reportGroup.POST("/", reports.CreateReport)
		reportGroup.POST("/:id/attachments", reports.AddReportAttachment)
		reportGroup.PUT("/:id/status", reports.UpdateStatus)
		reportGroup.DELETE("/:id/attachments/:attId", reports.DeleteReportAttachment)
		reportGroup.DELETE("/:id", reports.DeleteReportAlias)
	}

	// -------------------- Report Types --------------------
	r.GET("/report-types", reporttypes.ListReportTypes)
	r.GET("/report-types/:id", reporttypes.GetReportTypeByID)
	r.POST("/report-types", reporttypes.CreateReportType)
	r.PUT("/report-types/:id", reporttypes.UpdateReportType)
	r.DELETE("/report-types/:id", reporttypes.DeleteReportType)

	// -------------------- Reviewers --------------------
	reviewerGroup := r.Group("/reviewers")
	{
		reviewerGroup.GET("/", reports.ListReviewers) // dropdown options
		reviewerGroup.GET("/by-username/:username", reports.GetReviewerByUsername)
		reviewerGroup.GET("/:rid/reports", reports.GetReportsByReviewer)
	}

	//---------------------------------------------------------
	billrGroup := r.Group("/bills")
	{
		billrGroup.GET("/", bill.GetBills)
		billrGroup.GET("/:id", bill.GetBillByID)
		billrGroup.POST("/", bill.CreateBill)
		billrGroup.PUT("/:id", bill.UpdateBill)
		billrGroup.DELETE("/:id", bill.DeleteBill)

	}

	//---------------------------------------------------------
	// Grades
	gradeGroup := r.Group("/grades")
	{
		gradeGroup.GET("/", grade.GetGradeAll)
		gradeGroup.POST("/", grade.CreateGrade)
	}
	// -------------------- Genders --------------------
	r.GET("/genders", gender.GetGenderAll)

	// -------------------- Run Server --------------------
	// เปิดให้บริการที่ localhost:8000
	r.Run("localhost:" + port)
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin != "" {
			// ถ้าต้องใช้ cookie/credentials (เช่น Authorization)
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Vary", "Origin")
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		} else {
			// ถ้าไม่ใช้ credentials ก็เปิด * ได้
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Headers",
			"Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, Accept, Origin, Cache-Control, X-Requested-With")
		// ชื่อ header ต้องเป็น Methods (มี s)
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent) // 204
			return
		}

		c.Next()
	}
}
