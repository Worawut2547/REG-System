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

// ------------------------ SERVICE ------------------------
/*func CalculateTotalScore(studentID string, subjectID string) int {
	db := config.DB()

	var scores []entity.Scores
	db.Where("student_id = ? AND subject_id = ?", studentID, subjectID).Find(&scores)

	total := 0
	for _, s := range scores {
		total += int(s.Score)
	}

	return total
}

// ------------------------ CREATE ------------------------
func CreateScores(c *gin.Context) {
	var scoresInput []entity.Scores

	// Bind JSON (รับ array ของคะแนน)
	if err := c.ShouldBindJSON(&scoresInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// คำนวณ Score_Total สำหรับแต่ละ Student+Subject
	for i, s := range scoresInput {
		total := CalculateTotalScore(*s.Student_id, s.SubjectID) + int(s.Score)
		scoresInput[i].Score_Total = total
	}

	// บันทึกลง DB
	result := db.CreateInBatches(&scoresInput, len(scoresInput))
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// --- สร้าง response แบบย่อ เพื่อส่งกลับ UI ---
	var response []ScoreResponse
	for _, s := range scoresInput {
		response = append(response, ScoreResponse{
			ID:          s.ID,
			SubjectID:   s.SubjectID,
			Score:       s.Score,
			Score_Total: s.Score_Total,
			Date:        s.Date,
			StudentID:   *s.Student_id,
			List:        s.List,
		})
	}

	c.JSON(http.StatusOK, response)
}

// ------------------------ READ ALL (with Role-based Filter) ------------------------
func GetAllScores(c *gin.Context) {
	var scores []entity.Scores
	db := config.DB()

	role, _ := c.Get("role")
	userID, _ := c.Get("userID")

	query := db

	switch role {
	case "teacher":
		query = query.Where("subject_id IN (?)",
			db.Table("subjects_teachers").
				Select("subject_id").
				Where("teacher_id = ?", userID),
		)
	case "student":
		query = query.Where("student_id = ?", userID)
	}

	result := query.Find(&scores)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// คำนวณ Score_Total ล่าสุด
	for i := range scores {
		if scores[i].Student_id != nil {
			scores[i].Score_Total = CalculateTotalScore(*scores[i].Student_id, scores[i].SubjectID)
		}
	}

	var response []ScoreResponse
	for _, s := range scores {
		if s.Student_id != nil {
			response = append(response, ScoreResponse{
				ID:          s.ID,
				SubjectID:   s.SubjectID,
				Score:       s.Score,
				Score_Total: s.Score_Total,
				Date:        s.Date,
				StudentID:   *s.Student_id,
				List:        s.List,
			})
		}
	}

	c.JSON(http.StatusOK, response)
}

// ------------------------ READ BY STUDENT ------------------------
/*func GetScoresByStudentID(c *gin.Context) {
	sid := c.Param("id")
	var scores []entity.Scores

	db := config.DB()
	result := db.Find(&scores, "student_id = ?", sid)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "no scores found for this student"})
		return
	}

	for i := range scores {
		if scores[i].Student_id != nil {
			scores[i].Score_Total = CalculateTotalScore(*scores[i].Student_id, scores[i].SubjectID)
		}
	}

	var response []ScoreResponse
	for _, s := range scores {
		if s.Student_id != nil {
			response = append(response, ScoreResponse{
				ID:          s.ID,
				SubjectID:   s.SubjectID,
				Score:       s.Score,
				Score_Total: s.Score_Total,
				Date:        s.Date,
				StudentID:   *s.Student_id,
				List:        s.List,
			})
		}
	}

	c.JSON(http.StatusOK, response)
}

// ------------------------ UPDATE (partial) ------------------------
func UpdateScore(c *gin.Context) {
	var score entity.Scores

	if err := c.ShouldBindJSON(&score); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Model(&entity.Scores{}).Where("id = ?", score.ID).Updates(score)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// อัปเดต Score_Total ใหม่หลัง Update
	if score.Student_id != nil {
		total := CalculateTotalScore(*score.Student_id, score.SubjectID)
		db.Model(&entity.Scores{}).
			Where("student_id = ? AND subject_id = ?", *score.Student_id, score.SubjectID).
			Update("score_total", total)
		score.Score_Total = total // อัปเดต field ใน struct เพื่อนำไปใช้ใน response
	}

	// --- ส่ง response แบบย่อ ---
	response := ScoreResponse{
		ID:          score.ID,
		SubjectID:   score.SubjectID,
		Score:       score.Score,
		Score_Total: score.Score_Total,
		Date:        score.Date,
		StudentID:   *score.Student_id,
		List:        score.List,
	}

	c.JSON(http.StatusOK, response)
}

// ------------------------ DELETE ------------------------
func DeleteScore(c *gin.Context) {
    id := c.Param("id")
    db := config.DB()

    result := db.Delete(&entity.Scores{}, id)
    if result.Error != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
        return
    }

    if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "score not found"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}*/
