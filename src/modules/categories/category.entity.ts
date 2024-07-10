import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
import _ from 'lodash';
@Entity('categories')
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({nullable: true})
  description: string;

  @Column()
  sourcePath: string;

  @Column()
  destinationPath: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;

  getClientData() {
    return _.pick(this, [
      'id',
      'name',
      'description',
    ]);
  }
}

