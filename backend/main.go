package main

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-contrib/cors"
	"reg_system/config"
	"reg_system/controller/students"
	"net/http"
)

func main() {
	config.ConnectionDB()
	config.SetupDatabase()

	r := gin.Default()

	r.Use(cors.Default())

	r.Use(CORSMiddleware())
	studentsGroup := r.Group("/students")
	{
		studentsGroup.GET("/", students.GetStudents)
		studentsGroup.POST("/", students.CreateStudent)
		studentsGroup.PUT("/:id", students.UpdateStudent)
		studentsGroup.DELETE("/:id", students.DeleteStudent)
	}

	r.Run("localhost:8080") // Run on port 8080
}

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// ตั้งค่า CORS headers
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // หรือกำหนด origin ที่เฉพาะเจาะจงก็ได้
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

		// ✅ จัดการ Preflight Request (OPTIONS)
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent) // ส่งกลับ 204 No Content
			return
		}

		// ✅ ทำงานต่อไปยัง handler อื่น ๆ
		c.Next()

		// ✅ ตรวจสอบ error ที่เกิดระหว่างการทำงาน
		if len(c.Errors) > 0 {
			c.JSON(-1, gin.H{
				"status": "error",
				"errors": c.Errors.JSON(),
			})
		}
	}
}
