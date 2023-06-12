import { Job, Worker } from "bullmq";
import { getNearestUsers } from "../functions/getNearestUsers";
import webPush from "web-push";
import { Subscription } from "../models/subscription.model";

class NotificationWorker {
  constructor() {
    const worker: Worker = new Worker('notification', async (job: Job) => {
      const users = await getNearestUsers(job.data.location);

      const subscribedUsers = await Subscription.find({ user: users.map(el => el._id) }).select(["-user", "-_id", "-__v"])

      const options: any = {
        vapidDetails: {
          subject: 'mailto:resq@resq.com',
          publicKey: process.env.VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY,
        },
      }

      subscribedUsers.map(async (el: any) => {
        try {
          await webPush.sendNotification(
            el,
            JSON.stringify({
              title: job.data.incidentName,
              description: job.data.description,
              location: job.data.location
            }),
            options
          )
        } catch (error) {
          console.log(error);
        }
      })
      return {
        status: "Notification sent!",
        location: job.data.location
      };
    }, {
      connection: {
        host: "localhost",
        port: 6379,
      }
    })

    worker.on('completed', (job: Job, returnValue: any) => {
      console.log(returnValue);
    })

    worker.on('error', err => {
      console.error(err);
    })
  }
}



export { NotificationWorker }