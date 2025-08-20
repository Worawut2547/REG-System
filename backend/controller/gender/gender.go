package gender

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetGenderAll (c *gin.Context){
	var genders []entity.Gender
	db := config.DB()

	result := db.Find(&genders)
	if result.Error != nil{
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No positions found"})
		return
	}

	c.JSON(http.StatusOK , genders)
}