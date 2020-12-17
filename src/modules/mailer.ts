import nodemailer from 'nodemailer';
import path from 'path';
const hbs = require('nodemailer-express-handlebars');

const transport = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: +process.env.NODEMAILER_PORT!,
  auth: {
    user: process.env.NODEMAILER_USERNAME,
    pass: process.env.NODEMAILER_PASSWORD
  }
});

transport.use('compile', hbs({
  viewEngine: 'handlebars',
  viewPath: path.resolve('./src/resources/mail/'),
  extName: '.html'
}));

export default transport;