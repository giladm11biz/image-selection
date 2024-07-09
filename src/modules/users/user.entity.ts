import { Entity, Column, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';
import * as bcrypt from 'bcrypt';
import _ from 'lodash';

const SEND_MAIL_LIMITATION = 1000 * 60 * 15;
const RESET_PASSWORD_TIME_LIMITATION = 1000 * 60 * 15;
const FAILED_LOGIN_ATTEMPTS_TIME_LIMIT = 1000 * 60 * 15;
const FAILED_LOGIN_ATTEMPTS_ALLOWED = 10;
@Entity('users')
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: false })
  email: string;

  @Column()
  name: string;

  @Column({nullable: true})
  nickname: string;

  @Column({nullable: true})
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ type: 'integer', default: 0 })
  balance: number;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ default: false })
  mailUpdates: boolean;

  @Column({ type: 'char', length: '60', nullable: true })
  verificationCode: string;

  @Column({ type: 'char', length: '60', nullable: true })
  passwordResetCode: string;

  @Column({ type: 'char', length: '60', nullable: true })
  tokenVersion: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastMailSent: Date;

  @Column({ type: 'integer', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lastFailedLoginAttempt: Date;



  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;




  getClientData() {
    return _.pick(this, [
      'name',
      'email',
      'nickname',
      'isVerified',
      'balance',
      'isBlocked',
      'mailUpdates',
      'createdAt',
    ]);
  }

  timeLeftToSendMail() {
    return (new Date(this.lastMailSent).getTime() + SEND_MAIL_LIMITATION) - new Date().getTime();
  }

  timeLeftToResetPassword() {
    if (!this.passwordResetTime) {
      return -1;
    }
    return (new Date(this.passwordResetTime).getTime() + RESET_PASSWORD_TIME_LIMITATION) - new Date().getTime();
  }

  async isPasswordMatches(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  addFailedLoginAttempt() {
    if (this.lastFailedLoginAttempt) {
      let isLastFailedAttemptInTime = (new Date().getTime() - new Date(this.lastFailedLoginAttempt).getTime()) < FAILED_LOGIN_ATTEMPTS_TIME_LIMIT;

      if (!isLastFailedAttemptInTime) {
        this.failedLoginAttempts = 0;
      }
    }

    this.lastFailedLoginAttempt = new Date();
    this.failedLoginAttempts++;
  }

  isLoginBlocked() {
    if (!this.lastFailedLoginAttempt) {
      return false;
    }

    return this.failedLoginAttempts >= FAILED_LOGIN_ATTEMPTS_ALLOWED && (new Date(this.lastFailedLoginAttempt).getTime() + FAILED_LOGIN_ATTEMPTS_TIME_LIMIT) > new Date().getTime();
  }

  updateUserFailedLoginAttempts() {
    this.addFailedLoginAttempt();
    this.save();
  }

  setAsVerified() {
    this.verificationCode = null;
    this.isVerified = true;
    this.save();
  }
}

