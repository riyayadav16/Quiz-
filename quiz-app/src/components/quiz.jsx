import { useState, useEffect } from "react";
import ProgressBar from "./ProgressBar";
import { fetchCourse, saveProgress, getProgress } from "../api/courseApi";

function Quiz({ courseId = "c1", lessonId = "l1" }) {
  const [course, setCourse] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Generate/load userId
  const [userId] = useState(() => {
    const storedUserId = localStorage.getItem("userId");
    return storedUserId || "u" + Math.floor(Math.random() * 10000);
  });

  useEffect(() => {
    localStorage.setItem("userId", userId);
  }, [userId]);

  // Load course & previous progress from backend
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseData = await fetchCourse(courseId);
        setCourse(courseData);
        const lesson = courseData.lessons.find(l => l.id === lessonId);
        if (lesson) setQuestions(lesson.questions);

        // Load previous progress if any
        const progressData = await getProgress(courseId, userId);
        if (progressData.progress && progressData.progress.length > 0) {
          const existing = progressData.progress.find(p => p.lessonId === lessonId);
          if (existing) {
            // Convert array to object for easier handling
            const prevAnswers = {};
            existing.answers.forEach(a => {
              prevAnswers[a.questionIndex] = a.selectedOption;
            });
            setAnswers(prevAnswers);
            setCurrentQuestion(Math.min(Object.keys(prevAnswers).length, lesson.questions.length - 1));
          }
        }
      } catch (err) {
        console.error("Error loading course or progress:", err);
      }
    };
    loadCourse();
  }, [courseId, lessonId, userId]);

  // Persist quiz locally
  useEffect(() => {
    if (!quizCompleted) {
      localStorage.setItem(
        "quiz-progress",
        JSON.stringify({ currentQuestion, answers })
      );
    }
  }, [currentQuestion, answers, quizCompleted]);

  if (!questions || questions.length === 0) return <p>Loading quiz...</p>;

  const selectedOption = answers[currentQuestion];

  const handleSelect = (index) => {
    setAnswers({ ...answers, [currentQuestion]: index });
  };

  const handleNext = async () => {
    if (currentQuestion === questions.length - 1) {
      setQuizCompleted(true);
      localStorage.removeItem("quiz-progress");

      // Convert answers object to array format for backend
      const answersArray = Object.keys(answers).map(key => ({
        questionIndex: parseInt(key),
        selectedOption: answers[key],
      }));

      try {
        await saveProgress({ courseId, lessonId, userId, answers: answersArray });
      } catch (err) {
        console.error("Error saving progress:", err);
      }
    } else {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  // Calculate total correct answers
  const totalCorrect = Object.keys(answers).reduce((score, key) => {
    const qIndex = parseInt(key);
    if (answers[qIndex] === questions[qIndex].answer) return score + 1;
    return score;
  }, 0);

  if (quizCompleted) {
    return (
      <div className="quiz-container">
        <h2>🎉 Quiz Completed!</h2>
        <p>
          Your Score: {totalCorrect} / {questions.length} (
          {Math.round((totalCorrect / questions.length) * 100)}%)
        </p>

        <h3>Review:</h3>
        {questions.map((q, index) => {
          const userAnswer = answers[index];
          const isCorrect = userAnswer === q.answer;
          return (
            <div key={index} style={{ marginBottom: "15px" }}>
              <strong>{q.question}</strong>
              <ul>
                {q.options.map((opt, i) => {
                  let style = {};
                  if (i === q.answer) style = { color: "green" };
                  if (i === userAnswer && !isCorrect) style = { color: "red" };
                  return (
                    <li key={i} style={style}>
                      {opt}
                    </li>
                  );
                })}
              </ul>
              <p>{isCorrect ? "✅ Correct" : " Incorrect"}</p>
            </div>
          );
        })}
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="quiz-container">
      <ProgressBar current={currentQuestion + 1} total={questions.length} />

      <h2>{question.question}</h2>

      {question.options.map((option, index) => {
        let backgroundColor = "";
        if (selectedOption !== undefined) {
          if (index === question.answer) backgroundColor = "#c8f7c5"; // correct
          else if (index === selectedOption) backgroundColor = "#f7c5c5"; // wrong
        }

        return (
          <label
            key={index}
            style={{
              display: "block",
              margin: "10px 0",
              padding: "8px",
              borderRadius: "5px",
              backgroundColor,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name={`question-${currentQuestion}`}
              checked={selectedOption === index}
              onChange={() => handleSelect(index)}
              style={{ marginRight: "8px" }}
            />
            {option}
          </label>
        );
      })}

      <button
        onClick={handleNext}
        disabled={selectedOption === undefined}
        style={{ marginTop: "20px" }}
      >
        {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
      </button>
    </div>
  );
}

export default Quiz;
