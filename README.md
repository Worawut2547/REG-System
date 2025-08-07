
# ✅ Checklist ที่ลงไว้แล้ว

- [x] ลบไฟล์ `first.tsx`, `first.go`
- [x] ติดตั้ง React
- [x] ติดตั้ง Library

---

## 📦 Frontend Setup

### ติดตั้ง Library แล้ว:
```bash
npm install dayjs --save
npm install antd --save
npm install axios --save
npm install dayjs --save
```

---

## 🛠️ Backend Setup

### Go Module + Library เเล้ว:
```bash
go get -u github.com/gin-gonic/gin
go get -u gorm.io/gorm
go get -u gorm.io/driver/sqlite
go get -u github.com/dgrijalva/jwt-go
go get -u golang.org/x/crypto@v0.16.0
```

---

## 📂 หลังจาก Clone Project

### ✅ สำหรับ Frontend:
```bash
npm install
```

---

## 🧠 Git Workflow

### 🔼 Push โค้ดขึ้น GitHub
```bash
git add .
git status
git commit -m "first commit"
git push -u origin <ชื่อ branch>
```

### 🧾 คำสั่ง Git พื้นฐาน
```bash
git clone github.com/Worawut2547/Reg-System
git init
git add <ชื่อไฟล์>
git status
git commit -m "first commit"
git remote add origin https://github.com/Worawut2547/Reg-System.git
git push -u origin <ชื่อ branch>
git pull origin <ชื่อ branch>
```

### 🌿 คำสั่งเกี่ยวกับ Branch
```bash
git branch                          # ดูทั้งหมด
git checkout -b <ชื่อ branch>       # สร้าง branch ใหม่
git checkout <ชื่อ branch>          # ย้ายไป branch นั้น
git fetch origin <ชื่อ branch>      # ดึง branch จาก github
```

### 🔀 Merge เข้ากับ main
```bash
git fetch origin <ชื่อ branch>
git checkout main
git pull origin main
git merge <ชื่อ branch>
```

💡 ถ้าเกิด conflict:
```bash
# แก้ไขไฟล์ที่ conflict แล้วทำตามนี้
git add <ไฟล์ที่ conflict>
git status
git commit -m "review code success"
git push origin main
```

---

## 🔁 การทำ Pull Request (PR)

### ขั้นตอน:
1. Push โค้ด:
```bash
git add .
git status
git commit -m "merge to main"
git push origin <ชื่อ branch>
```

2. บน GitHub:
- ไปที่ branch ที่ push ขึ้น
- ตรวจสอบว่า `base: main`, `compare: <ชื่อ branch>`
- กด `Create Pull Request`

💡 ถ้ามี Conflict:
```bash
git checkout <ชื่อ branch>
git pull origin main
# แก้ไขไฟล์ conflict
git add .
git status
git commit -m "edit config success"
git push origin <ชื่อ branch>
```

GitHub จะอัปเดตว่า conflict ถูกแก้แล้ว

---

## 🔗 แหล่งข้อมูลเพิ่มเติม

- Git: [docs.mikelopster.dev - Git](https://docs.mikelopster.dev/c/basic/git/intro)
- Go: [Go API Essential](https://docs.mikelopster.dev/c/goapi-essential/intro)
- GORM: [gorm.io/docs](https://gorm.io/docs/)
- Gin: [gin-gonic.com](https://gin-gonic.com/en/docs/introduction)
- React: [W3Schools - React Forms](https://www.w3schools.com/REACT/react_forms.asp)
- Ant Design: [Ant Design Components](https://ant.design/components/overview/)
