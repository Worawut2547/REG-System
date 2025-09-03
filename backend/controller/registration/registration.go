package registration

import (
	"time"

	"github.com/gin-gonic/gin"
	"reg_system/config"
	"reg_system/entity"
	"reg_system/services"
)

// POST /api/registrations
func CreateRegistration(c *gin.Context) {
	var payload entity.Registration
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Create(&registration)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Create registration success"})
}
func GetRegistrationAll(c *gin.Context) {
	var registrations []entity.Registration
	db := config.DB()

	result := db.
		Preload("Student").
		Preload("Subject").
		Preload("Subject.Semester").
		Find(&registrations)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	svc := services.RegistrationService{DB: config.DB()}
	if err := svc.CreateBulk(req.StudentID, req.Items); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Create registrations success", "count": len(req.Items)})
}

func GetRegistrationByStudentID(c *gin.Context) {
	sid := c.Param("id")
	var registration []entity.Registration
	db := config.DB()

	result := db.Preload("Subject").
		Preload("Subject.StudyTimes").
		Find(&registration, "student_id = ?", sid)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	var response []RegistrationResponse

	for _, reg := range registration {
		subjectName := ""
		credit := 0
		section := 0
		var startAt time.Time
		var endAt time.Time

		if reg.Subject != nil {
			subjectName = reg.Subject.SubjectName
			credit = reg.Subject.Credit
		}

		for _, st := range reg.Subject.StudyTimes {
			startAt = st.StartAt
			endAt = st.EndAt
		}

		response = append(response, RegistrationResponse{
			SubjectID:   reg.SubjectID,
			SubjectName: subjectName,
			Credit:      credit,
			Section:     section,
			StartAt:     startAt,
			EndAt:       endAt,
		})
	}
	c.JSON(http.StatusOK, &response)
}

func UpdateRegistration(c *gin.Context) {
	id := c.Param("id")
	var registration entity.Registration
	db := config.DB()

	if err := c.ShouldBind(&registration); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.First(&registration, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := db.Save(&registration)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Registration updated successfully"})
}

// DELETE /api/registrations/:id
func DeleteRegistration(c *gin.Context) {
	id := c.Param("id")
	var registration entity.Registration
	db := config.DB()

	if err := db.First(&registration, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Registration not found"})
		return
	}

	result := db.Delete(&registration)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Registration deleted successfully"})
}

type RegistrationResponse struct {
	SubjectID   string `json:"SubjectID"`
	SubjectName string `json:"SubjectName"`
	Section     int    `json:"Section"`
	Credit      int    `json:"Credit"`

	StartAt time.Time `json:"StartAt"`
	EndAt   time.Time `json:"EndAt"`
}

func GetStudentBySubjectID(c *gin.Context) {
	subj_id := c.Param("id")
	var registrations []entity.Registration

	db := config.DB()
	result := db.Preload("Student").
		Preload("Student.Major").
		Preload("Student.Faculty").
		Find(&registrations, "subject_id = ?", subj_id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found student regis"})
		return
	}

	var response []StudentOutput
	for _, regis := range registrations {
		response = append(response, StudentOutput{
			StudentID:   regis.StudentID,
			FirstName:   regis.Student.FirstName,
			LastName:    regis.Student.LastName,
			MajorName:   regis.Student.Major.MajorName,
			FacultyName: regis.Student.Faculty.FacultyName,
		})
	}

	c.JSON(http.StatusOK, response)
}

type StudentOutput struct {
	StudentID   string `json:"StudentID"`
	FirstName   string `json:"FirstName"`
	LastName    string `json:"LastName"`
	MajorName   string `json:"MajorName"`
	FacultyName string `json:"FacultyName"`
}
