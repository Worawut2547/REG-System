package middlewares

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"reg_system/services"
)

// Route -> Permission Mapping
var RoutePermission = map[string][]string{
	// admin
	"GET /admin/:id": {"admin", "student"},
	// student
	"GET /students/":             {"admin"},
	"GET /students/:id":          {"student"},
	"PUT /students/:id":          {"student"},
	"DELETE /students/:id":       {"admin"},
	"POST /students/":            {"admin"},
	"GET /students/:id/grades":   {"student"},
	"GET /students/:id/scores":   {"student"},
	"GET /students/reports/:sid": {"student"},

	// teacher
	//"GET /teachers/":                  "teacher.read",
	//"GET /teachers/:id":               "teacher.read.self",
	"PUT /teachers/:id":               {"teacher"},
	"DELETE /teachers/:id":            {"admin"},
	"POST /teachers/":                 {"admin"},
	"GET /teachers/:id/subjects":      {"teacher"},
	"GET /registrations/subjects/:id": {"teacher"},
	"POST /teachers/grades":           {"teacher"},
	"POST /teachers/scores":           {"teacher"},

	// curriculum
	"POST /curriculums/":                {"admin"},
	"PUT /curriculums/:curriculumId":    {"admin"},
	"DELETE /curriculums/:curriculumId": {"admin"},

	// curriculum book
	"POST /curriculum-books/register": {"admin"},

	// subject curriculum
	"POST /subject-curriculums/":      {"admin"},
	"DELETE /subject-curriculums/:id": {"admin"},

	// subject
	"POST /subjects/":             {"admin"},
	"DELETE /subjects/:subjectId": {"admin"},
	"PUT /subjects/:subjectId":    {"admin"},
	
	// subject study time
	"POST /subjects/:subjectId/times":           {"admin"},
	"DELETE /subjects/:subjectId/times/:timeId": {"admin"},
	"PUT /subjects/:subjectId/times/:timeId":    {"admin"},

	// bill
	"GET /bills/:id":                     {"student"},
	"POST /bills/:id/create":             {"student"},
	"POST /bills/upload/:id/:year/:term": {"student"},
	"GET /bills/preview/:id":             {"admin"},
	"GET /bills/admin/all":               {"admin"},
	"PUT /bills/:id":                     {"admin"},

	// graduation
	"GET /graduations/":    {"admin"},
	"POST /graduations/":   {"student"},
	"GET /graduations/:id": {"student"},
	"PUT /graduations/:id": {"admin", "student"},

	// registration
	"GET /registrations/:id":    {"student"},
	"POST /registrations/":      {"student"},
	"DELETE /registrations/:id": {"student"},

	// report
	"GET /reports/":              {"admin", "teacher"},
	"GET /reports/:id":           {"admin", "teacher"},
	"POST /reports/":             {"student"},
	"GET /reports/:id/comments":  {"admin", "teacher", "student"},
	"POST /reports/:id/comments": {"teacher", "admin"},
	"PUT /reports/:id/status":    {"teacher", "admin"},

	// report type
	//"GET /report-types/"
	"POST /report-types/":      {"admin"},
	"DELETE /report-types/:id": {"admin"},
	"PUT /report-types/:id":    {"admin"},

	// reviewer
	"GET /reviewers/":                      {"student"},
	"GET /reviewers/by-username/:username": {"teacher", "student"},
	"GET /reviewers/:rid/reports":          {"teacher"},

	// anyone
	"GET /majors/":                     {"admin", "student", "teacher"},
	"GET /faculties/":                  {"admin", "student", "teacher"},
	"GET /degrees/":                    {"admin", "student", "teacher"},
	"GET /genders/":                    {"admin", "student", "teacher"},
	"GET /positions/":                  {"admin", "student", "teacher"},
	"GET /teachers/":                   {"admin", "student", "teacher"},
	"GET /curriculums/":                {"admin", "student", "teacher"},
	"GET /curriculum-book/preview/:id": {"admin", "student", "teacher"},
	"GET /subject-curriculums/":        {"admin", "student", "teacher"},
	"GET /subjects/":                   {"admin", "student", "teacher"},
	"GET /subjects/:subjectId/times":   {"admin", "student", "teacher"},
	"GET /subjects/:subjectId":         {"admin", "student", "teacher"},
	"GET /report-types/":               {"admin", "student", "teacher"},
	"GET /teachers/:id":                {"admin", "student", "teacher"},
}

func PermissionMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {

		// ดึง user จาก context (AuthMiddleware)
		userI, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
			c.Abort()
			return
		}

		claims := userI.(*services.JwtClaim)

		// สร้าง route key = Method + path
		routeKey := c.Request.Method + " " + c.FullPath()

		// หา role ที่มีสิทธิ็ใช้ route นี้
		allowedRoles, ok := RoutePermission[routeKey]
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "route permission not defined"})
			c.Abort()
			return
		}

		// ถ้า role ของ user อยู่ใน allowedRoles ผ่าน
		allowed := false
		for _, role := range allowedRoles {
			if claims.Role == role {
				allowed = true
				break
			}
		}

		if !allowed {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden: insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}
