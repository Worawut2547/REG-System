package grade

import (
	"math"
	"reg_system/entity"
)

// เเปลงเกรดตัวอักษร -> ตัวเลข
// เช่น A -> 4 , B+ -> 3.5
var gradePointMap = map[string]float64{
	"A": 4.0,
	"B+": 3.5,
	"B": 3.0,
	"C+": 2.5,
	"C": 2.0,
	"D+": 1.5,
	"D": 1.0,
	"F": 0.0,
}



// คำนวณ GPA จาก grade เเละ Credentials
func CalculateGPA(grades []entity.Grades)float64{
	totalScore := 0.0
	totalCredit := 0.0

	for _,g := range grades{
		if g.Subject != nil {
			credit := float64(g.Subject.Credit)

			point , ok := gradePointMap[g.Grade]
			if !ok {
				continue 
			}

			totalScore += point * credit
			totalCredit += credit
		}
	}
	if totalCredit == 0 {
		return 0.0
	}

	return math.Round((totalScore/totalCredit)*100)/100
}