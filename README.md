# sato-auth

This project defines parts of the Nation's Firebase project to allow for people in the organization to authenticate.

When authenticating with an account from our Google Workspace, Firebase links the account to an account of its own.

This Firebase account has the groups of the Google Workspace account attached for role-based access management.

These groups can be then used server-side (in Firebase Functions or Firestore Rules) to verify roles.

You can test this project using `firebase emulators:start`. The website in `/test-login` is served. You have to log in with an email that exists in Google Workspace.
You also have to be logged in with some credentials to Google Cloud for the process to access your groups. I'll write this later.
You also have to setup the Firebase CLI, todo later or just google it. Sorry.

If you run the emulators and modify code, remember to run `npx tsc` or `npx tsc -w` for watch mode.
