package users

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"reg_system/config"
	"reg_system/entity"
)

func ResetPassword(c *gin.Context) {
	user := &entity.Users{}

	// กำหนด struct ในการเปลี่ยนรหัสขึ้นมา คือ Username , NewPassword , OldPassword
	var payload struct {
		Username    string `json:"Username" binding:"required"`
		NewPassword string `json:"NewPassword" binding:"required"`
	}

	// ดึงข้อมูลออกจาก body ด้วย ShouldBindJSON
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ค้นหา username ที่ได้เเล้วเก็บไว้ที่ &user
	db := config.DB()
	if err := db.Where("username = ?", payload.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username is incorrect"})
		return
	}

	// hashNewPassord ก่อน update password
	hashNewPassword, _ := config.HashPassword(payload.NewPassword)
	result := db.Model(&user).Update("password", hashNewPassword)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to reset password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "reset password success"})

}

func ChangePassword (c *gin.Context){
	// ดึง id มาเก็บไว้ที่ username
	username := c.Param("id")
	user := &entity.Users{}

	// กำหนด struct ในการเปลี่ยนรหัสขึ้นมา คือ NewPassword , OldPassword
	var payload struct {
		OldPassword string `json:"OldPassword" binding:"required"`
		NewPassword string `json:"NewPassword" binding:"required"`
	}

	// ดึงข้อมูลออกจาก body ด้วย ShouldBindJSON
	if err := c.ShouldBindJSON(&payload); err != nil{
		c.JSON(http.StatusBadRequest , gin.H{"error":err.Error()})
		return
	}

	// ค้นหา username ที่ได้เเล้วเก็บใน &user
	db := config.DB()
	if err := db.Where("username = ?",username).First(&user).Error ; err != nil {
		c.JSON(http.StatusBadRequest , gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบรหัสผ่านเก่า 
	// config.CheckPassword return ค่าเป็น bool
	if ! config.CheckPassword([]byte(payload.OldPassword) , []byte(user.Password)) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "old password is incorrect"})
		return
	}

	// hashNewPassword ก่อน Update password
	hashNewPassword , _ := config.HashPassword(payload.NewPassword)
	result := db.Model(&user).Update("password",hashNewPassword)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to change password"})
		return
	}

	c.JSON(http.StatusOK , gin.H{"message": "change password success"})
}