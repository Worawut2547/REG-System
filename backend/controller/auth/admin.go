package auth

import (

	"reg_system/entity"
	"reg_system/config"
)

func HandleAdminLogin(user *entity.Users) (map[string]interface{},error){
	admin := new(entity.Admins)

	db := config.DB()
	if err := db.First(&admin , "admin_id = ?" , user.Username).Error; err != nil {
		return nil , err
	}
	
	// ส่งข้อมูลออก
	AdminData := map[string]interface{}{
		"message": "Login success",
		"Username": user.Username,
		"Role": user.Role,
		"FirstName": admin.FirstName,
		"LastName": admin.LastName,
	}
	return AdminData , nil
}
