package curriculum

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"reg_system/config"
	"reg_system/entity"

	"github.com/gin-gonic/gin"
)

func GetBookPathAll(c *gin.Context) {
	var book []entity.BookPath
	db := config.DB()

	if err := db.Find(&book).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, book)

}

func UploadBookFile(c *gin.Context) {

	// ดึง File จาก StatusBadRequest
	file, err := c.FormFile("currBook")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file is received"})
		return
	}

	// สร้างโฟลเดอร์สำหรับเก็บไฟล์
	os.Mkdir("../../currBook", os.ModePerm)

	// กำหนด Path ไฟล์ที่จะบันทึกUploadBookFile
	filePath := fmt.Sprintf("../../currBook/%s", file.Filename)

	// บันทึกไฟล์
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	log.Println("File uploaded to", filePath)

	// เพิ่มลงฐานข้อมูล
	book := &entity.BookPath{
		Path: filePath,
	}
	db := config.DB()

	result := db.Create(book)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "File uploaded successfully",
		"file_path": filePath,
		"Book":      book,
	})
}

func ShowBookFile(c *gin.Context) {
	fileName := c.Param("filename")
	filePath := fmt.Sprintf("../../currBook/%s", fileName)

	// ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่ShowBookFile
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// ส่งไฟล์ออก
	c.File(filePath)
}
