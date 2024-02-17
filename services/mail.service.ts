import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export namespace MailService {
  export const sendActivationMail = async (to: string, link: string) => {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: "Активация аккаунта на" + process.env.API_URL,
      text: "",
      html: `<div>
          <h1>Для активации перейдите по ссылке</h1>
          <a href="${link}">${link}</a>
        </div>`,
    });
  };
}
