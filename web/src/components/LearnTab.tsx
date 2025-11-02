import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Word {
  id: number;
  category: string;
  english: string;
  uzbek: string;
  example_en: string;
  example_uz: string;
}

export default function LearnTab() {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);

  useEffect(() => {
    loadTodayWords();
  }, []);

  const loadTodayWords = async () => {
    setLoading(true);
    try {
      const data = await api.getTodayWords(10);
      setWords(data);
      setCurrentIndex(0);
      setShowTranslation(false);
    } catch (error) {
      console.error('Error loading words:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading words...</div>;
  }

  if (words.length === 0) {
    return (
      <div className="empty-state">
        <p>No words available. Try again later!</p>
        <button onClick={loadTodayWords}>Refresh</button>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  const nextWord = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowTranslation(false);
    }
  };

  const prevWord = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setShowTranslation(false);
    }
  };

  return (
    <div className="learn-tab">
      <div className="word-progress">
        {currentIndex + 1} / {words.length}
      </div>

      <div className="word-card">
        <div className="word-english">
          <h2>{currentWord.english}</h2>
        </div>

        {showTranslation && (
          <div className="word-translation">
            <h3>{currentWord.uzbek}</h3>
            <div className="examples">
              <p className="example">
                <strong>EN:</strong> {currentWord.example_en}
              </p>
              <p className="example">
                <strong>UZ:</strong> {currentWord.example_uz}
              </p>
            </div>
          </div>
        )}

        {!showTranslation && (
          <button
            className="btn-show"
            onClick={() => setShowTranslation(true)}
          >
            Show Translation
          </button>
        )}
      </div>

      <div className="navigation">
        <button
          className="btn-nav"
          onClick={prevWord}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>
        <button
          className="btn-nav btn-primary"
          onClick={nextWord}
          disabled={currentIndex === words.length - 1}
        >
          Next →
        </button>
      </div>

      <button className="btn-secondary" onClick={loadTodayWords}>
        🔄 Load More Words
      </button>
    </div>
  );
}

