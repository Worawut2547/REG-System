package degree

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetDegreeAll (c *gin.Context){
	var degree []entity.Degree
	db := config.DB()
	if err := db.Find(&degree).Error; err != nil {
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get faculty"})
		return
	}

	c.JSON(http.StatusOK , degree)
}

func CreateDegree (c *gin.Context){
	degree := new(entity.Degree)

	if err := c.ShouldBind(&degree); err != nil{
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.FirstOrCreate(&degree)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return		
	}

	c.JSON(http.StatusOK , degree)
}