package entity

import (
	
	"time"
)

type Bill struct{
	Bill_id			string		`gorm:"primary key" json:"Bill_id"`
	Date 			time.Time	`json:"Date"`
	Registion_id	string		`gorm:"foreign key" json:"Registion_id"`
}