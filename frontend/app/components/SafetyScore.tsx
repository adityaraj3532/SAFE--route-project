type SafetyScoreProps = {
  score: number;
};

export default function SafetyScore({ score }: SafetyScoreProps) {
  const getColor = () => {
    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#f59e0b";
    return "#dc2626";
  };

  return (
    <div className="safety-score">
      <div
        className="score-circle"
        style={{
          borderColor: getColor()
        }}
      >
        <strong style={{ color: getColor() }}>{score}</strong>
        <span>/100</span>
      </div>

      <div>
        <h4>Safety Score</h4>
        <p>
          {score >= 80
            ? "Very safe route"
            : score >= 60
              ? "Moderately safe"
              : "Use caution"}
        </p>
      </div>
    </div>
  );
}
