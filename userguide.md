# 📘 EduAssist: Official User Guide

Welcome to **EduAssist**, your institution's AI-powered Learning Management System. This guide will walk you through how to set up your institution, manage courses, and utilize the AI features to enhance teaching and learning.

---

## 🏛️ Part 1: Institution Administrators (Admins)

The Admin is the highest-level user. You are responsible for setting up the institution and provisioning the people who will use it.

### 1.1 Creating Your Institution
1. Go to the EduAssist homepage and click **Register**.
2. At the top of the form, select the **Admin** role.
3. Fill in your name, email, and password.
4. **New Institution Name:** Enter the name of your university or college (e.g., *University of Nairobi*).
5. *Note: The system automatically detects your institution's domain from your email address (e.g., `@uonbi.ac.ke`).*
6. Click **Register**. You will be redirected to the Institution Dashboard.

### 1.2 Provisioning Faculty
Before lecturers can teach, they must be added to the system.
1. Go to your **Institution Dashboard**.
2. Navigate to **Manage Faculty**.
3. Enter the lecturer's email address and full name.
4. Click **Invite**.
*(Note: If Custom SMTP is configured, they will receive an email invite. If not, you may need to provide them with their temporary login credentials manually).*

### 1.3 Creating Academic Structures
You need to set up the hierarchy so classes can be assigned.
1. Go to **Manage Courses** and click **Create Course** (e.g., *Bachelor of Computer Science*).
2. Within that course, create **Units** (e.g., *Intro to Programming*).
3. Within each unit, create **Classes** (e.g., *Year 1, Semester 1*).
4. Assign a provisioned Faculty member to each specific Class.

---

## 👨‍🏫 Part 2: Faculty / Lecturers

As a lecturer, EduAssist is your teaching assistant. It handles the repetitive questions so you can focus on complex topics.

### 2.1 Logging In & Viewing Classes
1. Log in using the credentials provided by your Admin.
2. You will see your **Faculty Dashboard**, which lists all the Classes assigned to you.

### 2.2 Uploading Course Materials
The AI can only answer questions based on the documents *you* provide. 
1. Click into your Class and select the **Materials** tab.
2. Click **Upload Material**.
3. You can upload **PDFs**, **Images** (EduAssist will run OCR to read text from images), or paste **Raw Text** directly.
4. Wait for the upload to finish. The system will automatically split the document into chunks and create vector embeddings so the AI can read it.
*(Note: Large documents like 400-page PDFs may take up to 90 seconds to process).*

### 2.3 Using the Manual Quiz Builder
Instead of AI-generated quizzes, EduAssist uses a reliable manual builder.
1. Go to the **Assessments** tab in your class.
2. Click **Create New Quiz**.
3. Type your questions and provide the correct answers.
4. Save the quiz as a **Draft**.
5. Once you are happy with it, click **Publish**. It will immediately become available to students.

### 2.4 Reviewing Analytics
1. Go to the **Analytics** tab.
2. Here you can see how many students are actively using the AI chat, and download **CSV reports** of quiz results to see which topics the class is struggling with.

---

## 🎓 Part 3: Students

EduAssist is your personalized study buddy. It does not hallucinate; it only gives you answers based on your lecturer's actual notes.

### 3.1 Joining a Class
1. Register on EduAssist using the **Student** role.
2. You will be asked for your **Institution Domain or Name** (e.g., *uonbi.ac.ke* or *University of Nairobi*). Ask your Admin or Lecturer if you aren't sure.
3. Once registered, you will automatically be enrolled in your classes.

### 3.2 Chatting with the AI Tutor
1. Go to the **AI Chat** tab inside your class.
2. Ask a question based on the course material (e.g., *"Explain the difference between a list and a tuple"*).
3. The AI will search the lecturer's uploaded documents and generate a response with **citations** showing exactly where the answer came from.
4. If the answer isn't in the materials, the AI will tell you *"Topic not found in materials."*

### 3.3 Generating Study Notes & Flashcards
1. Inside the AI Chat, select the **Range** (Narrow, Medium, or Broad) depending on how much context you want the AI to use.
2. Type a topic (e.g., *"Data Structures"*).
3. Click **Generate Study Notes** to get a comprehensive summary.
4. Click **Generate Flashcards** to get 8 AI-generated flashcards. You can click through them to test your memory.
5. All generated notes and flashcards are saved to your profile for future revision.

### 3.4 Taking Quizzes
1. Go to the **Assessments** tab.
2. You will see quizzes published by your lecturer.
3. Click **Start Quiz**, answer the questions, and hit **Submit**. Your score will be saved immediately.

---

## ⚙️ Part 4: Troubleshooting & Known Limits

*   **"Institution not found" during registration:** Ensure you are typing the institution's domain correctly (e.g., `techuniversity.ac.ke`) or ask your Admin for the exact name.
*   **PDF upload timeouts:** If a PDF is extremely large (400+ pages), the upload might fail due to server timeouts. Try splitting the PDF into smaller chapters.
*   **"AI service unavailable":** If you spam the chat feature, you will hit the API rate limit. Wait 1 minute and try again.
*   **Email Invites:** If invited users are not receiving emails, the institution Admin must configure Custom SMTP (like Resend or Brevo) in the Supabase backend settings.