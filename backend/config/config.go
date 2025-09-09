package config

import (
	"golang.org/x/crypto/bcrypt"
)

// hash Password
func HashPassword (password string) (string , error) {
	
	bytes , err := bcrypt.GenerateFromPassword([]byte(password) , 10)
	return string(bytes) , err
}

// check Password return เป็น bool
func CheckPassword (password , hash []byte) bool {
	err := bcrypt.CompareHashAndPassword(hash , password)
	return err == nil
}