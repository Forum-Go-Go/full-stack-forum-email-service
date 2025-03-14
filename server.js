const express = require('express');
const amqp = require('amqplib/callback_api');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5007;