package entity

type ReportType struct {
	ReportType_id   string `gorm:"primaryKey" json:"ReportType_id"`
	ReportType_Name string `json:"ReportType_Name"`
	Description     string `json:"ReportTypeDescription"`

	Reports []Report `gorm:"foreignKey:ReportType_id;references:ReportType_id"  json:"-"`
}
