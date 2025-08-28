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

func CreateGrade(c *gin.Context){
	var gradesInput []entity.Grades

	if err := c.ShouldBind(&gradesInput); err != nil {
		c.JSON(http.StatusBadRequest , gin.H{"error:": err.Error()})
		return
	}

	db := config.DB()
	result := db.CreateInBatches(&gradesInput,len(gradesInput))
	if result.Error != nil{
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK , gradesInput)
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