import { Telegraf, Context } from 'telegraf';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5005';

// Storage for user sessions
const userSessions = new Map<number, any>();

// Helper function to call backend
async function callBackend(endpoint: string, method: string, data?: any, token?: string) {
  const headers: any = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios({
    url: `${BACKEND_URL}${endpoint}`,
    method,
    data,
    headers,
  });

  return response.data;
}

// Register user in backend
async function registerUser(ctx: Context) {
  try {
    const result = await callBackend('/auth/bot', 'POST', {
      telegramId: ctx.from?.id.toString(),
      username: ctx.from?.username,
      firstName: ctx.from?.first_name,
      lastName: ctx.from?.last_name,
    });

    return result.token;
  } catch (error: any) {
    console.error('Error registering user:', error.message);
    return null;
  }
}

// Start command
bot.command('start', async (ctx) => {
  const token = await registerUser(ctx);

  const keyboard = {
    inline_keyboard: [
      [
        {
          text: '📱 Open Mini App',
          web_app: { url: process.env.PUBLIC_BASE_URL || 'http://localhost:5173' },
        },
      ],
      [
        { text: '📝 Start test now', callback_data: 'start_test' },
        { text: '📊 My stats', callback_data: 'my_stats' },
      ],
    ],
  };

  await ctx.reply(
    '👋 Welcome to English-Uzbek Vocabulary Trainer!\n\n' +
      'Choose an option:',
    { reply_markup: keyboard },
  );
});

// Start test button
bot.action('start_test', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const token = await registerUser(ctx);
  if (!token) {
    await ctx.reply('❌ Error connecting to server. Please try again.');
    return;
  }

  try {
    await ctx.reply('⏳ Starting test...');

    const test = await callBackend('/tests/start', 'POST', { type: 'quick' }, token);

    if (!test || !test.questions || test.questions.length === 0) {
      await ctx.reply('❌ No questions available. Please try again later.');
      return;
    }

    // Store test info in session
    userSessions.set(userId, {
      testId: test.id,
      questions: test.questions,
      currentIndex: 0,
      answers: [],
    });

    await sendNextQuestion(ctx);
  } catch (error: any) {
    console.error('Error starting test:', error.message);
    await ctx.reply('❌ Error starting test. Please try again.');
  }
});

// Send next question
async function sendNextQuestion(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = userSessions.get(userId);
  if (!session || session.currentIndex >= session.questions.length) {
    await finishTest(ctx);
    return;
  }

  const question = session.questions[session.currentIndex];
  const word = question.word;

  let questionText = '';

  if (question.questionType === 'en_to_uz') {
    questionText = `Translate to Uzbek:\n\n"${word.english}"`;
  } else {
    questionText = `Translate to English:\n\n"${word.uzbek}"`;
  }

  const questionNum = session.currentIndex + 1;
  const totalQuestions = session.questions.length;

  await ctx.reply(
    `Question ${questionNum}/${totalQuestions}\n\n${questionText}\n\n` +
      `💡 Example: ${word.example_en}`,
  );
}

// Handle answers
bot.on('message', async (msgCtx) => {
  const userId = msgCtx.from?.id;
  if (!userId) return;

  const session = userSessions.get(userId);
  if (!session || session.currentIndex >= session.questions.length) {
    return;
  }

  const answer = msgCtx.text;
  if (!answer) return;

  // Skip bot commands
  if (answer.startsWith('/')) return;

  const question = session.questions[session.currentIndex];
  const token = await registerUser(msgCtx);

  if (!token) {
    await msgCtx.reply('❌ Error connecting to server.');
    return;
  }

  try {
    const result = await callBackend(
      `/tests/${session.testId}/answer`,
      'POST',
      {
        questionId: question.id,
        userAnswer: answer,
      },
      token,
    );

    const emoji = result.isCorrect ? '✅' : '❌';
    await msgCtx.reply(
      `${emoji} ${result.isCorrect ? 'Correct!' : `Wrong! Correct answer: ${result.correctAnswer}`}`,
    );

    session.currentIndex += 1;
    userSessions.set(userId, session);

    // Next question after delay
    setTimeout(() => {
      sendNextQuestion(msgCtx);
    }, 1500);
  } catch (error: any) {
    console.error('Error submitting answer:', error.message);
    await msgCtx.reply('❌ Error submitting answer. Please try again.');
  }
});

// Finish test
async function finishTest(ctx: Context) {
  const userId = ctx.from?.id;
  if (!userId) return;

  const session = userSessions.get(userId);
  const token = await registerUser(ctx);

  try {
    const result = await callBackend(`/tests/${session.testId}/finish`, 'POST', {}, token);

    await ctx.reply(
      `📊 Test Results:\n\n` +
        `Total: ${result.totalQuestions}\n` +
        `Correct: ${result.correctAnswers}\n` +
        `Score: ${result.score}\n` +
        `Percent: ${result.percent.toFixed(1)}%`,
    );

    // Clear session
    userSessions.delete(userId);
  } catch (error: any) {
    console.error('Error finishing test:', error.message);
  }
}

// My stats button
bot.action('my_stats', async (ctx) => {
  const token = await registerUser(ctx);
  if (!token) {
    await ctx.reply('❌ Error connecting to server.');
    return;
  }

  try {
    const leaderboard = await callBackend('/leaderboard?range=week', 'GET', null, token);

    await ctx.reply(
      `📊 Your Stats (This Week):\n\n` +
        `Position: ${leaderboard.currentUser.position || 'N/A'}\n` +
        `Total Score: ${leaderboard.currentUser.totalScore || 0}`,
    );
  } catch (error: any) {
    console.error('Error getting stats:', error.message);
    await ctx.reply('❌ Error fetching stats.');
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Launch bot
if (process.env.NODE_ENV === 'production') {
  // Webhook mode (for production)
  const PORT = process.env.PORT || 3000;
  bot.telegram.setWebhook(`${process.env.PUBLIC_BASE_URL}/bot/webhook`);
  
  const express = require('express');
  const app = express();
  app.use(bot.webhookCallback(`/bot/webhook/${process.env.TELEGRAM_BOT_TOKEN}`));
  app.listen(PORT, () => {
    console.log(`Bot webhook listening on port ${PORT}`);
  });
} else {
  // Long polling mode (for development)
  bot.launch();
  console.log('Bot started in polling mode');
}

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

