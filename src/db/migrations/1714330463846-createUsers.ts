import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateUsers1714330463846 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
          new Table({
            name: 'users',
            columns: [
              {
                name: 'id',
                type: 'integer',
                isPrimary: true,
                isGenerated: true,
                generationStrategy: 'increment',
              },
              {
                name: 'email',
                type: 'varchar',
                isUnique: true,
                isNullable: false,
              },
              {
                name: 'name',
                type: 'varchar',
              },
              {
                name: 'nickname',
                type: 'varchar',
                isNullable: true,
              },
              {
                name: 'password',
                type: 'varchar',
                isNullable: true,
              },
              {
                name: 'isAdmin',
                type: 'boolean',
                default: false,
              },
              {
                name: 'isVerified',
                type: 'boolean',
                default: false,
              },
              {
                name: 'mailUpdates',
                type: 'boolean',
                default: false,
              },
              {
                name: 'balance',
                type: 'integer',
                default: 0,
              },
              {
                name: 'isBlocked',
                type: 'boolean',
                default: false,
              },
              {
                name: 'verificationCode',
                type: 'char',
                length: '60',
                isNullable: true,
              },
              {
                name: 'lastMailSent',
                type: 'timestamp',
                isNullable: true,
              },
              {
                name: 'passwordResetCode',
                type: 'char',
                length: '60',
                isNullable: true,
              },
              {
                name: 'passwordResetTime',
                type: 'timestamp',
                isNullable: true,
              },
              {
                name: 'tokenVersion',
                type: 'char',
                length: '60',
                isNullable: true,
              },
              {
                name: 'failedLoginAttempts',
                type: 'integer',
                default: 0,
              },
              {
                name: 'lastFailedLoginAttempt',
                type: 'timestamp',
                isNullable: true,
              },
              {
                name: 'createdAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
              },
              {
                name: 'updatedAt',
                type: 'timestamp',
                default: 'CURRENT_TIMESTAMP',
                onUpdate: 'CURRENT_TIMESTAMP',
              },
            ],
          }),
          true,
        );
      }
    
      public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('users');
      }
    
}

