package scores

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"
	"time"

	"github.com/gin-gonic/gin"
)

type ScoreResponse struct {
	SubjectID    string    `json:"SubjectID"`
	SubjectName  string    `json:"SubjectName"`
	Credit       int       `json:"Credit"`
	Score        float64   `json:"Score"`
	FullScore    int       `json:"Score_Total"`
	Date         time.Time `json:"Date"`
	StudentID    string    `json:"StudentID"`
	List         string    `json:"List"`
	Term         int       `json:"Term"`
	AcademicYear int       `json:"AcademicYear"`
}

func GetScoreByStudentID(c *gin.Context) {
	// Step 1: รับ StudentID มาเก็บไว้ที่ sid
	// กำหนดตัวเเปรมารับ scores []entity.Scores
	// query ข้อมูลทั้งหมดจาก entity.Scores ด้วย sid
	// จากนั้นนำมาเก็บที่ scores[]
	sid := c.Param("id")
	var score []entity.Scores

	db := config.DB()
	result := db.
		Preload("Student").
		Preload("Subject").
		Preload("Subject.Semester").
		Find(&score, "student_id = ?", sid)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "score student not found"})
		return
	}

	//--------------------------------------------------------------------------
	// Step 2: สร้าง Struct ข้อมูลที่ต้องการส่งออก เช่น SubjectName , Credit , ...
	// สาเหตุที่ต้องสร้าง Struct เพราะข้อมูลอยู่ในรูป object ของ Subject frontend รับข้อมูลเเบบนั้นไม่ได้
	// ใช้ loop ในการวนค่า array ของ score ใน [] ออกมา
	// append ค่าเข้าตัวเเปรที่สร้างไว้ด้วย Struct ที่สร้างขึ้นมา

	// ประกาศตัวเเปรเป็น Struct ที่ส่งออกข้อมูล
	var response []ScoreResponse
	for _, sc := range score {
		subjectName := ""
		credit := 0
		term := 0
		academicYear := 0

		if sc.Subject != nil {
			subjectName = sc.Subject.SubjectName
			credit = sc.Subject.Credit

			if sc.Subject.Semester != nil {
				term = sc.Subject.Semester.Term
				academicYear = sc.Subject.Semester.AcademicYear
			}
		}

		response = append(response, ScoreResponse{
			SubjectID:    sc.SubjectID,
			SubjectName:  subjectName,
			Credit:       credit,
			Score:        sc.Score,
			FullScore:    sc.FullScore,
			List:         sc.List,
			Date:         sc.CreatedAt,
			Term:         term,
			AcademicYear: academicYear,
			StudentID:    sc.StudentID,
		})
	}

	c.JSON(http.StatusOK, &response)
}

func CreateScores (c *gin.Context){
	var scoreInput []entity.Scores

	if err := c.ShouldBindJSON(&scoreInput);err != nil {
		c.JSON(http.StatusBadRequest , gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	tx := db.Begin()

	if err := tx.CreateInBatches(&scoreInput , len(scoreInput)).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create score student"})
		return
	}
	tx.Commit()

	c.JSON(http.StatusOK , gin.H{"message": "create scores success"})

}
