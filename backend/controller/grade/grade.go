package grade

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetGradeAll(c *gin.Context) {
	var grades []entity.Grades
	db := config.DB()

	result := db.
		Preload("Students").
		Preload("Subject").
		Find(&grades)

	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error:": "Failed to get grade"})
		return
	}

	c.JSON(http.StatusOK, &grades)
}

func CreateGrade(c *gin.Context) {
	var gradesInput []entity.Grades

	if err := c.ShouldBind(&gradesInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error:": err.Error()})
		return
	}

	db := config.DB()
	result := db.CreateInBatches(&gradesInput, len(gradesInput))
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gradesInput)
	/*grades := new(entity.Grades)

	if err := c.ShouldBindJSON(&grades); err != nil {
		c.JSON(http.StatusBadRequest , gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Create(&grades)
	if result.Error != nil{
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK , grades)*/
}

func GetGradeByStudentID(c *gin.Context) {

	// Step 1: รับ StudentID มาเก็บไว้ที่ sid
	// กำหนดตัวเเปรมารับ grades []entity.Grade
	// query ข้อมูลทั้งหมดจาก entity.Grade ด้วย sid
	// จากนั้นนำมาเก็บที่ grades[]
	sid := c.Param("id")
	var grades []entity.Grades

	db := config.DB()

	result := db.Preload("Subject").Find(&grades, "student_id = ?", sid)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "grade student not found"})
		return
	}

	//--------------------------------------------------------------------------
	// Step 2: สร้าง Struct ข้อมูลที่ต้องการส่งออก เช่น SubjectName , Credit , ...
	// สาเหตุที่ต้องสร้าง Struct เพราะข้อมูลอยู่ในรูป object ของ Subject frontend รับข้อมูลเเบบนั้นไม่ได้
	// ใช้ loop ในการวนค่า array ของ grade ใน [] ออกมา
	// append ค่าเข้าตัวเเปรที่สร้างไว้ด้วย Struct ที่สร้างขึ้นมา

	// ประกาศตัวเเปรเป็น Struct ที่ส่งออกข้อมูล
	var response []GradeResponse

	for _, grade := range grades {
		subjectName := ""
		credit := 0

		if grade.Subject != nil {
			subjectName = grade.Subject.SubjectName
			credit = grade.Subject.Credit
		}

		response = append(response , GradeResponse{
			SubjectID: grade.SubjectID,
			SubjectName: subjectName,
			Credit: credit,
			Grade: grade.Grade,
		})
	}

	c.JSON(http.StatusOK, &response)

}

type GradeResponse struct {
	SubjectID   string `json:"SubjectID"`
	SubjectName string `json:"SubjectName"`
	Credit      int    `json:"Credit"`
	Grade       string `json:"Grade"`
}
