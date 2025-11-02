import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Question {
  id: number;
  wordId: number;
  questionType: string;
  word: {
    id: number;
    english: string;
    uzbek: string;
    example_en: string;
  };
}

interface TestResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  percent: number;
}

export default function TestTab() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [testId, setTestId] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [lastFeedback, setLastFeedback] = useState<string>('');

  const startTest = async () => {
    setLoading(true);
    try {
      const test = await api.startTest('quick');
      setQuestions(test.questions);
      setTestId(test.id);
      setCurrentIndex(0);
      setUserAnswer('');
      setFinished(false);
      setResult(null);
      setLastFeedback('');
    } catch (error) {
      console.error('Error starting test:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim() || !testId) return;

    const question = questions[currentIndex];
    setLoading(true);

    try {
      const response = await api.submitAnswer(testId, question.id, userAnswer);
      const feedback = response.isCorrect
        ? '✅ Correct!'
        : `❌ Wrong! Correct answer: ${response.correctAnswer}`;
      setLastFeedback(feedback);

      // Move to next question after a delay
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setUserAnswer('');
          setLastFeedback('');
        } else {
          finishTest();
        }
      }, 1500);
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const finishTest = async () => {
    if (!testId) return;

    try {
      const result = await api.finishTest(testId);
      setResult(result);
      setFinished(true);
    } catch (error) {
      console.error('Error finishing test:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      submitAnswer();
    }
  };

  if (loading && questions.length === 0) {
    return <div className="loading">Starting test...</div>;
  }

  if (finished && result) {
    return (
      <div className="test-result">
        <h2>🎉 Test Complete!</h2>
        <div className="result-stats">
          <div className="stat">
            <div className="stat-value">{result.correctAnswers}</div>
            <div className="stat-label">Correct</div>
          </div>
          <div className="stat">
            <div className="stat-value">{result.totalQuestions}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat">
            <div className="stat-value">{result.percent.toFixed(0)}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat">
            <div className="stat-value">{result.score}</div>
            <div className="stat-label">Score</div>
          </div>
        </div>
        <button className="btn-primary" onClick={startTest}>
          Try Again
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="test-start">
        <h2>Ready to test your vocabulary?</h2>
        <p>You'll get 10 questions to answer</p>
        <button className="btn-primary" onClick={startTest}>
          Start Test
        </button>
      </div>
    );
  }

  const question = questions[currentIndex];

  return (
    <div className="test-tab">
      <div className="test-progress">
        Question {currentIndex + 1} / {questions.length}
      </div>

      {lastFeedback && <div className="feedback">{lastFeedback}</div>}

      <div className="question-card">
        {question.questionType === 'en_to_uz' ? (
          <div>
            <h3>Translate to Uzbek:</h3>
            <h2>{question.word.english}</h2>
            <p className="hint">Example: {question.word.example_en}</p>
          </div>
        ) : (
          <div>
            <h3>Translate to English:</h3>
            <h2>{question.word.uzbek}</h2>
          </div>
        )}

        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer..."
          disabled={loading}
          autoFocus
        />
      </div>

      <button
        className="btn-primary btn-submit"
        onClick={submitAnswer}
        disabled={!userAnswer.trim() || loading}
      >
        Submit Answer
      </button>
    </div>
  );
}

