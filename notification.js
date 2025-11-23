import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { Console } from 'console';
import nodemailer from 'nodemailer'; // <--- ADD THIS IMPORT

// Load environment variables from .env file
dotenv.config();

// --- Configuration ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY; // IMPORTANT: Use a Service Role Key for background jobs, not the standard anon key, as it needs elevated permissions to update the table directly.
const TABLE_NAME = 'notification_queue';

// --- Nodemailer Initialization ---
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const SENDER_EMAIL = process.env.SENDER_EMAIL;

if (!EMAIL_USER || !EMAIL_PASS) {
    console.error("❌ ERROR: Email service credentials (EMAIL_USER, EMAIL_PASS) must be set.");
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT == 465, // true for port 465, false for other ports
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your environment variables.");
    process.exit(1);
}

// Initialize Supabase Client
// Using the service key allows us to bypass Row Level Security (RLS) for server-side tasks.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * 📧 Placeholder function for actual email sending logic.
 * In a real application, you would replace this with calls to SendGrid, Nodemailer, etc.
 * @param {string} recipient_email - The email address of the recipient.
 * @param {string} subject - The email subject line.
 * @param {string} body_content - The HTML or plain text body of the email.
 * @returns {Promise<boolean>} True if the email was sent successfully, false otherwise.
 */
async function sendEmail(recipient_email, subject, body_content) {
    try {
        console.log(`  -> Attempting to send email to: ${recipient_email}`);

        const info = await transporter.sendMail({
            from: SENDER_EMAIL,        // Sender address from your .env file
            to: recipient_email,       // List of recipients
            subject: subject,          // Subject line
            html: body_content,        // HTML body content
        });

        console.log(`  ✅ Success: Email sent to ${recipient_email}. Message ID: ${info.messageId}`);
        return true;

    } catch (error) {
        // Nodemailer throws an error on failure, which we catch here.
        console.error(`  🚨 Critical Error sending email to ${recipient_email}:`, error.message);
        // Log the error detail to help with debugging
        if (error.response) {
            console.error("  SMTP Response:", error.response);
        }
        return false;
    }
}

/**
 * Main function to fetch, send, and update the notification queue.
 */
async function processQueue() {
    console.log(`\n--- CRON JOB STARTED: ${new Date().toISOString()} ---`);
    console.log(`Fetching unsent notifications from ${TABLE_NAME}...`);

    try {
        // 1. Fetch unsent notifications (where sent_at is null)
        const { data: notifications, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .is('sent_at', null)
            .order('created_at', { ascending: true }) // Process oldest first
            .limit(100); // Limit batch size to prevent long running transactions

        if (error) {
            throw new Error(`Supabase Fetch Error: ${error.message}`);
        }

        if (!notifications || notifications.length === 0) {
            console.log('No pending notifications found. Exiting.');
            return;
        }

        console.log(`Found ${notifications.length} pending notifications to process.`);

        let successfulSends = 0;
        let failedSends = 0;
        const successfulIds = [];

        // 2. Iterate and send emails
        for (const notification of notifications) {
            const emailSent = await sendEmail(
                notification.recipient_email,
                notification.subject,
                notification.body_content
            );

            if (emailSent) {
                successfulSends++;
                successfulIds.push(notification.id);
            } else {
                failedSends++;
                // If it fails, we leave sent_at as null for the next run to attempt it again.
            }
        }

        // 3. Update sent records in a single batch operation
    if (successfulIds.length > 0) {
        console.log(`\nUpdating ${successfulIds.length} records in the database...`);
        const now = new Date().toISOString();

        // The payload for the update operation
        const updateData = {
            sent_at: now
        };

        // Use .update() and a .in() filter on the 'id' column
        const { error: updateError } = await supabase
            .from(TABLE_NAME)
            .update(updateData) // Only updates the 'sent_at' column
            .in('id', successfulIds); // Applies the update to all IDs in the successful list

        if (updateError) {
            console.error('❌ Supabase Update Error:', updateError.message);
        } else {
            console.log(`✅ Successfully marked ${successfulIds.length} notifications as sent.`);
        }
    }

        console.log(`\n--- CRON JOB FINISHED ---`);
        console.log(`Summary: ${successfulSends} sent, ${failedSends} failed (will be retried).`);

    } catch (e) {
        console.error('🚨 Global Cron Job Failure:', e.message);
    }
}

// --- Schedule the Cron Job ---

// This expression runs every 5 minutes:
// Seconds (optional) | Minutes | Hours | Day of Month | Month | Day of Week
//      * |    * |   * |      * |   * |      *
//
// You can adjust the schedule here.
// Common schedules:
// '*/5 * * * *' : Every 5 minutes (default below)
// '0 9 * * *'   : Every day at 9:00 AM
// '* * * * *'   : Every minute (for testing only)
const cronSchedule = '* * * * *'; 

console.log(`\nScheduler initialized. Cron job will run with schedule: "${cronSchedule}"`);
console.log('Press Ctrl+C to stop the process.');

cron.schedule(cronSchedule, () => {
    processQueue();
}, {
    scheduled: true,
    timezone: "America/New_York" // Set your desired timezone for accurate scheduling
});

// Run the function immediately on startup as well


sendEmail("shobhabadiger0@gmail.com", "test", "test");