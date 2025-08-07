package auth

import (

	"reg_system/entity"
	"reg_system/config"
)

func HandleStudentLogin(user *entity.Users) (map[string]interface{},error){
	student := new(entity.Students)

	db := config.DB()
	if err := db.First(&student , "student_id = ?" , user.Username).Error; err != nil {
		return nil , err
	}
	
	// ส่งข้อมูลออก
	StudentData := map[string]interface{}{
		"message": "Login success",
		"Username": user.Username,
		"Role": user.Role,
		"FirstName": student.FirstName,
		"LastName": student.LastName,
	}
	return StudentData , nil
}
