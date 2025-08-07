package users

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"reg_system/config"
	"reg_system/controller/auth"
	"reg_system/entity"
	"reg_system/services"
)

type Authen struct {
	Username string `json:"Username"`
	Password string `json:"Password"`
}

func SignIn(c *gin.Context) {
	payload := new(Authen)
	user := new(entity.Users)

	if err := c.ShouldBind(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ค้นหา user ด้วย Username ที่กรอกเข้ามา SignIn
	db := config.DB()
	result := db.First(&user, "Username = ?", payload.Username)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	// Cheack รหัสผ่าน
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(payload.Password))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "password is incerrect"})
		return
	}

	// กำหนด SecretKey , Issuer
	jwtWrapper := services.JwtWrapper{
		SecretKey:       "Jdlkdd9cdfdfinfo54vnddi",
		Issuer:          "AuthService",
		ExpirationHours: 24,
	}

	signedToken, err := jwtWrapper.GenerateToken(user.Username , user.Role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "error signing token"})
		return
	}
	var respData map[string]interface{}
	var e error

	// เเยก Role
	switch user.Role {

	case "student":
		respData , e = auth.HandleStudentLogin(user)

	case "admin":
		respData , e = auth.HandleAdminLogin(user)

	case "teacher":
		respData , e = auth.HandleTeacherLogin(user)

	default:
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized role"})
		return
	}

	if e != nil{
	c.JSON(http.StatusInternalServerError, gin.H{"error": e.Error()})
		return	
	}

	// เติม token เข้า response respData
	respData["token_type"] = "Bearer"
	respData["token"] = signedToken
	respData["id"] = user.ID

	// ส่ง JSON ออก
	c.JSON(http.StatusOK , respData)
}