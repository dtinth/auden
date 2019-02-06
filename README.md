# ingage

The hackable audience engagement platform for...

- Live quiz!
- Voting system!
- And more!

...built on top of...

- React!
- TypeScript!
- Grommet!
- Firebase Real-time Database!
- fiery :fire:!
- Hooks and Suspense!

## Set up Firebase project

1. **Set up Firebase Authentication** to allow sign in using Facebook.

2. **Sign in** using the web app, and obtain the Firebase user ID by running
   `firebase.auth().currentUser.uid` in the JavaScript console.

3. **Make the user an admin** by writing `true` Firebase Database at
   `/admins/$uid`. Admin users can read and write anything.
