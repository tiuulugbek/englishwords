import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(userId: number, range: string = 'week') {
    const now = new Date();
    let startDate: Date;

    if (range === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = new Date(0); // All time
    }

    // Get top users by score
    const topTests = await this.prisma.test.findMany({
      where: {
        finishedAt: { not: null },
        startedAt: { gte: startDate },
      },
      select: {
        userId: true,
        score: true,
        user: {
          select: {
            id: true,
            telegramId: true,
            username: true,
            fullName: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: 10,
    });

    // Aggregate scores per user
    const userScores = new Map();
    for (const test of topTests) {
      const uid = test.userId;
      if (!userScores.has(uid)) {
        userScores.set(uid, {
          user: test.user,
          totalScore: 0,
          testCount: 0,
        });
      }
      userScores.get(uid).totalScore += test.score;
      userScores.get(uid).testCount += 1;
    }

    // Convert to array and sort
    const leaderboard = Array.from(userScores.values())
      .map((entry) => ({
        ...entry.user,
        totalScore: entry.totalScore,
        testCount: entry.testCount,
      }))
      .sort((a, b) => b.totalScore - a.totalScore);

    // Find current user position
    const userIndex = leaderboard.findIndex(
      (entry) => entry.id === userId,
    );
    const userPosition = userIndex >= 0 ? userIndex + 1 : null;

    // Get user's total score if not in top 10
    let userTotalScore = 0;
    if (userPosition === null) {
      const userTests = await this.prisma.test.findMany({
        where: {
          userId,
          finishedAt: { not: null },
          startedAt: { gte: startDate },
        },
        select: { score: true },
      });
      userTotalScore = userTests.reduce((sum, t) => sum + t.score, 0);
    } else {
      userTotalScore = leaderboard[userIndex].totalScore;
    }

    return {
      leaderboard: leaderboard.map((entry, index) => ({
        ...entry,
        position: index + 1,
      })),
      currentUser: {
        position: userPosition,
        totalScore: userTotalScore,
      },
      range,
    };
  }
}

