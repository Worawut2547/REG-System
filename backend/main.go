package main

import (
	
	"reg_system/config"
	
	"reg_system/controller/admins/profile"
	"reg_system/controller/teachers/profile"
	"reg_system/controller/students/profile"
	
	"reg_system/controller/users"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

const port = "8000"

func main() {
	config.ConnectionDB()
	config.SetupDatabase()

	r := gin.Default()

	r.Use(cors.Default())

	r.Use(CORSMiddleware())


	// Authentication
	r.POST("/signin" , users.SignIn)


	//---------------------------------------------------------
	//Admin
	adminGroup := r.Group("/admin"); {
		adminGroup.GET("/:id",admins.GetAdminID)
	}
	//---------------------------------------------------------


	//---------------------------------------------------------
	//Student
	studentGroup := r.Group("/student"); {
		studentGroup.GET("/:id", students.GetStudentID)
		studentGroup.POST("/create",students.CreateStudent)
		studentGroup.GET("/all" , students.GetStudentAll)
	}
	//---------------------------------------------------------


	//---------------------------------------------------------
	//Teacher
	teacherGroup := r.Group("/teacher");{
		teacherGroup.GET("/:id", teachers.GetTeacherID)
		teacherGroup.POST("/create" , teachers.CreateTeacher)
		teacherGroup.GET("/all" , teachers.GetTeacherAll)
	}


	// Run on port 8000
	r.Run("localhost:" +port)
}



func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		
		// ตั้งค่า CORS headers
		c.Writer.Header().Set("Access-Control-Allow-Origin" , "*") //อนุญาตให้ port ที่จะมาเชื่อมต่อ (* อนุญาตทั้งหมด)
		c.Writer.Header().Set("Access-Control-Allow-Credentials" , "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Method" , "GET , POST , PUT , DELETE , OPTIONS",)

		if c.Request.Method == "OPTIONS"{
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
