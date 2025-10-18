# 🏫 CampusTrack – Intelligent Lost and Found Locator

An AI-powered **Lost and Found management system** for campuses built using **Spring Boot (Java 21)**, **MySQL**, and **React + Tailwind**.  
CampusTrack helps users **report lost items**, **upload images**, and later **match found items intelligently**.

---

## 🚀 Features

✅ User Authentication  
- Secure Login and Signup with validation  
- Password confirmation and error alerts  
- Only logged-in users can report items  

✅ Lost Item Management  
- Form to report lost items: name, brand, model, size, date/time, location, image upload  
- Stores image + details in database  
- Reset and Submit buttons for smooth UX  
- Designed using **Tailwind CSS**  

✅ Backend (Spring Boot + MySQL)
- RESTful API endpoints (`/api/auth/signup`, `/api/auth/login`, `/api/lostitems/report`)  
- CORS enabled for React frontend  
- Image storage with path management  
- Auto table creation using JPA (`spring.jpa.hibernate.ddl-auto=update`)  

✅ Frontend (React + Tailwind)
- Simple, responsive, and clean design  
- Alerts for success/error  
- Integrated with backend APIs via Axios  

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React + Vite + Tailwind CSS |
| **Backend** | Spring Boot 3.5 + Java 21 |
| **Database** | MySQL |
| **ORM** | Hibernate / JPA |
| **Build Tool** | Maven |
| **AI Integration (future)** | TensorFlow / OpenCV (for image matching) |

---

## 🧩 Folder Structure

```
CampusTrack/
 ├── backend/
 │   ├── src/main/java/com/campustrack/lostandfound/
 │   │   ├── controller/
 │   │   │    ├── AuthController.java
 │   │   │    ├── LostItemController.java
 │   │   ├── model/
 │   │   │    ├── User.java
 │   │   │    ├── LostItem.java
 │   │   ├── repository/
 │   │   │    ├── UserRepository.java
 │   │   │    ├── LostItemRepository.java
 │   │   ├── service/
 │   │   │    ├── UserService.java
 │   │   ├── config/
 │   │   │    ├── SecurityConfig.java
 │   │   │    ├── WebConfig.java
 │   │   └── CampusTrackApplication.java
 │   ├── src/main/resources/
 │   │   ├── application.properties
 │   └── pom.xml
 │
 ├── frontend/
 │   ├── src/
 │   │   ├── components/
 │   │   │    ├── LoginSignup.jsx
 │   │   │    ├── LostItemForm.jsx
 │   │   └── App.jsx
 │   ├── package.json
 │   └── vite.config.js
 └── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/vivek8085/CampusTrack-Intelligent-Lost-and-Found-Locator.git
cd CampusTrack-Intelligent-Lost-and-Found-Locator
```

---

### 2️⃣ Backend Setup (Spring Boot)

**Go to backend folder:**

```bash
cd lostandfound
```

**Edit MySQL credentials** in `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/campus_track
spring.datasource.username=root
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

**Run backend:**

```bash
mvn clean install
mvn spring-boot:run
```

✅ The backend will start on [http://localhost:8080](http://localhost:8080)

---

### 3️⃣ Frontend Setup (React + Tailwind)

```bash
cd frontend
npm install
npm run dev
```

✅ The frontend will run on [http://localhost:5173](http://localhost:5173)

---

## 📸 Screenshots (Add later)

| Login / Signup | Report Lost Item |
|----------------|------------------|
| ![Login Page](assets/login.png) | ![Report Form](assets/report.png) |

---

## 🧠 AI Enhancement (Future Scope)

- **Image matching** between reported lost and found items using AI/ML  
- **Object recognition** using TensorFlow or OpenCV  
- **Smart notifications** to alert when a match is found  
- **Admin Dashboard** for managing reports  

---

## 🧑‍💻 Contributors

| Name | Role | GitHub |
|------|------|--------|
| Vivek L | Developer | [@vivek8085](https://github.com/vivek8085) |

---

## 📜 License

This project is licensed under the **MIT License** — you are free to use, modify, and distribute it.

---

### 💬 Feedback
If you like this project, don’t forget to ⭐ **star the repo** and share your thoughts in the Issues section!
