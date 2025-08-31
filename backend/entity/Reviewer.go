package entity

type Reviewer struct {
	Reviewer_id string `gorm:"primaryKey" json:"Reviewer_id"`

	UserID uint   `json:"UserID"`
	User   *Users `gorm:"foreignKey:UserID;references:ID" json:"User"`

	Reports  []Report        `gorm:"foreignKey:Reviewer_id;references:Reviewer_id" json:"-"`
	Comments []ReviewerComment `gorm:"foreignKey:Reviewer_id;references:Reviewer_id" json:"-"`
}
