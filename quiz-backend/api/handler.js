import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from frontend dist folder
const distPath = path.join(__dirname, "../../quiz-app/dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// API Key Middleware
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== "12345") {
    return res.status(401).json({ message: "Unauthorized: Invalid API Key" });
  }
  next();
};

// Apply middleware to all /courses routes
app.use("/courses", apiKeyMiddleware);

// -------------------- Load / Initialize Data --------------------
const DATA_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), "../data.json");

const saveData = (courses, userProgress) => {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ courses, userProgress }, null, 2)
  );
};

let courses = [];
let userProgress = [];

if (fs.existsSync(DATA_FILE)) {
  const rawData = fs.readFileSync(DATA_FILE);
  const data = JSON.parse(rawData);
  courses = data.courses || [];
  userProgress = data.userProgress || [];
} else {
  courses = [
    {
      id: "c1",
      title: "Frontend Basics",
      lessons: [
        {
          id: "l1",
          title: "HTML Quiz",
          questions: [
            {
              question: "What does HTML stand for?",
              options: [
                "Hyper Trainer Marking Language",
                "Hyper Text Markup Language",
                "Home Tool Markup Language"
              ],
              answer: 1
            },
            {
              question: "Which tag is used for a paragraph?",
              options: ["<p>", "<para>", "<paragraph>"],
              answer: 0
            },
            {
              question: "Which attribute is used for hyperlinks?",
              options: ["src", "href", "link"],
              answer: 1
            },
            {
              question: "HTML files are saved with which extension?",
              options: [".html", ".htm", "Both"],
              answer: 2
            },
            {
              question: "What is the correct way to insert an image?",
              options: ["<img src='img.png'>", "<image src='img.png'>", "<pic src='img.png'>"],
              answer: 0
            }
          ]
        }
      ]
    }
  ];
  saveData(courses, userProgress);
}

const calculateScore = (lesson, answers) => {
  if (!Array.isArray(answers)) return 0;
  let score = 0;
  lesson.questions.forEach((q, index) => {
    const answerObj = answers.find(a => a.questionIndex === index);
    if (answerObj && answerObj.selectedOption === q.answer) {
      score += 1;
    }
  });
  return score;
};

// ROUTES
app.post("/courses", (req, res) => {
  const { id, title, lessons } = req.body;
  if (!id || !title || !lessons)
    return res.status(400).json({ message: "Missing course fields" });

  const existing = courses.find(c => c.id === id);
  if (existing) return res.status(400).json({ message: "Course ID already exists" });

  const newCourse = { id, title, lessons };
  courses.push(newCourse);
  saveData(courses, userProgress);
  res.status(201).json({ message: "Course created", course: newCourse });
});

app.get("/courses/:id", (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });
  res.json(course);
});

app.post("/courses/:id/progress", (req, res) => {
  const { userId, lessonId, answers } = req.body;
  if (!userId || !lessonId || !Array.isArray(answers))
    return res.status(400).json({ message: "Missing userId, lessonId, or answers array" });

  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const lesson = course.lessons.find(l => l.id === lessonId);
  if (!lesson) return res.status(404).json({ message: "Lesson not found" });

  const score = calculateScore(lesson, answers);

  const index = userProgress.findIndex(
    up => up.userId === userId && up.courseId === course.id && up.lessonId === lessonId
  );

  const progressObj = { userId, courseId: course.id, lessonId, answers, score };

  if (index > -1) userProgress[index] = progressObj;
  else userProgress.push(progressObj);

  saveData(courses, userProgress);
  res.json({ message: "Progress updated", progress: progressObj });
});

app.get("/courses/:id/progress/:userId", (req, res) => {
  const { id, userId } = req.params;
  const course = courses.find(c => c.id === id);
  if (!course) return res.status(404).json({ message: "Course not found" });

  const progress = userProgress.filter(up => up.userId === userId && up.courseId === id);
  res.json({ courseId: id, userId, progress });
});

// Serve index.html for all non-API routes (SPA routing)
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "../../quiz-app/dist/index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ message: "Not found" });
  }
});

export default app;
