package test

import (
    "reg_system/config"
    "reg_system/entity"
    //"time"
)

func GraduationExample() {
    db := config.DB()

   graduation := []entity.Graduation{
		/*{ID: 1, GraduationID: "1"  ,Date: time.Now(), StudentID: "B6630652",CurriculumID: "curr23"},*/
		
	}

    for _, post := range graduation {
		db.Save(&post)
	}
}