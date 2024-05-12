
import {JWT, Credentials} from 'google-auth-library';
import key from 'storage/service/service-account.json';
import axios, {HttpStatusCode} from 'axios';

interface NotificationRecord {
  token?: string;
  topic?: string;
  title: string;
  body: string;
  messageId?: string;
}

const FCM_URL = `https://fcm.googleapis.com/v1/projects/${key.project_id}/messages:send`;
const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

class NotificationFCM {
  private static instance: NotificationFCM | null = null;
  private cachedToken?: Credentials;

  private constructor() {
    //
  }

  public static getInstance(): NotificationFCM {
    if (!NotificationFCM.instance) {
      NotificationFCM.instance = new NotificationFCM();
    }
    return NotificationFCM.instance;
  }

  private async refreshTokens(): Promise<Credentials | undefined> {
    const jwtClient = new JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: SCOPES,
    });

    try {
      const result = await jwtClient.authorize();
      return result;
    } catch (error) {
      console.error('Error getting credentials:', error);
      return undefined;
    }
  }

  private async buildMessage(
      message: NotificationRecord, token?: string): Promise<object> {
    if (!message.title || !message.body) {
      throw new Error('Notification must have title and body');
    }

    return {
      message: {
        ...(token ? {token} : {topic: message.topic}),
        notification: {
          title: message.title,
          body: message.body,
        },
      },
    };
  }

  private async sendRequest(message: object): Promise<void> {
    if (!this.cachedToken || Date.now() > (this.cachedToken.expiry_date ?? 0)) {
      this.cachedToken = await this.refreshTokens();
      if (!this.cachedToken) {
        throw new Error('Error getting credentials for sending message');
      }
    }

    try {
      const response = await axios.post(FCM_URL, message, {
        headers: {
          'Authorization': `Bearer ${this.cachedToken.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== HttpStatusCode.Ok) {
        console.error('Error sending message:', response.statusText);
        throw new Error('Error sending notification');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error; // Re-throw for potential handling in calling code
    }
  }

  public async send(
      message: NotificationRecord, token?: string): Promise<void> {
    const fcmMessage = await this.buildMessage(message, token);
    await this.sendRequest(fcmMessage);
  }

  public async sendToMany(
      message: NotificationRecord, tokens: string[]): Promise<void> {
    if (!tokens || tokens.length === 0) {
      throw new Error('No tokens provided for sending notifications');
    }

    const sendPromises = tokens.map(async (token) => {
      try {
        await this.send(message, token);
      } catch (error) {
        console.error('Error sending message to token:', token, error);
      }
    });

    await Promise.all(sendPromises);
  }
}

export default NotificationFCM;
