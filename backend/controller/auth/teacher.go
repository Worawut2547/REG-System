package auth

import (

	"reg_system/entity"
	"reg_system/config"
)

func HandleTeacherLogin(user *entity.Users) (map[string]interface{},error){
	teacher := new(entity.Teachers)

	db := config.DB()
	if err := db.First(&teacher , "teacher_id = ?" , user.Username).Error; err != nil {
		return nil , err
	}
	
	// ส่งข้อมูลออก
	TeacherData := map[string]interface{}{
		"message": "Login success",
		"Username": user.Username,
		"Role": user.Role,
		"FirstName": teacher.FirstName,
		"LastName": teacher.LastName,
	}
	return TeacherData , nil
}
