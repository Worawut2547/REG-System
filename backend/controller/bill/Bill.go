package bill
import (
	"reg_system/config"
	"reg_system/entity"
	"net/http"
	"github.com/gin-gonic/gin"
)
func CreateBill(c *gin.Context) {
	bill := new(entity.Bill)

	if err := c.ShouldBind(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Create(&bill)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Create bill success"})
}
func GetBills(c *gin.Context) {
    var bills []entity.Bill
    db := config.DB()
    if err := db.
        Preload("Registration").
        Preload("Registration.Student").
        Find(&bills).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    c.JSON(http.StatusOK, bills)
}
func GetBillByID(c *gin.Context) {
	id := c.Param("id")
	var bill entity.Bill
	db := config.DB()

	result := db.First(&bill, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, bill)
}
func UpdateBill(c *gin.Context) {
	id := c.Param("id")
	var bill entity.Bill

	if err := c.ShouldBind(&bill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()
	result := db.Model(&bill).Where("id = ?", id).Updates(bill)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Update bill success"})
}
func DeleteBill(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	result := db.Delete(&entity.Bill{}, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Bill not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Delete bill success"})
}
