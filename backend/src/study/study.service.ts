import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WordsService } from '../words/words.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class StudyService {
  constructor(
    private prisma: PrismaService,
    private wordsService: WordsService,
    private usersService: UsersService,
  ) {}

  async getTodayWords(userId: number, limit: number = 10) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const preferredCategory = user.settings?.preferredCategory;
    const allWords = this.wordsService.getAllWords();
    
    // Get words from preferred category or all categories
    let candidateWords = allWords;
    if (preferredCategory) {
      candidateWords = this.wordsService.getWordsByCategory(preferredCategory);
    }

    // Get user's word progress
    const userWords = await this.prisma.userWord.findMany({
      where: { userId },
    });

    const userWordIds = new Set(userWords.map((uw) => uw.wordId));
    const now = new Date();

    // Filter words: either not seen yet, or due for review
    const availableWords = candidateWords.filter((word) => {
      const userWord = userWords.find((uw) => uw.wordId === word.id);
      if (!userWord) return true; // Not seen yet
      return new Date(userWord.nextReviewAt) <= now; // Due for review
    });

    // Select up to 'limit' words
    const selectedWords = availableWords.slice(0, limit);

    // Upsert user_words entries
    for (const word of selectedWords) {
      await this.prisma.userWord.upsert({
        where: {
          userId_wordId: {
            userId,
            wordId: word.id,
          },
        },
        create: {
          userId,
          wordId: word.id,
          lastSeenAt: new Date(),
          nextReviewAt: new Date(),
        },
        update: {
          lastSeenAt: new Date(),
        },
      });
    }

    return selectedWords;
  }
}

