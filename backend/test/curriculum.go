// package test

package test

import (
	"reg_system/config"
	"reg_system/entity"
)

// สร้าง/อัปเดตตัวอย่างหลักสูตร (ไม่มี BookID แล้ว)
func CurriculumExample() {
	db := config.DB()

	cur := entity.Curriculum{
		CurriculumID:   "curr23",
		CurriculumName: "หลักสูตรวิศวกรรมคอมพิวเตอร์2565",
		TotalCredit:    175,
		MajorID:        "ENG23",
		FacultyID:      "F01",
		StartYear:      2565,
		Description:    "หลักสูตรวิศวกรรมคอมพิวเตอร์2565 ถูกพัฒนาขึ้นสำหรับนักศึกษาปีการศึกษา 2565 เป็นต้นไป",
	}

	// ใช้ key ที่ไม่ซ้ำ (curriculum_id) ในการ FirstOrCreate
	db.Where("curriculum_id = ?", cur.CurriculumID).FirstOrCreate(&cur)
}

// บันทึกไฟล์เอกสารลงตารางกลาง curriculum_books (3 คอลัมน์: id, book_path, curriculum_id)
func CurriculumBookExample() {
	db := config.DB()

	cb := entity.CurriculumBook{
		CurriculumID: "curr23",
		BookPath:     `file:///C:/REG-System/frontend/src/pages/admin/dashboard/menu/curriculum/Book/banana.pdf`,
	}

	// กันซ้ำด้วยคู่ (curriculum_id, book_path)
	db.Where("curriculum_id = ? AND book_path = ?", cb.CurriculumID, cb.BookPath).
		FirstOrCreate(&cb)
}