import * as firebase from 'firebase';

var config = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  storageBucket: "",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID"
};

let firebaseApp = firebase.initializeApp(config);
let database = firebase.database().ref();
let solutionsRefs = database.child('solutions');

let exportData = {
  App: firebaseApp,
  Database: database,
  SolutionsRefs: solutionsRefs,
}

export default exportData
