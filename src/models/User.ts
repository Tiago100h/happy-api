import jwt from "jsonwebtoken";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export default class User {

  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ name: 'password_reset_token' })
  passwordResetToken?: string;

  @Column({ name: 'password_reset_expires' })
  passwordResetExpires?: Date;

  generateToken() {
    return jwt.sign({ id: this.id }, 'secret', {
      expiresIn: 86400
    });
  }
}