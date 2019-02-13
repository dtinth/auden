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

## Data model

### Scene

Everything is organized into “scenes,” which represents a type of situation in
an event.

For example, you can have a scene for a quiz, for a survey, for voting, for
announcements, and an idle scene when there’s nothing interesting going on.

Each scene has:

- A state schema and security rules, stored in `database.rules.bolt`,
  representing how data in that scene looks like. It has to be deployed to
  Firebase.
- A state, stored in Firebase.
- A presentation display, for projecting to a large screen.
- A audience UI to let audience engage with the event from their mobile phone
  (or desktop).
- A backstage UI to manipulate the scene.

That can be one active scene at a given time.
