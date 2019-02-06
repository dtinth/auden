import React from 'react'
import ReactDOM from 'react-dom'
import firebase from 'firebase'
import './index.css'
import App from './App'
import * as serviceWorker from './serviceWorker'

// Initialize Firebase
var config = {
  apiKey: 'AIzaSyDWaXE2bSrgg1AL4TG1rZmFC2NyUQ2_D2A',
  authDomain: 'ingage-platform-demo.firebaseapp.com',
  databaseURL: 'https://ingage-platform-demo.firebaseio.com',
  projectId: 'ingage-platform-demo',
  storageBucket: 'ingage-platform-demo.appspot.com',
  messagingSenderId: '13020059910'
}
firebase.initializeApp(config)

Object.assign(global, { firebase })

ReactDOM.render(<App />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
