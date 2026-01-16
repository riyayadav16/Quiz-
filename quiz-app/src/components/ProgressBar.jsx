//Show Question number / Total questions
//Show a visual progress bar
//Update automatically when question changes

function ProgressBar({ current, total }) {
  const percentage = (current / total) * 100;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          height: "8px",
          width: "100%",
          backgroundColor: "#e0e0e0",
          borderRadius: "4px",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            backgroundColor: "#4caf50",
            transition: "width 0.3s ease"
          }}
        />
      </div>

      <p style={{ marginTop: "8px", fontSize: "14px" }}>
        Question {current} / {total}
      </p>
    </div>
  );
}

export default ProgressBar;
