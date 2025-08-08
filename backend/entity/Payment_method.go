package entity


type Payment_method struct{
	ID             int 		`gorm:"primary key" json:"id"`
	Payment_method string	`json:"Payment_method"`
}