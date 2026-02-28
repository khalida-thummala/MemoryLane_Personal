import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or standard SMTP config
    auth: {
        user: process.env.EMAIL_USER || 'memorylanemail@example.com',
        pass: process.env.EMAIL_PASS || 'password_placeholder'
    }
});

export const sendMilestoneReminder = async (user, memory, yearsAgo) => {
    // Only send if the env vars are actually setup, or log it if they aren't
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('EMAIL credentials not configured in .env. Milestone email skipped.');
        return;
    }

    const mailOptions = {
        from: `"MemoryLane" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `Your ${yearsAgo}-Year Nostalgia Milestone: ${memory.title} ✨`,
        html: `
            <div style="font-family: sans-serif; text-align: center; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 12px; overflow: hidden; box-shadow: 0px 4px 10px rgba(0,0,0,0.05);">
                <div style="background-color: #4f46e5; padding: 20px; color: white;">
                    <h2 style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        🌟 Happy Anniversary, ${user.name}! 🌟
                    </h2>
                </div>
                <div style="padding: 30px;">
                    <p style="font-size: 18px; line-height: 1.5;">
                        Exactly <strong>${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today</strong>, you celebrated an amazing milestone:
                    </p>
                    <h3 style="color: #4f46e5; font-size: 24px;">${memory.title}</h3>
                    <p style="color: #666; font-style: italic;">"${memory.description || 'A beautiful memory worth keeping.'}"</p>
                    <br/>
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/timeline" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                        Relive This Moment
                    </a>
                </div>
                <div style="padding: 15px; background-color: #f9fafb; font-size: 12px; color: #999;">
                    MemoryLane Inc. &copy; ${new Date().getFullYear()} - Keeping your past securely preserved.
                </div>
            </div>
        `
    };

    return await transporter.sendMail(mailOptions);
};
