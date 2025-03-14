require('dotenv').config();
const express = require('express');
const amqp = require('amqplib/callback_api');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5007;


// Configure Nodemailer with Gamil SMTP service
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,  // use SSL
    auth: {
        user: process.env.EMAIL_HOST_USER,
        pass: process.env.EMAIL_HOST_PASSWORD
    }
})

// async function to send an email
async function sendEmail(email, code){
    const mailOptions = {
        from: process.env.EMAIL_HOST_USER,
        to: email,
        subject: 'Forum Platform - Email Verification',
        text: `Your verification code is: ${code}. It is valid for 3 hours.`,
        html: `<p>Your verification code is: <strong>${code}</strong>. It is valid for 3 hours.</p>`
    };

    try {
        const response = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}: ${response.messageId}`);
    } catch(err){
        console.log(`Error sending email to ${email}`, err);
    }
}

// connect to RabbitMQ and lister for message
amqp.connect('amqp://127.0.0.1', (error, connection) => {
    if (error){
        console.log('Failed to connect to RabbitMQ', error);
        return;
    }

    connection.createChannel((error, channel) => {
        if (error){
            console.lof('Failed to create RabbitMQ channel', error);
            return;
        }

        const queue = 'email_queue';
        channel.assertQueue(queue, { durable: true });

        console.log("📩 Email Service is listening for messages from RabbitMQ...");

        channel.consume(queue, (msg) => {
            const data = JSON.parse(msg.content.toString());
            console.log(`Received email request for: ${data.email} with code: ${data.code}`);
            sendEmail(data.email, data.code);
        }, { noAck: true });
    })
})

app.listen(PORT, () => {
    console.log(`📧 Email Service is running on port ${PORT}`);
})