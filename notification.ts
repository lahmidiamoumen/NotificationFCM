import {JWT, Credentials} from 'google-auth-library';
import key from 'storage/service/service-account.json';
import axios, {HttpStatusCode} from 'axios';

export interface NotificationRecord {
  token?: string;
  topic?: 'ALL' | string;
  title: string;
  body: string;
  messageId: string;
}

const URL = `https://fcm.googleapis.com/v1/projects/${key.project_id}/messages:send`;
const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];


class NotificationFCM {
  private static instance: NotificationFCM;
  private cachedToken?: Credentials;

  private constructor() {/* private */}

  refreshTokens() {
    return new Promise<Credentials | undefined>((resolve) => {
      const jwtClient = new JWT({
        email: key.client_email,
        key: key.private_key,
        scopes: SCOPES,
      });

      jwtClient.authorize((err: Error | null, result?: Credentials) => {
        resolve(result);
      });
    });
  }

  async send(message: NotificationRecord, token?: string) {
    if (!this.cachedToken || Date.now() > (this.cachedToken.expiry_date ?? 0)) {
      this.cachedToken = await this.refreshTokens();
      if (!this.cachedToken) {
        throw new Error('Error getting notification cresentila;');
      }
    }

    try {
      const response = await axios.post(URL, {
        message: {
          ...(token ? {token: token}:{topic: message.topic}),
          notification: {
            title: message.title,
            body: message.body,
          },
        },
      }, {
        headers: {
          'Authorization': `Bearer ${this.cachedToken.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== HttpStatusCode.Ok) {
        console.log(response.statusText);
        throw new Error('Error sending message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendToMany(message: NotificationRecord, tokens: string[]) {
    if (!this.cachedToken || Date.now() > (this.cachedToken.expiry_date ?? 0)) {
      this.cachedToken = await this.refreshTokens();
      if (!this.cachedToken) {
        throw new Error('Error sending notification');
      }
    }
    const sendPromises = tokens.map(async (token) => {
      try {
        const response = await axios.post(URL, {
          message: {
            ...(message.topic ? {topic: message.topic} : {token: token}),
            notification: {
              title: message.title,
              body: message.body,
            },
          },
        }, {
          headers: {
            'Authorization': `Bearer ${this.cachedToken?.access_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status !== HttpStatusCode.Ok) {
          console.log(response.statusText);
          throw new Error('Error sending message');
        }
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    });

    try {
      await Promise.all(sendPromises);
    } catch (error) {
      throw new Error(`${error}`);
    }
  }


  public static getInstance(): NotificationFCM {
    if (!NotificationFCM.instance) {
      NotificationFCM.instance = new NotificationFCM();
    }
    return NotificationFCM.instance;
  }
}

export default NotificationFCM;
