// inngest/index.js
import { Inngest, step } from "inngest";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import sendEmail from "../configs/nodeMailer.js";
import Story from "../models/Story.js";
import Message from "../models/Message.js";

// Create Inngest client
export const inngest = new Inngest({ id: "FusionPoint-app" });

/* -------------------------------------------------------------------------- */
/*                       USER SYNC (CREATE | UPDATE | DELETE)                 */
/* -------------------------------------------------------------------------- */

// Sync new user from Clerk
const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    let username = email_addresses[0].email_address.split("@")[0];

    const existing = await User.findOne({ username });
    if (existing) {
      username = username + Math.floor(Math.random() * 10000);
    }

    await User.create({
      _id: id,
      email: email_addresses[0].email_address,
      full_name: `${first_name} ${last_name}`,
      profile_picture: image_url,
      username,
    });
  }
);

// Sync updated user
const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    await User.findByIdAndUpdate(id, {
      email: email_addresses[0].email_address,
      full_name: `${first_name} ${last_name}`,
      profile_picture: image_url,
    });
  }
);

// Sync user deletion
const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);

/* -------------------------------------------------------------------------- */
/*                   SEND CONNECTION REQUEST + REMINDER EMAIL                 */
/* -------------------------------------------------------------------------- */

const sendNewConnectionRequestReminder = inngest.createFunction(
  { id: "send-new-connection-request-reminder" },
  { event: "app/connection-request" },
  async ({ event, step }) => {
    const { connectionId } = event.data;

    // 1️⃣ Send first email immediately
    await step.run("send-connection-request-email", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );

      const subject = `New Connection Request`;
      const body = `
        <div style="font-family: Arial; padding:20px;">
          <h2>Hi ${connection.to_user_id.full_name},</h2>
          <p>You have a new connection request from ${connection.from_user_id.full_name} (@${connection.from_user_id.username})</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981;">here</a> to accept or reject.</p>
        </div>
      `;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });
    });

    // 2️⃣ Wait 24 hours
    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);

    // 3️⃣ Send reminder email if still not accepted
    await step.run("send-connection-request-reminder-email", async () => {
      const connection = await Connection.findById(connectionId).populate(
        "from_user_id to_user_id"
      );

      if (connection.status === "accepted") {
        return { message: "Already accepted" };
      }

      const subject = `Reminder: You have a new connection request`;
      const body = `
        <div style="font-family: Arial; padding:20px;">
          <h2>Hi ${connection.to_user_id.full_name},</h2>
          <p>Reminder — You have a connection request from ${connection.from_user_id.full_name}.</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/connections" style="color:#10b981;">here</a> to respond.</p>
        </div>
      `;

      await sendEmail({
        to: connection.to_user_id.email,
        subject,
        body,
      });

      return { message: "Reminder sent" };
    });
  }
);

/* -------------------------------------------------------------------------- */
/*                             DELETE STORY AFTER 24H                          */
/* -------------------------------------------------------------------------- */

const deleteStory = inngest.createFunction(
  { id: "story-delete" },
  { event: "app/story.delete" },
  async ({ event, step }) => {
    const { storyId } = event.data;

    const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await step.sleepUntil("wait-for-24-hours", in24Hours);

    await step.run("delete-story", async () => {
      await Story.findByIdAndDelete(storyId);
      return { message: "Story deleted." };
    });
  }
);

/* -------------------------------------------------------------------------- */
/*                     DAILY CRON — SEND UNSEEN MESSAGE ALERTS                */
/* -------------------------------------------------------------------------- */

const sendNotificationOfUnseenMessages = inngest.createFunction(
  { id: "send-unseen-messages-notification" },
  {
    cron: "0 9 * * *", // Run at 9 AM daily
    timezone: "America/New_York",
  },
  async ({ step }) => {
    const messages = await Message.find({ seen: false }).populate("to_user_id");

    const unseenCount = {};

    messages.map((m) => {
      unseenCount[m.to_user_id._id] =
        (unseenCount[m.to_user_id._id] || 0) + 1;
    });

    for (const userId in unseenCount) {
      const user = await User.findById(userId);

      const subject = `You have ${unseenCount[userId]} unseen messages`;
      const body = `
        <div style="font-family: Arial; padding:20px;">
          <h2>Hi ${user.full_name},</h2>
          <p>You have ${unseenCount[userId]} unseen messages.</p>
          <p>Click <a href="${process.env.FRONTEND_URL}/messages" style="color:#10b981;">here</a> to view them.</p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject,
        body,
      });
    }

    return { message: "Notifications sent." };
  }
);

/* -------------------------------------------------------------------------- */
/*                          EXPORT ALL INNGEST FUNCTIONS                      */
/* -------------------------------------------------------------------------- */

export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  sendNewConnectionRequestReminder,
  deleteStory,
  sendNotificationOfUnseenMessages,
];
