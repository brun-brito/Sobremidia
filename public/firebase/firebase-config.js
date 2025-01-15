const firebaseConfig = {
    apiKey: "AIzaSyBU_6KaKhvg9OQuTiLJlD46vGWDvHuhBrs",
    authDomain: "sobremidia-ce.firebaseapp.com",
    projectId: "sobremidia-ce",
    storageBucket: "sobremidia-ce.appspot.com",
    messagingSenderId: "190741445946",
    appId: "1:190741445946:web:30dfe4f4e10690403a6403"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const settings = { timestampsInSnapshots: true };
db.settings(settings);