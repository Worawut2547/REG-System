package config

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"fmt"
	"reg_system/entity"	
)
var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {
	
	database, err := gorm.Open(sqlite.Open("KUY"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		panic("failed to connect")
	}
	fmt.Println("Connect to database successfully")
	db = database
}

func SetupDatabase(){
	db.AutoMigrate(
		&entity.Students{},
	)


	students := entity.Students{
		Student_id: "B6616052",
		FirstName: "Worawut",
		LastName: "Tattong",
		Gender: "Male",
		Email: "wut@gmail.com",
		Phone: "089101225",
		Citizen_id: "1100411401",
	} 

	db.FirstOrCreate(&students)
}