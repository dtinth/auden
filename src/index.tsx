import React from 'react'
import ReactDOM from 'react-dom'
import firebase from 'firebase'
import './index.css'
import { App } from './core/app'
import * as serviceWorker from './serviceWorker'
import { config } from './config'

firebase.initializeApp(config.firebase)
Object.assign(global, { firebase })

ReactDOM.render(<App config={config} />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister()
