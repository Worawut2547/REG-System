package middlewares

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"reg_system/services"
)

// Map role -> permission
var RolePermission = map[string][]string{
	"admin": {
		"admin.read.self",
		"student.create", "student.read", "student.delete",
		"teacher.create", "teacher.delete",
		"create.curr", "update.curr", "delete.curr",
		"create.sub-curr", "delete.sub-curr",
		"create.curr-book",
		"create.sub", "update.sub", "delete.sub",
		"create.sub-time" , "update.sub-time", "delete.sub-time",
		"admin.read.bill", "admin.read.all.bill", "admin.update.bill",

		"read.graduation",
	},

	"student": {
		"student.read.self", "student.update.self",
		"student.read.grade",
		"student.read.score",
		"student.read.bill.self", "student.create.bill.self", "student.upload.bill",

		"read.graduation.self", "create.graduation",
	},

	"teacher": {
		"teacher.read.self", "teacher.update.self", "teacher.teach",
		"teacher.show.student",
		"teacher.create.grade",
		"teacher.create.score",
	},
}

// Route -> Permission Mapping
var RoutePermission = map[string]string{
	// admin
	"GET /admin/:id": "admin.read.self",

	// student
	"GET /students/":       "student.read",
	"GET /students/:id":    "student.read.self",
	"PUT /students/:id":    "student.update.self",
	"DELETE /students/:id": "student.delete",
	"POST /students/":      "student.create",

	"GET /students/:id/grades": "student.read.grade",
	"GET /students/:id/scores": "student.read.score",

	// teacher
	//"GET /teachers/":                  "teacher.read",
	"GET /teachers/:id":               "teacher.read.self",
	"PUT /teachers/:id":               "teacher.update.self",
	"DELETE /teachers/:id":            "teacher.delete",
	"POST /teachers/":                 "teacher.create",
	"GET /teachers/:id/subjects":      "teacher.teach",
	"GET /registrations/subjects/:id": "teacher.show.student",

	"POST /teachers/grades": "teacher.create.grade",
	"POST /teachers/scores": "teacher.create.score",

	// curriculum
	"POST /curriculums/":                "create.curr",
	"PUT /curriculums/:curriculumId":    "update.curr",
	"DELETE /curriculums/:curriculumId": "delete.curr",

	// curriculum book
	"POST /curriculum-books/register": "create.curr-book",

	// subject curriculum
	"POST /subject-curriculums/":      "create.sub-curr",
	"DELETE /subject-curriculums/:id": "delete.sub-curr",

	// subject
	"POST /subjects/": "create.sub",
	"DELETE /subjects/:subjectId": "delete.sub",
	"PUT /subjects/:subjectId": "update.sub",

	// subject study time
	//"GET /subjects/:subjectId/times": "read.sub-time",
	"POST /subjects/:subjectId/times": "create.sub-time",
	"DELETE /subjects/:subjectId/times/:timeId": "delete.sub-time",
	"PUT /subjects/:subjectId/times/:timeId": "update.sub-time",

	// bill
	"GET /bills/:id":         "student.read.bill.self",
	"POST /bills/:id/create": "student.create.bill.self",
	"POST /bills/upload/:id/:year/:term": "student.upload.bill",
	"GET /bills/preview/:id": "admin.read.bill",
	"GET /bills/admin/all":   "admin.read.all.bill",
	"PUT /bills/:id":         "admin.update.bill",

	// graduation
	"GET /graduations/": "read.graduation",
	"POST /graduations/": "create.graduation",
	"GET /graduations/:id": "read.graduation.self",
	"PUT /graduations/:id": "any",

	// anyone
	"GET /majors/":    "any",
	"GET /faculties/": "any",
	"GET /degrees/":   "any",
	"GET /genders/":   "any",
	"GET /positions/": "any",

	"GET /teachers/":   "any",
	"GET /curriculums/":         "any",
	"GET /curriculum-book/preview/:id":  "any",
	"GET /subject-curriculums/": "any",
	"GET /subjects/":            "any",
	"GET /subjects/:subjectId/times": "any",

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

		// ดึง permission ที่ route ต้องการ
		requiredPerm, ok := RoutePermission[routeKey]
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "route permission not defined"})
			c.Abort()
			return
		}

		// ถ้า route ต้องการ permission "any" ทุก role ผ่าน
		if requiredPerm == "any" {
			c.Next()
			return
		}

		// ดุึง permission ของ route
		permissions := RolePermission[claims.Role]

		allowed := false
		for _, p := range permissions {
			if p == requiredPerm {
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
