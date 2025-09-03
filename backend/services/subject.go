package services

import (
	"gorm.io/gorm"
	"reg_system/entity"
)

type SubjectService struct {
	DB *gorm.DB
}

func (s *SubjectService) GetSubjectWithDetails(subjectID string) (*entity.Subject, error) {
	var subject entity.Subject
	err := s.DB.
		Preload("StudyTimes").
		Preload("Semester").
		Preload("Major").
		Preload("Faculty").
		Find(&subject, "subject_id = ?", subjectID).Error
	if err != nil {
		return nil, err
	}
	return &subject, nil
}
