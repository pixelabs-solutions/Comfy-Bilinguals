import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import { currentUser } from '../auth/decorators/currentUser';
import { UsersService } from '../users/users.service';
import { Roles } from '../users/enums/roles.enum';

@Controller('ratings')
export class RatingsController {
  constructor(
    private readonly ratingsService: RatingsService,
    private readonly userService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('add')
  async create(
    @Body() createRatingDto: CreateRatingDto,
    @currentUser() user: User,
  ) {
    const client = await this.userService.findById(user['sub']);
    if (client.role === Roles.CLIENT) {
      createRatingDto.clientId = user['sub'];
    }
    if (createRatingDto) {
      return this.ratingsService.create(createRatingDto);
    } else {
      throw new Error('Rating data is missing');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('fetch/All')
  async findAll(@currentUser() user: User) {
    const result = await this.ratingsService.getRatingsForInterpreter(
      user['sub'],
    );
    return {
      totalRatings: result.totalRatings,
      averageRating: result.averageRating,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ratingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRatingDto: UpdateRatingDto) {
    return this.ratingsService.update(+id, updateRatingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ratingsService.remove(+id);
  }
}
