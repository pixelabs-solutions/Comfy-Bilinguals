import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// const entitiesPath = join(__dirname, '**/*.entity{.ts,.js}');
// const entities = globSync(entitiesPath);

export const config: TypeOrmModuleOptions = {
  type: 'postgres',
  username: 'postgres',
  password: 'root',
  port: 5432,
  host: 'localhost',
  database: 'Bilinguals',
  entities: [
    __dirname + '/../**/*.entity.{ts}',
    'src/libraries/domain/**/*.entity.{ts}',
  ],
  // logging: true,
  synchronize: true,
  autoLoadEntities: true,
};
