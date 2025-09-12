package entity

import "time"

type ReviewerComment struct {
	Comment_id string `gorm:"primaryKey" json:"Comment_id"`
	CommentText string    `json:"CommentText"`
	CommentDate time.Time `json:"CommentDate"`

	Reviewer_id string    `json:"Reviewer_id"`
	Reviewer   *Reviewer `gorm:"foreignKey:Reviewer_id;references:Reviewer_id" json:"Reviewer"`

	Report_id string   `json:"Report_id"`
	Report   *Report  `gorm:"foreignKey:Report_id;references:Report_id" json:"Report"`
}