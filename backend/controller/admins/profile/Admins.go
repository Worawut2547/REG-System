package admins

import (
	"net/http"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetAdminID (c *gin.Context){
	aid := c.Param("id")
	admin := new(entity.Admins)

	db := config.DB()

	result := db.First(&admin , "Admin_id = ?" , aid)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "admin not found"})
        return	
	}

	c.JSON(http.StatusOK , admin)
}