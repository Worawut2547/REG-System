package entity


type Payment_status struct{
	ID 				int		`gorm:"primary key" json:"id"`
	Payment_status 	string	`json:"Payment_status"`
}