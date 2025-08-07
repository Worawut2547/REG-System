package config

import (
	"golang.org/x/crypto/bcrypt"
)

// hash Password
func HashPassword (password string) (string , error) {
	bytes , err := bcrypt.GenerateFromPassword([]byte(password) , 16)
	return string(bytes) , err
}

// check Password
func CheckPassword (password , hash []byte) bool {
	err := bcrypt.CompareHashAndPassword(hash , password)
	return err == nil
}