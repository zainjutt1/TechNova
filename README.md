# TechNova — Website + MongoDB Atlas Backend

## Kya milega is folder mein
```
technova/
├── frontend/          <- redesigned site (HTML, CSS, JS, images)
└── backend/            <- Node.js + Express + MongoDB Atlas API
    ├── server.js
    ├── models/Contact.js
    ├── routes/contact.js
    ├── .env.example
    └── package.json
```

Contact form ab **MongoDB Atlas** mein data save karta hai (name, email, message, aur timestamp).

---

## Step 1 — Apna Atlas connection string nikalein
Aap apne **registered Atlas account** aur **wahi existing project/database** use kar sakte hain jo aapne pehle banaya tha — koi naya account/project banane ki zaroorat nahi.

1. https://cloud.mongodb.com par login karein (apne registered account se)
2. Apna existing **Project** open karein → left side **Database** → apna cluster dikhega
3. Cluster ke aage **"Connect"** button dabayein
4. **"Drivers"** choose karein → Node.js
5. Wahan ek connection string milegi, kuch is tarah:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. `<username>` aur `<password>` apne Database User ke credentials se replace karein
   (agar password bhool gaye hain to Database Access → Edit → Edit Password se naya bana sakte hain)
7. `.net/` ke baad database ka naam add kar dein, e.g. `.net/technova?retryWrites=true...`

**Network Access:** Atlas mein left panel se **Network Access** → **Add IP Address** → apna current IP add karein (ya testing ke liye "Allow Access from Anywhere" 0.0.0.0/0 — sirf learning/dev ke liye).

---

## Step 2 — Backend setup karein
```bash
cd backend
cp .env.example .env
```
Ab `.env` file kholein aur `MONGODB_URI` ki jagah apni asli connection string paste kar dein.

Dependencies install karein:
```bash
npm install
```

Server chalayein:
```bash
npm start
```
Terminal mein ye dikhna chahiye:
```
✅ Connected to MongoDB Atlas
🚀 Server running at http://localhost:5000
```

---

## Step 3 — Website dekhein
Backend hi frontend ko serve karta hai, is liye bas browser mein open karein:
```
http://localhost:5000
```
Contact form bharke submit karein — data seedha aapke Atlas database ke `contacts` collection mein chala jayega.

Check karne ke liye (browser mein ye URL open karein):
```
http://localhost:5000/api/contact
```
Ye sab saved messages JSON format mein dikha dega.

---

## Troubleshooting
- **"MongoDB connection error"** → `.env` mein connection string check karein, aur Atlas → Network Access mein apna IP allow hai ya nahi dekhein.
- **Authentication failed** → username/password galat hai; Atlas → Database Access se naya password set karein.
- **Form submit hone par "Could not reach the server"** → backend (`npm start`) chal raha hai ya nahi confirm karein.
