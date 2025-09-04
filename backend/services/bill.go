package services

type Subject struct {
	SubjectID   string
	SubjectName string
	Credit      int
}

// คำนวณค่าใช้จ่ายทั้งหมด
func CalculateTotalPrice(subject []Subject, ratePerCredit int) int {
	totalCredit := 0
	for _, subj := range subject {
		totalCredit += subj.Credit
	}

	return totalCredit * ratePerCredit
}
