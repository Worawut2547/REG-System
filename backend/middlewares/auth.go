package middlewares

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"reg_system/services"
)

var jwtService = &services.JwtWrapper{
	SecretKey: "Jdlkdd9cdfdfinfo54vnddi",
	Issuer: "AuthService",
	ExpirationHours: 24,
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context){
		// ดึง token จาก header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is missing"})
			c.Abort()
			return
		}
		// เเยก Bearer ออกจาก token
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization header format"})
			c.Abort()
			return
		}

		token := parts[1]

		// ใช้ ValidationToken จาก services
		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// เก็บ user info ลง Context
		c.Set("user",claims)

		c.Next()
	}
}