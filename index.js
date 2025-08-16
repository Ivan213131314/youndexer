// Firebase Functions entry point
// This file exports the server from server.js for Firebase Functions

const functions = require('firebase-functions');
const app = require('./server');

// Export the Express app as a Firebase Function
exports.server = functions.https.onRequest(app); 