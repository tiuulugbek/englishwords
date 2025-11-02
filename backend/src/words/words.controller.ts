import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WordsService } from './words.service';

@ApiTags('words')
@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all word categories' })
  getCategories() {
    return {
      categories: this.wordsService.getCategories(),
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all words' })
  getAllWords() {
    return this.wordsService.getAllWords();
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get words by category' })
  getWordsByCategory(@Query('category') category: string) {
    return this.wordsService.getWordsByCategory(category);
  }
}

