package config

import (
	"fmt"
	"reg_system/entity"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

func DB() *gorm.DB {
	return db
}

func ConnectionDB() {

	database, err := gorm.Open(sqlite.Open("testDB.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		panic("failed to connect")
	}
	fmt.Println("Connect to database successfully")
	db = database
}

func SetupDatabase() {
	db.AutoMigrate(
		&entity.Faculty{},
		&entity.Majors{},
		&entity.Degree{},
		&entity.Position{},
		&entity.Gender{},

		&entity.Students{},
		&entity.Teachers{},
		&entity.Admins{},
		&entity.Users{},
		&entity.StatusStudent{},

		&entity.BookPath{},
		&entity.Curriculum{},

	)

	
}
