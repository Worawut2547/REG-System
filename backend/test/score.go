package test

import (
	"reg_system/config"
	"reg_system/entity"
)

func ScoresExample() {
	db := config.DB()

	scores := []entity.Scores{
		// Student B6630652
		{StudentID: "B6630652", SubjectID: "233001", List: "Final", Score: 45},
		{StudentID: "B6630652", SubjectID: "233001", List: "Midterm", Score: 38},
		{StudentID: "B6630652", SubjectID: "233001", List: "Homework", Score: 18},

		{StudentID: "B6630652", SubjectID: "233072", List: "Final", Score: 42},
		{StudentID: "B6630652", SubjectID: "233072", List: "Midterm", Score: 35},

		// Student B6616052
		{StudentID: "B6616052", SubjectID: "233001", List: "Final", Score: 40, FullScore: 40},
		{StudentID: "B6616052", SubjectID: "233001", List: "Midterm", Score: 36, FullScore: 40},
		{StudentID: "B6616052", SubjectID: "233001", List: "Homework", Score: 19,FullScore: 20},

		{StudentID: "B6616052", SubjectID: "233072", List: "Final", Score: 38,FullScore: 50},
		{StudentID: "B6616052", SubjectID: "233072", List: "Midterm", Score: 37,FullScore: 50},
	}

	for _, s := range scores {
		db.Save(&s)
	}
}