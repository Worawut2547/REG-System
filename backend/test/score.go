package test

import (
	"reg_system/config"
	"reg_system/entity"
	"time"
)

func ScoresExample() {
	db := config.DB()

	scores := []entity.Scores{
		// Student B6630652
		{Student_id: ptrString("B6630652"), SubjectID: "233001", List: "Final", Score: 45, Date: time.Now()},
		{Student_id: ptrString("B6630652"), SubjectID: "233001", List: "Midterm", Score: 38, Date: time.Now()},
		{Student_id: ptrString("B6630652"), SubjectID: "233001", List: "Homework", Score: 18, Date: time.Now()},

		{Student_id: ptrString("B6630652"), SubjectID: "233072", List: "Final", Score: 42, Date: time.Now()},
		{Student_id: ptrString("B6630652"), SubjectID: "233072", List: "Midterm", Score: 35, Date: time.Now()},

		// Student B6616052
		{Student_id: ptrString("B6616052"), SubjectID: "233001", List: "Final", Score: 40, Date: time.Now()},
		{Student_id: ptrString("B6616052"), SubjectID: "233001", List: "Midterm", Score: 36, Date: time.Now()},
		{Student_id: ptrString("B6616052"), SubjectID: "233001", List: "Homework", Score: 19, Date: time.Now()},

		{Student_id: ptrString("B6616052"), SubjectID: "233072", List: "Final", Score: 38, Date: time.Now()},
		{Student_id: ptrString("B6616052"), SubjectID: "233072", List: "Midterm", Score: 37, Date: time.Now()},
	}

	for _, s := range scores {
		db.Create(&s)
	}
}

// helper function สำหรับ pointer string
func ptrString(s string) *string {
	return &s
}