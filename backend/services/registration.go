package services

import (
    "errors"
    "strconv"
    "time"

    "gorm.io/gorm"
    "reg_system/entity"
)

type RegistrationService struct {
	DB *gorm.DB
}

func (s *RegistrationService) Create(reg *entity.Registration) error {
	if reg == nil {
		return errors.New("nil registration")
	}
	if reg.Date.IsZero() {
		reg.Date = time.Now()
	}
	return s.DB.Create(reg).Error
}

func (s *RegistrationService) CreateBulk(studentID string, items []entity.Registration) error {
	if studentID == "" || len(items) == 0 {
		return errors.New("invalid bulk payload")
	}
	tx := s.DB.Begin()
	for i := range items {
		items[i].StudentID = studentID
		if items[i].Date.IsZero() {
			items[i].Date = time.Now()
		}
		if err := tx.Create(&items[i]).Error; err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit().Error
}

func (s *RegistrationService) FindAll(studentID string) ([]entity.Registration, error) {
	var regs []entity.Registration
	q := s.DB.
		Preload("Student").
		Preload("Subject").
		Preload("Section")
	if studentID != "" {
		q = q.Where("student_id = ?", studentID)
	}
	if err := q.Find(&regs).Error; err != nil {
		return nil, err
	}
	return regs, nil
}

func (s *RegistrationService) FindByRegID(registrationID string) (*entity.Registration, error) {
    var reg entity.Registration
	q := s.DB.
		Preload("Student").
		Preload("Subject").
		Preload("Section")
	// รองรับทั้งรหัสแบบ REG### และเลข ID
	if n, err := strconv.Atoi(registrationID); err == nil {
		if err := q.First(&reg, "id = ?", n).Error; err != nil {
			return nil, err
		}
		return &reg, nil
	}
    if err := q.First(&reg, "registration_id = ?", registrationID).Error; err != nil {
        return nil, err
    }
    return &reg, nil
}

func (s *RegistrationService) UpdateByRegID(registrationID string, patch entity.Registration) error {
    var reg entity.Registration
    if n, err := strconv.Atoi(registrationID); err == nil {
        if err := s.DB.First(&reg, "id = ?", n).Error; err != nil { return err }
    } else {
        if err := s.DB.First(&reg, "registration_id = ?", registrationID).Error; err != nil { return err }
    }
    if !patch.Date.IsZero() {
        reg.Date = patch.Date
    }
	if patch.SubjectID != "" {
		reg.SubjectID = patch.SubjectID
	}
	if patch.SectionID != 0 {
		reg.SectionID = patch.SectionID
	}
	if patch.StudentID != "" {
		reg.StudentID = patch.StudentID
	}
    return s.DB.Save(&reg).Error
}

func (s *RegistrationService) DeleteByRegID(registrationID string) error {
    if n, err := strconv.Atoi(registrationID); err == nil {
        return s.DB.Delete(&entity.Registration{}, "id = ?", n).Error
    }
    return s.DB.Delete(&entity.Registration{}, "registration_id = ?", registrationID).Error
}
