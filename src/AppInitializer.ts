import { config } from './config'
import firebase from 'firebase'

export function initializeApp() {
  firebase.initializeApp(config.firebase)
  Object.assign(global, { firebase })
}

if (module.hot) {
  module.hot.accept()
}
