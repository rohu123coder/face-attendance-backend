var admin = require("firebase-admin");
var serviceAccount = require("./firebase-key.json");

class FirebaseConfig {
  constructor() {
    // Private instance variable
    console.log("constructing config");
    this._instance = null;
    this.firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  }

  static getInstance() {
    if (!this._instance) {
      this._instance = new FirebaseConfig();
    }
    return this._instance;
  }

  // Define the push notification function
 sendPushNotification = async (title, body, token) => {
  
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
      };
    const data = {
      notification: {
        title: title,
        body: body,
        icon: 'your-icon-url',
      },
    };
    await this.firebaseAdmin.messaging().sendToDevice(token, data, options);
  }

  sendSilentPushNotification = async (title, body, token) => {
  
    const options = {
        priority: "high",
        timeToLive: 60 * 60 * 24
      };
    
    const data = {
      notification: {
        title: title,
        body: body,
        icon: 'your-icon-url',
        
      },
    };
    await this.firebaseAdmin.messaging().sendToDevice(token, data, options);
  }

}

module.exports = FirebaseConfig;


