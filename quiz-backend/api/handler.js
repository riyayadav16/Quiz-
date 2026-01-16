import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

// CORS Configuration
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-api-key"]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// Default courses data
const DEFAULT_COURSES = [
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

// In-memory data storage (resets on each request in serverless)
let courses = [...DEFAULT_COURSES];
let userProgress = [];

// API Key Middleware
const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== "12345") {
    return res.status(401).json({ message: "Unauthorized: Invalid API Key" });
  }
  next();
};

// Routes
app.post("/courses", apiKeyMiddleware, (req, res) => {
  try {
    const { id, title, lessons } = req.body;
    if (!id || !title || !lessons) {
      return res.status(400).json({ message: "Missing course fields" });
    }

    const existing = courses.find(c => c.id === id);
    if (existing) {
      return res.status(400).json({ message: "Course ID already exists" });
    }

    const newCourse = { id, title, lessons };
    courses.push(newCourse);
    res.status(201).json({ message: "Course created", course: newCourse });
  } catch (err) {
    res.status(500).json({ message: "Error creating course", error: err.message });
  }
});

app.get("/courses/:id", apiKeyMiddleware, (req, res) => {
  try {
    const course = courses.find(c => c.id === req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: "Error fetching course", error: err.message });
  }
});

app.post("/courses/:id/progress", apiKeyMiddleware, (req, res) => {
  try {
    const { userId, lessonId, answers } = req.body;
    if (!userId || !lessonId || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Missing userId, lessonId, or answers array" });
    }

    const course = courses.find(c => c.id === req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const lesson = course.lessons.find(l => l.id === lessonId);
    if (!lesson) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    // Calculate score
    let score = 0;
    lesson.questions.forEach((q, index) => {
      const answerObj = answers.find(a => a.questionIndex === index);
      if (answerObj && answerObj.selectedOption === q.answer) {
        score += 1;
      }
    });

    const progressObj = { userId, courseId: course.id, lessonId, answers, score };
    const index = userProgress.findIndex(
      up => up.userId === userId && up.courseId === course.id && up.lessonId === lessonId
    );

    if (index > -1) {
      userProgress[index] = progressObj;
    } else {
      userProgress.push(progressObj);
    }

    res.json({ message: "Progress updated", progress: progressObj });
  } catch (err) {
    res.status(500).json({ message: "Error saving progress", error: err.message });
  }
});

app.get("/courses/:id/progress/:userId", apiKeyMiddleware, (req, res) => {
  try {
    const { id, userId } = req.params;
    const course = courses.find(c => c.id === id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const progress = userProgress.filter(up => up.userId === userId && up.courseId === id);
    res.json({ courseId: id, userId, progress });
  } catch (err) {
    res.status(500).json({ message: "Error fetching progress", error: err.message });
  }
});

export default app;
