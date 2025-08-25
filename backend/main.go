package main

import (
	"net/http"
	"reg_system/config"
	"reg_system/test"

	"reg_system/controller/admins"
	"reg_system/controller/curriculum"
	"reg_system/controller/gender"

	"reg_system/controller/teachers"

	"reg_system/controller/students"

	"reg_system/controller/degree"
	"reg_system/controller/faculty"
	"reg_system/controller/subjectcurriculum"
	"reg_system/controller/major"
	"reg_system/controller/position"
	"reg_system/controller/status"
	subjects "reg_system/controller/subject"
	"reg_system/controller/subjectstudytime"
	"reg_system/controller/users"

	"github.com/gin-contrib/cors"
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
	r.Use(cors.Default())
	r.Use(CORSMiddleware())

	// -------------------- Auth --------------------
	r.POST("/signin", users.SignIn)

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
	}

	// -------------------- Teachers --------------------
	teacherGroup := r.Group("/teachers")
	{
		teacherGroup.GET("/:id", teachers.GetTeacherID)
		teacherGroup.POST("/", teachers.CreateTeacher)
		teacherGroup.GET("/", teachers.GetTeacherAll)
		teacherGroup.PUT("/:id", teachers.UpdateTeacher)
		teacherGroup.DELETE("/:id", teachers.DeleteTeacher)
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

	// -------------------- Statuses --------------------
	statusGroup := r.Group("/statuses")
	{
		statusGroup.GET("/", status.GetStatusStudentAll)
		statusGroup.POST("/", status.CreateStatus)
	}

// -------------------- Curriculums --------------------
curriculumGroup := r.Group("/curriculums")
{
    curriculumGroup.GET("/", curriculum.GetCurriculumAll)         // GET /curriculums
    curriculumGroup.GET("/:curriculumId", curriculum.GetCurriculumByID) // GET /curriculums/:id
    curriculumGroup.POST("/", curriculum.CreateCurriculum)        // POST /curriculums
    curriculumGroup.PUT("/:curriculumId", curriculum.UpdateCurriculum)  // PUT /curriculums/:id
    curriculumGroup.PATCH("/:curriculumId", curriculum.UpdateCurriculum) // PATCH /curriculums/:id
    curriculumGroup.DELETE("/:curriculumId", curriculum.DeleteCurriculum) // DELETE /curriculums/:id
}

// -------------------- Books (files) --------------------
bookGroup := r.Group("/books")
{
    bookGroup.GET("/", curriculum.GetBookPathAll)      // GET /books
    bookGroup.GET("/:id", curriculum.GetBookPathByID)  // GET /books/:id (อ่าน metadata ไฟล์)
    bookGroup.POST("/upload", curriculum.UploadBookFile) // POST /books/upload (อัปโหลดไฟล์)
    bookGroup.GET("/download/:id", curriculum.DownloadBookFile) // GET /books/download/:id (ดาวน์โหลดไฟล์)
    bookGroup.DELETE("/:id", curriculum.DeleteBookFile) // DELETE /books/:id (ลบไฟล์ + metadata)
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
		// รายการวิชาทั้งหมด
		subjectGroup.GET("/", subjects.GetSubjectAll)

		// สร้างวิชาใหม่
		subjectGroup.POST("/", subjects.CreateSubject)

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

