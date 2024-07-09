import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
@Entity('users')
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
  destenationPath: string;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;

  getClientData() {
    return _.pick(this, [
      'name',
      'email',
      'description',
      'mailUpdates',
      'createdAt',
    ]);
  }
}

