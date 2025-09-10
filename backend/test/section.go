package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func SectionExample() {
    db := config.DB()

    sections := []entity.Section{
		{ID: 1, SectionID: "SEC001", Group: 1, DateTeaching: "Wednesday: 9:00-12:00", SubjectID: "233031"},
		{ID: 2, SectionID: "SEC002", Group: 2, DateTeaching: "Wednesday: 13:00-14:00", SubjectID: "233031"},
		{ID: 3, SectionID: "SEC003", Group: 1, DateTeaching: "Monday: 10:00-12:00", SubjectID: "233001"},
		{ID: 4, SectionID: "SEC004", Group: 2, DateTeaching: "Monday: 13:00-15:00", SubjectID: "233001"},
		{ID: 5, SectionID: "SEC005", Group: 1, DateTeaching: "Tuesday: 13:00-16:00, Tuesday: 16:00-19:00", SubjectID: "233072"},
		{ID: 6, SectionID: "SEC006", Group: 2, DateTeaching: "Wednesday: 8:00-12:00", SubjectID: "233012"},
    }

    for _, section := range sections {
        var exist entity.Section
        if err := db.Where("section_id = ?", section.SectionID).First(&exist).Error; err == nil {
            // อัปเดตข้อมูลตาม seed เพื่อให้ตรงกับ section.go เสมอ
            db.Model(&exist).Updates(map[string]interface{}{
                "group":         section.Group,
                "date_teaching": section.DateTeaching,
                "subject_id":    section.SubjectID,
            })
        } else {
            db.Create(&section)
        }
    }
}
