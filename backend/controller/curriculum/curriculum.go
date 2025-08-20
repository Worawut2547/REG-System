package curriculum

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetCurriculumAll(c *gin.Context) {
	var curriculum []entity.Curriculum
	db := config.DB()

	if err := db.Preload("Faculty").
		Preload("Major").
		Preload("Book").
		Find(&curriculum).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var responce []map[string]interface{}
	for _, curr := range curriculum {
		majorName := ""
		facultyName := ""
		bookPath := ""

		if curr.Faculty != nil {
			facultyName = curr.Faculty.FacultyName
		}

		if curr.Major != nil {
			majorName = curr.Major.MajorName
		}

		if curr.Book != nil {
			bookPath = curr.Book.Path
		}

		c := map[string]interface{}{
			"CurriculumID":   curr.CurriculumID,
			"CurriculumName": curr.CurriculumName,
			"TotalCredit":    curr.TotalCredit,
			"StartYear":      curr.StartYear,
			"FacultyName":    facultyName,
			"MajorName":      majorName,
			"Book":           bookPath,
			"Description":    curr.Description,
		}
		responce = append(responce, c)
	}

	c.JSON(http.StatusOK, responce)

}

func CreateCurriculum(c *gin.Context) {
	curriculum := new(entity.Curriculum)
	if err := c.ShouldBind(&curriculum); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.FirstOrCreate(&curriculum)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK , curriculum)
}
