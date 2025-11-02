import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordsService } from '../words/words.service';

@Injectable()
export class TestsService {
  constructor(
    private prisma: PrismaService,
    private wordsService: WordsService,
  ) {}

  async createTest(userId: number, type: string, wordCount: number = 10) {
    // Select words: priority to failed ones, then random
    const userWords = await this.prisma.userWord.findMany({
      where: { userId },
      orderBy: [
        { failCount: 'desc' },
        { lastSeenAt: 'desc' },
      ],
      take: wordCount * 2,
    });

    const words = this.wordsService.getAllWords();
    const selectedWordIds: number[] = [];

    // First, add failed words
    for (const uw of userWords) {
      if (uw.failCount > 0 && selectedWordIds.length < wordCount) {
        selectedWordIds.push(uw.wordId);
      }
    }

    // Fill remaining slots with random words
    const remainingCount = wordCount - selectedWordIds.length;
    if (remainingCount > 0) {
      const randomWords = this.wordsService.getRandomWords(remainingCount);
      for (const word of randomWords) {
        if (!selectedWordIds.includes(word.id)) {
          selectedWordIds.push(word.id);
        }
      }
    }

    // Create test
    const test = await this.prisma.test.create({
      data: {
        userId,
        type,
        totalQuestions: selectedWordIds.length,
        startedAt: new Date(),
      },
    });

    // Create test questions
    const questions = await Promise.all(
      selectedWordIds.map(async (wordId) => {
        return this.prisma.testQuestion.create({
          data: {
            testId: test.id,
            wordId,
            questionType: Math.random() > 0.5 ? 'en_to_uz' : 'uz_to_en',
          },
        });
      }),
    );

    return {
      ...test,
      questions: questions.map((q) => ({
        id: q.id,
        wordId: q.wordId,
        questionType: q.questionType,
        word: this.wordsService.getWordById(q.wordId),
      })),
    };
  }

  async submitAnswer(testId: number, questionId: number, userAnswer: string) {
    const question = await this.prisma.testQuestion.findUnique({
      where: { id: questionId },
    });

    if (!question || question.testId !== testId) {
      throw new Error('Question not found');
    }

    const word = this.wordsService.getWordById(question.wordId);
    if (!word) {
      throw new Error('Word not found');
    }

    // Check correctness
    const correctAnswer =
      question.questionType === 'en_to_uz' ? word.uzbek : word.english;

    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

    // Update question
    await this.prisma.testQuestion.update({
      where: { id: questionId },
      data: {
        userAnswer,
        isCorrect,
      },
    });

    // Update user_words
    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });

    if (test && isCorrect) {
      await this.prisma.userWord.upsert({
        where: {
          userId_wordId: {
            userId: test.userId,
            wordId: question.wordId,
          },
        },
        create: {
          userId: test.userId,
          wordId: question.wordId,
          successCount: 1,
          nextReviewAt: this.calculateNextReview(1),
        },
        update: {
          successCount: { increment: 1 },
          nextReviewAt: this.calculateNextReview(1),
        },
      });
    } else if (test) {
      await this.prisma.userWord.upsert({
        where: {
          userId_wordId: {
            userId: test.userId,
            wordId: question.wordId,
          },
        },
        create: {
          userId: test.userId,
          wordId: question.wordId,
          failCount: 1,
          nextReviewAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // +6 hours
        },
        update: {
          failCount: { increment: 1 },
          nextReviewAt: new Date(Date.now() + 6 * 60 * 60 * 1000),
        },
      });
    }

    return { isCorrect, correctAnswer };
  }

  async finishTest(testId: number) {
    const questions = await this.prisma.testQuestion.findMany({
      where: { testId },
    });

    const correctAnswers = questions.filter((q) => q.isCorrect === true).length;
    const total = questions.length;
    const percent = total > 0 ? (correctAnswers / total) * 100 : 0;

    // Calculate score (correct answers * points based on type)
    let score = correctAnswers * 10;

    const test = await this.prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    await this.prisma.test.update({
      where: { id: testId },
      data: {
        finishedAt: new Date(),
        correctAnswers,
        percent,
        score,
      },
    });

    return {
      testId,
      totalQuestions: total,
      correctAnswers,
      percent: Math.round(percent * 100) / 100,
      score,
    };
  }

  private calculateNextReview(successCount: number): Date {
    const now = Date.now();
    let days = 1; // First success: +1 day

    if (successCount === 2) days = 3; // Second: +3 days
    else if (successCount >= 3) days = 7; // Third+: +7 days

    return new Date(now + days * 24 * 60 * 60 * 1000);
  }
}

