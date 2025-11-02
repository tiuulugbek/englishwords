import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface Word {
  id: number;
  category: string;
  english: string;
  uzbek: string;
  example_en: string;
  example_uz: string;
}

@Injectable()
export class WordsService implements OnModuleInit {
  private words: Word[] = [];

  onModuleInit() {
    this.loadWords();
  }

  private loadWords() {
    const wordsPath = path.join(process.cwd(), 'words', 'words.json');
    try {
      if (fs.existsSync(wordsPath)) {
        const wordsData = fs.readFileSync(wordsPath, 'utf-8');
        this.words = JSON.parse(wordsData);
        console.log(`Loaded ${this.words.length} words from JSON`);
      } else {
        console.warn('Warning: words.json not found at', wordsPath);
      }
    } catch (error) {
      console.error('Error loading words:', error);
    }
  }

  getAllWords(): Word[] {
    return this.words;
  }

  getWordById(id: number): Word | undefined {
    return this.words.find((w) => w.id === id);
  }

  getCategories(): string[] {
    const categories = new Set(this.words.map((w) => w.category));
    return Array.from(categories);
  }

  getWordsByCategory(category: string): Word[] {
    return this.words.filter((w) => w.category === category);
  }

  getRandomWords(count: number, category?: string): Word[] {
    let pool = this.words;
    if (category) {
      pool = pool.filter((w) => w.category === category);
    }
    
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  getWordIds(): number[] {
    return this.words.map((w) => w.id);
  }
}

