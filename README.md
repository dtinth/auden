# auden

**auden** is an **open-source, hackable audience engagement software**,
supporting multiple features, such as **Live quiz** and **Voting system**. Its
hackable architecture allows developer to modify and add features to fit the
event.

We used **auden** in _[Code in the Dark](http://codeinthedark.com/) Thailand #3:
CNX 2019_ to encourage attendees to participate in the event more easily.

Instead of requiring all contestants to register beforehand (which takes quite a
courage), a **live quiz** system allows anyone in the event to compete to become
a contestant in each round.

![Photo](docs/images/use-case-quiz.jpg)

Because this app supports multiple features, when it’s time for voting,
attendees can vote on the same webpage without the need to switch between
multiple apps (such as Mentimeter, Slido, and Kahoot).

![Photo](docs/images/use-case-vote.jpg)

## Feature tour

Each feature (called **scene**) contains 3 user-facing
[components](https://reactjs.org/docs/components-and-props.html):

- The **Audience** component is a mobile UI for audience to engage in the event.
- The **Presentation** component displays what the audience will see on the big
  screen.
- The **Backstage** component allows event staff to manipulate the scene (such
  as activating a question, displaying scoreboard, etc.)

### `quiz`

Play a multiple-choice quiz game with any number of participants, similar to
Kahoot.

![Photo](docs/images/example-quiz.png)

### `vote`

Create a live poll to gather audience’s opinion, similar to Mentimeter.

![Photo](docs/images/example-vote.png)

## Technical

It is a webapp, built on top of:

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

## Authentication

The app supports two authentication methods:

- **Facebook Authentication**: Standard social login via Firebase Auth
- **Eventpop Ticket Authentication**: For event attendees with tickets. The server-side authentication logic is handled by a separate service: [auden-eventpop](https://github.com/dtinth/auden-eventpop)

## Data model

### Scene

Everything is organized into “scenes,” which represents a type of situation in
an event.

For example, you can have a scene for a quiz, for a survey, for voting, for
announcements, and an idle scene when there’s nothing interesting going on.

Each scene has:

- A presentation display, for projecting to a large screen.
- A audience UI to let audience engage with the event from their mobile phone
  (or desktop).
- A backstage UI to manipulate the scene.

Data is structured in Firebase this way: **Namespace &rarr; Name &rarr; Access
pattern**. This allows using same Firebase rules across all scene types,
eliminating need for us to deploy new rules when adding new scene types.

Available access patterns:

- `public-read` — Anyone can read but only admins can write. Examples:
  - `main` &rarr; `state` &rarr; `public-read` &rarr; `showLeaderboard`
  - `main` &rarr; `settings` &rarr; `public-read` &rarr; `maxVotes`
- `personal` — Anyone can read, however, each user can write to their own
  personal slot. Examples:
  - `main` &rarr; `poll` &rarr; `personal` &rarr; `$uid` &rarr; `selectedOption`
- `events` — Anyone can read. Each user can publish events. Append-only.
  Examples:
  - `main` &rarr; `chatMessages` &rarr; `events` &rarr; `$eventId`
- `private` — Each user can read and write to their own personal slot. Examples:
  - `answers` &rarr; `$questionId` &rarr; `private` &rarr; `$uid` &rarr;
    `answerId`
- `inbox` — Each user can read data assigned to their own personal slot.
  Examples:
  - `main` &rarr; `role` &rarr; `inbox` &rarr; `$uid`
- `secret` — Only admin can access
  - `main` &rarr; `questions` &rarr; `secret`

### Screen

An instance of a scene. It has:

- Data stored in Firebase. How data is used is determined by scene type.

That can be one active screen at a given time.
