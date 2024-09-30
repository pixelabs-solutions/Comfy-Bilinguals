import { Injectable } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private repository: Repository<Rating>,
  ) {}
  async create(createRatingDto: CreateRatingDto) {
    return this.repository.save(createRatingDto);
  }

  async getRatingsForInterpreter(interpreterId: number) {
    // Fetch all ratings for the specific interpreter
    const ratings = await this.repository.find({
      where: { interpreter: { id: interpreterId } },
    });

    // Total number of ratings
    const totalRatings = ratings.length;

    if (totalRatings === 0) {
      return { totalRatings: 0, averageRating: 0 }; // Return 0 if no ratings found
    }

    // Calculate the sum of all ratings (stars)
    const sumOfRatings = ratings.reduce((sum, rating) => sum + rating.stars, 0);

    // Calculate the average rating
    const averageRating = sumOfRatings / totalRatings;

    return {
      totalRatings,
      averageRating: parseFloat(averageRating.toFixed(2)), // Return average rating rounded to 2 decimal places
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} rating`;
  }

  update(id: number, updateRatingDto: UpdateRatingDto) {
    return `This action updates a #${id} rating`;
  }

  remove(id: number) {
    return `This action removes a #${id} rating`;
  }
}
