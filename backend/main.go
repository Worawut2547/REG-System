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
	scores "reg_system/controller/score"

	"reg_system/controller/degree"
	"reg_system/controller/faculty"
	"reg_system/controller/major"
	"reg_system/controller/position"
	"reg_system/controller/reports"
	"reg_system/controller/reporttypes"
	"reg_system/controller/registration"
	"reg_system/controller/status"
	"reg_system/controller/students"
	subjects "reg_system/controller/subject"
	"reg_system/controller/sections"
	"reg_system/controller/subjectcurriculum"
	"reg_system/controller/subjectstudytime"
	"reg_system/controller/teachers"
	"reg_system/controller/users"
	"reg_system/controller/graduation"

	"github.com/gin-gonic/gin"
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
	r.Use(CORSMiddleware())
	r.Static("/uploads", "./uploads")

	// -------------------- Auth --------------------
	r.POST("/signin", users.SignIn)

	// -------------------- Users --------------------
	userGroup := r.Group("/users")
	{
		userGroup.PUT("/reset/", users.ResetPassword)
		userGroup.PUT("/:id", users.ChangePassword)
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
		studentGroup.GET("/:id/scores", scores.GetScoreByStudentID)
		// คำร้องของนักศึกษา
		studentGroup.GET("/reports/:sid", reports.GetReportsByStu)
	}

	// -------------------- Teachers --------------------
	teacherGroup := r.Group("/teachers")
	{
		teacherGroup.GET("/:id", teachers.GetTeacherID)
		teacherGroup.POST("/", teachers.CreateTeacher)
		teacherGroup.GET("/", teachers.GetTeacherAll) // admin :Earth
		teacherGroup.PUT("/:id", teachers.UpdateTeacher)
		teacherGroup.DELETE("/:id", teachers.DeleteTeacher)

		teacherGroup.GET("/:id/subjects", teachers.GetSubjectByTeacherID)
		teacherGroup.POST("/grades", grade.CreateGrade)
		teacherGroup.GET("/:id/students", teachers.GetStudentByTeacherID)

		teacherGroup.POST("/scores", scores.CreateScores)
	}

	// -------------------- Majors --------------------
	majorGroup := r.Group("/majors")
	{
		majorGroup.GET("/", major.GetMajorAll)  // admin  :Earth
		majorGroup.POST("/", major.CreateMajor)
	}

	// -------------------- Faculties --------------------
	facultyGroup := r.Group("/faculties")
	{
		facultyGroup.GET("/", faculty.GetFacultyAll) // admin, student, teacher  :Earth
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

		registrationGroup.GET("/subjects/:id", registration.GetStudentBySubjectID)
	}

	// -------------------- Curriculums --------------------
	curriculumGroup := r.Group("/curriculums")
	{
		curriculumGroup.GET("/", curriculum.GetCurriculumAll)                 // admin, student, teacher  :Earth
		curriculumGroup.GET("/:curriculumId", curriculum.GetCurriculumByID)
		curriculumGroup.POST("/", curriculum.CreateCurriculum)                // admin  :Earth  
		curriculumGroup.PUT("/:curriculumId", curriculum.UpdateCurriculum)    // admin  :Earth
		curriculumGroup.PATCH("/:curriculumId", curriculum.UpdateCurriculum)  // admin  :Earth
		curriculumGroup.DELETE("/:curriculumId", curriculum.DeleteCurriculum) // admin  :Earth
	}

	// -------------------- Curriculum Books (files) --------------------
	cb := r.Group("/curriculum-books")
	{
		cb.GET("/", curriculum.GetCurriculumBooks)
		cb.GET("/:id", curriculum.GetCurriculumBookByID)
		cb.POST("/register", curriculum.RegisterCurriculumBookByPath) // admin :Earth
		cb.GET("/preview/:id", curriculum.PreviewCurriculumBook)      // admin, student, teacher  :Earth
		cb.GET("/download/:id", curriculum.DownloadCurriculumBook)
		cb.DELETE("/:id", curriculum.DeleteCurriculumBook)
	}

	// -------------------- Subject-Curriculums (link) --------------------
	subjectCurriculumGroup := r.Group("/subject-curriculums")
	{
		subjectCurriculumGroup.GET("/", subjectcurriculum.GetSubjectCurriculumAll)       // admin, student, teacher  :Earth
		subjectCurriculumGroup.GET("/:id", subjectcurriculum.GetSubjectCurriculumByID)
		subjectCurriculumGroup.POST("/", subjectcurriculum.CreateSubjectCurriculum)      // admin  :Earth
		subjectCurriculumGroup.DELETE("/:id", subjectcurriculum.DeleteSubjectCurriculum) // admin  :Earth
	}

	// -------------------- Subjects & Study Times --------------------
	subjectGroup := r.Group("/subjects")
	{
		// รายการวิชาทั้งหมด
		subjectGroup.GET("/", subjects.GetSubjectAll)
		subjectGroup.GET("", subjects.GetSubjectAll)

		// สร้างวิชาใหม่
		subjectGroup.POST("/", subjects.CreateSubject)
		subjectGroup.POST("", subjects.CreateSubject)

		// กลุ่มเส้นทางของวิชาเฉพาะตัว (RESTful)
		subjectItem := subjectGroup.Group("/:subjectId")
		{
			subjectItem.GET("", subjects.GetSubjectID)
			subjectItem.PUT("", subjects.UpdateSubject)    // admin  :Earth
			subjectItem.DELETE("", subjects.DeleteSubject) // admin  :Earth

			// -------------------- Subject Study Times --------------------

			times := subjectItem.Group("/times")
			{
				times.GET("", subjectstudytime.GetBySubject)      // admin  :Earth
				times.GET("/:timeId", subjectstudytime.GetOne)
				times.POST("", subjectstudytime.Create)           // admin  :Earth
				times.PUT("/:timeId", subjectstudytime.Update)    // admin  :Earth
				times.DELETE("/:timeId", subjectstudytime.Delete) // admin  :Earth
			}

			// Sections under a subject
			// GET /subjects/:subjectId/sections -> list sections for that subject
			subjectItem.GET("/sections", sections.GetSectionsBySubject)
		}
    }

	// -------------------- Sections --------------------
	sectionGroup := r.Group("/sections")
	{
		sectionGroup.GET("/", sections.GetSectionAll)
		sectionGroup.GET("/:sectionId", sections.GetSectionByID)
		sectionGroup.POST("/", sections.CreateSection)
		sectionGroup.PUT("/:sectionId", sections.UpdateSection)
		sectionGroup.DELETE("/:sectionId", sections.DeleteSection)
	}

	// -------------------- Reports --------------------
	reportGroup := r.Group("/reports")
	{
		reportGroup.GET("/", reports.GetReportAll)
		reportGroup.GET("/:id", reports.GetReportByID)
		reportGroup.POST("/", reports.CreateReport)
		reportGroup.POST("/:id/attachments", reports.AddReportAttachment)
		reportGroup.PUT("/:id/status", reports.UpdateStatus)
		// comments
		reportGroup.GET("/:id/comments", reports.GetReportComments)
		reportGroup.POST("/:id/comments", reports.CreateReportComment)
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
	billGroup := r.Group("/bills")
	{
		billGroup.GET("/:id", bill.GetBillByStudentID) //student
		billGroup.POST("/:id/create", bill.CreateBill) // student
		billGroup.POST("/upload/:id", bill.UploadReceipt) //student
		billGroup.GET("/preview/:id", bill.ShowFile) // admin
		billGroup.GET("/download/:id", bill.DownloadBill)
		billGroup.GET("/admin/all", bill.GetAllBills) // admin
		billGroup.PUT("/:id", bill.UpdateBillStatus) // ใช้สำหรับอนุมัติใบเสร็จ
	}
	

	//---------------------------------------------------------
	// Grades
	gradeGroup := r.Group("/grades")
	{
		gradeGroup.GET("/", grade.GetGradeAll)
		gradeGroup.POST("/", grade.CreateGrade)
	}

	//---------------------------------------------------------
	// Grades
	scoreGroup := r.Group("/scores")
	{
		scoreGroup.GET("/:id",scores.GetScoreByStudentID)
		scoreGroup.POST("/",scores.CreateScores)
	}

	//---------------------------------------------------------

	// -------------------- Genders --------------------
	r.GET("/genders", gender.GetGenderAll)

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
