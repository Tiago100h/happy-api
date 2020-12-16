import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import { getRepository } from "typeorm";
import * as Yup from 'yup';
import User from "../models/User";

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
  }
}