const nodemailer = require('nodemailer');
const pug = require('pug');
const ejs = require('ejs');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    // this.firstName = user.name.split(' ')[0];
    this.firstName = user?.userName || user?.firstName;
    this.url = url;
    this.from = `Hr Management <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    
    // Sendgrid
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      service: "gmail",
      port:'2525',
      auth: {
        user: `${process.env.EMAIL_FROM}`,
        pass: 'sfpeuuboqmxdrewq',
      },
    });
  }

  // Send the actual email
  async send(template, subject, payload) {
    // 1) Render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      to: this.to,
      subject,
      payload,
    });

    // 2) Define email options
    const mailOptions = {
      from:this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
    console.log('in1');
  }

  async sendMessage(msg) {
    await this.send('Wallet', msg);
  }

  async sendEmail(payload) {
    await this.send(
      'welcome',
      payload?.subject,
      payload
    );
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  async sendPackageBuyEmail(payload) {
    await this.send('buyPackage', 'Package Purchased', payload);
  }

  async sendListingBookEmail(payload) {
    await this.send('bookListing', 'Listing Booked', payload);
  }

  async sendPaymentEmail(payload) {
    await this.send('payment', 'Payment Email', payload);
  }

  async sendPasswordResetComfirmation() {
    await this.send(
      'passwordReset',
      'Hr Management Password Change Notification'
    ); 
  }
};
