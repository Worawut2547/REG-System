// services/graduation.go
package services

import (
    "reg_system/config"
)

func CalculateTotalCredits(studentID string) (int, error) {
    db := config.DB()
    var totalCredits int
    err := db.Table("registrations").
        Joins("JOIN subjects ON registrations.subject_id = subjects.subject_id").
        Where("registrations.student_id = ?", studentID).
        Select("SUM(subjects.credit)").Scan(&totalCredits).Error
    if err != nil {
        return 0, err
    }
    return totalCredits, nil
}
