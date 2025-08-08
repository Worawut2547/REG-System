package entity

type Payments struct{	
	Payment_id			int 	`gorm:"primary key" json:"Payment_id"`
	Payment_method_id	int 	`gorm:"foreign key" json:"Payment_method_id"`
	Payment_status_id 	int 	`gorm:"foreign key" json:"Payment_status_id"`
	Bill_id				string	`gorm:"foreign key" json:"Bill_id"`
}