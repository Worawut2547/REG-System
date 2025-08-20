package position

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"reg_system/config"
	"reg_system/entity"
)

func CreatePosition(c *gin.Context) {
	position := new(entity.Position)

	if err := c.ShouldBind(&position); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Create(&position)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Create position success"})
}


func GetPositionAll (c *gin.Context){
	var positions []entity.Position
	db := config.DB()

	result := db.Find(&positions)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No positions found"})
		return
	}

	c.JSON(http.StatusOK, positions)
}