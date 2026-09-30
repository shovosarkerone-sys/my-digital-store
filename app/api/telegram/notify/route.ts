import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getNotificationHeader(subject: string, userName: string) {
  if (subject === "New Product Added") {
    return `📦 <b>${escapeHtml(userName)} added a new product!</b>`;
  }

  if (subject === "Product Edited") {
    return `📝 <b>${escapeHtml(userName)} edited a product!</b>`;
  }

  if (subject === "Product Deleted") {
    return `🗑️ <b>${escapeHtml(userName)} deleted a product!</b>`;
  }

  if (subject === "New Direct Message") {
    return `💬 <b>New direct message from ${escapeHtml(userName)}!</b>`;
  }

  return "🚨 <b>New Support Ticket</b>";
}

function getEmailSubject(subject: string) {
  switch (subject) {
    case "New Product Added":
      return "Inskeys - New Product Added";
    case "Product Edited":
      return "Inskeys - Product Updated";
    case "Product Deleted":
      return "Inskeys - Product Deleted";
    case "New Direct Message":
      return "Inskeys - New Direct Message";
    default:
      return "Inskeys - Support Ticket Received";
  }
}

function getEmailTitle(subject: string, userName: string) {
  switch (subject) {
    case "New Product Added":
      return `${userName} added a new product`;
    case "Product Edited":
      return `${userName} edited a product`;
    case "Product Deleted":
      return `${userName} deleted a product`;
    case "New Direct Message":
      return "New direct message";
    default:
      return "Support ticket received";
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Notification API is working!",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const ticketId = String(body?.ticketId || "N/A");
    const userName = String(body?.userName || "Member");
    const email = String(body?.email || "").trim();
    const subject = String(body?.subject || "Support Ticket");
    const message = String(body?.message || "No Message");

    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    const telegramHeader = getNotificationHeader(subject, userName);

    const telegramText = [
      telegramHeader,
      "",
      `<b>Ref ID:</b> #${escapeHtml(ticketId)}`,
      `<b>Email:</b> ${escapeHtml(email || "N/A")}`,
      `<b>Subject:</b> ${escapeHtml(subject)}`,
      `<b>Details:</b> ${escapeHtml(message)}`,
    ].join("\n");

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Inskeys Notification</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
          <div style="max-width:600px;margin:40px auto;padding:0 16px;">
            <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
              
              <div style="padding:24px;border-bottom:1px solid #e5e7eb;">
                <div style="font-size:22px;font-weight:700;color:#111827;">
                  Inskeys
                </div>
                <div style="margin-top:6px;font-size:14px;color:#6b7280;">
                  Digital Marketplace
                </div>
              </div>

              <div style="padding:28px 24px;">
                <h2 style="margin:0 0 20px;font-size:22px;color:#111827;">
                  ${escapeHtml(getEmailTitle(subject, userName))}
                </h2>

                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4b5563;">
                  Hello ${escapeHtml(userName)},
                </p>

                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563;">
                  Your notification has been successfully received by Inskeys.
                </p>

                <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:18px;margin-bottom:20px;">
                  <div style="margin-bottom:12px;">
                    <strong style="color:#111827;">Reference ID:</strong>
                    <span style="color:#4b5563;">#${escapeHtml(ticketId)}</span>
                  </div>

                  <div style="margin-bottom:12px;">
                    <strong style="color:#111827;">Subject:</strong>
                    <span style="color:#4b5563;">${escapeHtml(subject)}</span>
                  </div>

                  <div>
                    <strong style="color:#111827;">Message:</strong>
                    <div style="margin-top:8px;color:#4b5563;line-height:1.6;white-space:pre-wrap;">
                      ${escapeHtml(message)}
                    </div>
                  </div>
                </div>

                <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                  If you did not initiate this request, please contact Inskeys Support.
                </p>
              </div>

              <div style="padding:20px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;">
                  © ${new Date().getFullYear()} Inskeys. All rights reserved.
                </p>
              </div>

            </div>
          </div>
        </body>
      </html>
    `;

    const notificationTasks: Promise<unknown>[] = [];

    if (telegramToken && telegramChatId) {
      notificationTasks.push(
        fetch(
          `https://api.telegram.org/bot${telegramToken}/sendMessage`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: telegramText,
              parse_mode: "HTML",
            }),
          }
        ).then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Telegram API Error: ${response.status} ${errorText}`
            );
          }

          return response;
        })
      );
    } else {
      console.error(
        "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID"
      );
    }

    if (email && email.toLowerCase() !== "n/a") {
      notificationTasks.push(
        sendEmail(
          email,
          getEmailSubject(subject),
          emailHtml
        )
      );
    } else {
      console.warn("No valid recipient email provided.");
    }

    const results = await Promise.allSettled(notificationTasks);

    const failedNotifications = results.filter(
      (result) => result.status === "rejected"
    );

    if (failedNotifications.length > 0) {
      failedNotifications.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Notification error:", result.reason);
        }
      });
    }

    const successfulNotifications = results.length - failedNotifications.length;

    return NextResponse.json(
      {
        success: successfulNotifications > 0,
        message: "Notification processing completed.",
        notifications: {
          attempted: results.length,
          successful: successfulNotifications,
          failed: failedNotifications.length,
        },
      },
      {
        status: successfulNotifications > 0 ? 200 : 500,
      }
    );
  } catch (error) {
    console.error("Notification API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process notifications.",
      },
      {
        status: 500,
      }
    );
  }
}