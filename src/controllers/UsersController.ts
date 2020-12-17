import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import * as Yup from 'yup';
import User from "../models/User";
import mailer from '../modules/mailer';

export default {
  async create(request: Request, response: Response) {
    const { name, email, password } = request.body;
    const data = { name, email, password };

    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().required().email(),
      password: Yup.string().required()
    });
    await schema.validate(data, { abortEarly: false });

    const userRepository = getRepository(User);

    const existingEmail = await userRepository.findOne({
      where: { email }
    });
    if (existingEmail) {
      return response.status(400).json({ error: 'Email already registered' });
    }

    data.password = await bcrypt.hash(password, 10);

    const user = userRepository.create(data);
    await userRepository.save(user);

    return response.status(201).json({ token: user.generateToken() });
  },

  async authenticate(request: Request, response: Response) {
    const { email, password } = request.body;
    const data = { email, password };

    const schema = Yup.object().shape({
      email: Yup.string().required().email(),
      password: Yup.string().required()
    });
    await schema.validate(data, { abortEarly: false });

    const userRepository = getRepository(User);

    const user = await userRepository.findOne({
      where: { email }
    });

    if (!user) {
      return response.status(400).json({ error: 'User not found' });
    }

    if (!await bcrypt.compare(password, user.password)) {
      return response.status(400).send({ error: 'Invalid password' });
    }

    return response.send({
      token: user.generateToken()
    });
  },

  async forgotPassword(request: Request, response: Response) {
    const { email } = request.body;
    const data = { email };

    const schema = Yup.object().shape({
      email: Yup.string().required().email()
    });
    await schema.validate(data, { abortEarly: false });

    const userRepository = getRepository(User);

    const user = await userRepository.findOne({
      where: { email }
    });

    if (!user) {
      return response.status(400).json({ error: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');

    const now = new Date();
    now.setHours(now.getHours() + 1);

    user.passwordResetToken = token;
    user.passwordResetExpires = now;

    await userRepository.update(user.id, user);

    mailer.sendMail({
      to: email,
      from: 'tiagogiuliatte.p@gmail.com',
      html: `<p>Você esqueceu sua senha? Não tem problema, utilize este token: ${token}</p>`
    }, err => {
      if (err) {
        return response.status(400).send({ error: 'Cannot send forgot password email' });
      }
      return response.send();
    });

  },

  async resetPassword(request: Request, response: Response) {
    const { email, token, password } = request.body;
    const data = { email, token, password };

    const schema = Yup.object().shape({
      email: Yup.string().required().email(),
      token: Yup.string().required(),
      password: Yup.string().required()
    });
    await schema.validate(data, { abortEarly: false });

    const userRepository = getRepository(User);

    const user = await userRepository.findOne({
      where: { email }
    });

    if (!user) {
      return response.status(400).json({ error: 'User not found' });
    }

    if (token !== user.passwordResetToken) {
      return response.status(400).json({ error: 'Invalid token' });
    }

    const now = new Date();
    if (now > user.passwordResetExpires!) {
      return response.status(400).json({ error: 'Token expired, generate a new one' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await userRepository.update(user.id, user);

    return response.send();
  }
}