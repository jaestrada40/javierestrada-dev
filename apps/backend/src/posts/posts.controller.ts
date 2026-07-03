import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import { Post } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findPublished(): Promise<Post[]> {
    return this.postsService.findPublished();
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  findAll(): Promise<Post[]> {
    return this.postsService.findAll();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string): Promise<Post> {
    return this.postsService.findBySlug(slug);
  }

  @HttpPost()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreatePostDto): Promise<Post> {
    return this.postsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePostDto): Promise<Post> {
    return this.postsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number): Promise<Post> {
    return this.postsService.remove(id);
  }
}
