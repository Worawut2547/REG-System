=================================================================================================
Checklist ที่ลงไว้เเล้ว
ไฟล์ first.tsx , first.go สามารถลบได้
-------------------------------------------------------------------------------------------------
frontend 
1.ลง react เเล้ว
2.ลง library เเล้ว
{
  npm instal dayjs --save
  npm install antd --save
  npm instal axios --save
  npm instal dayjs --save
}
-------------------------------------------------------------------------------------------------
backend
1.ลง go module เเล้ว <reg_system>
2.ลง library เเล้ว
{
  go get -u github.com/gin-gonic/gin
  go get -u gorm.io/gorm
  go get -u gorm.io/driver/sqlite
  go get -u github.com/dgrijalva/jwt-go
  go get -u golang.org/x/crypto@v0.16.0
}
===================================================================================================================
สิ่งที่ต้องทำหลัง clone project ไปเเล้ว

-------------------------------------------------------------------------------------------------------------------
frontend
1.npm install //เพื่อติดตั้ง node_mudels

-------------------------------------------------------------------------------------------------------------------
git (เมื่อทำเสร็จเเล้วต้องการ push ขึ้น)
git add .
git status
git commit -m "first commit"
git push -u origin <ชื่อ branch>

===================================================================================================================
คำสั่งพื้นฐาน git
git clone github.com/Worawut2547/Reg-System                         #ใช้ตอน start project
git init                                                            #สร้าง git repo
git add <ชื่อไฟล์ที่ต้องการ add>                                         #เพิ่มไฟลืทั้งหมดเข้า staging  
git status                                                     
git commit -m "first commit"
git remote add origin https://github.com/Worawut2547/Reg-System.git
git push -u origin <ชื่อ branch>
git pull origin <ชื่อ branch>

-------------------------------------------------------------------------------------------------------------------
คำสั่งเกี่ยวกับ branch
git branch                                                          #Check all branchs
git checkout -b <ชื่อ branch ใหม่>                                     #Create a new branch
git checkout <ชื่อ branch>                                            #Move to branch
Warning
>> กรณีด้านบน คือ มาสร้าง branch ที่เครื่องเองไม่ได้สร้าง branch ผ่าน github
>> ถ้าสร้าง branch ผ่าน github เเล้วอยากจะดึงข้อมูล branch ที่สร้างลงมา
    git fetch origin <ชื่อ branch>                                    #ดึง branch จาก github มาไว้ที่เครื่องตัวเอง
    git checkout <ชื่อ branch>
-------------------------------------------------------------------------------------------------------------------
คำสั่งเกี่ยวกับ merge
git checkout main                                                   #Move to branch main
git merge <ชื่อ branch ที่จะ merge เข้ากับ main>

-------------------------------------------------------------------------------------------------------------------
การ merge เข้ากับ main
git fetch origin <ชื่อ branch ที่ merge>                                #ดึง branch ของคนที่ merge มาไว้ที่เครื่องตัวเอง
git checkout main                                                                                                         
git pull origin main                                                 #ดึงโค้ดล่าสุดจาก main
git merge <ชื่อ branch ที่จะ merge เข้ากับ main>
  ถ้า config
  *เเก้ config เสร็จเเล้ว
  git add <ไฟล์ที่ config>
  git status
  git commit -m "review code success"
  git push origin main
  
===================================================================================================================

การทำ Pull Request 

===================================================================================================================
เเหล่งข้อมูลเพิ่มเติม 
git : https://docs.mikelopster.dev/c/basic/git/intro

-------------------------------------------------------------------------------------------------------------------
backend
go : https://docs.mikelopster.dev/c/goapi-essential/intro
gorm : https://gorm.io/docs/
gin : https://gin-gonic.com/en/docs/introduction

-------------------------------------------------------------------------------------------------------------------
react : https://www.w3schools.com/REACT/react_forms.asp
antdesign : https://ant.design/components/overview/



