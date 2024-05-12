# NotificationFCM
Sending Firebase Cloud Messaging (FCM) notifications using Node.js.

## NotificationFCM Class for Sending FCM Notifications (Node.js)

This document describes the `NotificationFCM` class, a Node.js implementation for sending Firebase Cloud Messaging (FCM) notifications.

**Functionality**

The class facilitates sending notifications to mobile devices using FCM. It supports targeting devices either individually by token or collectively by topic.

**Key Components**

* **`NotificationRecord` Interface:** Defines the structure of a notification message:

    * `token` (optional): Unique identifier for a device.
    * `topic`: (optional) Topic used to send notifications to a group of devices subscribed to that topic.
    * `title`: Notification title displayed on the device.
    * `body`: Notification message body displayed on the device.
    * `messageId`: (optional) Identifier for the sent notification (implementation detail).

* **`NotificationFCM` Class:**
    - Singleton Pattern: Ensures only one instance of the class exists (`getInstance`).
    - Private Constructor: Prevents direct instantiation from outside the class.
    - `refreshTokens` method: Fetches a new Google Cloud credentials object using JWT authorization and stores it in `cachedToken`.
    - `send` method:
        - Refreshes credentials if necessary.
        - Constructs the FCM message payload based on the provided `message` and `token` (if specified).
        - Sends a POST request to the FCM API endpoint using Axios with appropriate headers (authorization, content type).
        - Handles errors during token refresh or message sending.
    - `sendToMany` method:
        - Refreshes credentials if necessary.
        - Iterates over the provided `tokens` array and sends separate notification requests (using `send`) for each token.
        - Uses Promise.all to handle sending to multiple devices concurrently.
        - Handles errors during token refresh or individual message sending.

**External Dependencies**

- `google-auth-library`: Used for JWT authentication and obtaining Google Cloud credentials.
- `axios`: Used for making HTTP requests to the FCM API.
- `storage/service-account.json`: Contains the service account credentials for the Google Cloud project (likely stored securely outside the code).

**Code Style and Best Practices**

- Adheres to common Node.js coding conventions (e.g., camelCase).
- Error handling with `try...catch` blocks.
- Asynchronous operations handled with promises.
- Singleton pattern for centralized credential management.

**Integration with GitHub**

- Include the code snippet in a Node.js project on GitHub.
- Exclude `storage/service-account.json` from version control using `.gitignore`.
- Link relevant FCM, Google Cloud credentials, and JWT authorization documentation in README or code comments.

**Additional Considerations**

- Enhance error handling with more specific messages.
- Implement logging or monitoring for notification delivery.
- Write unit tests to ensure functionality.
