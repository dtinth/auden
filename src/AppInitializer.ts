import { config } from './config'
import firebase from 'firebase'

export function initializeApp() {
  // Check if we should use Firebase emulators
  const useEmulator = localStorage.getItem('USE_FIREBASE_EMULATOR') === 'true'
  
  if (useEmulator) {
    // Initialize with emulator database URL including namespace
    const namespace = localStorage.getItem('FIREBASE_DB_NAMESPACE') || 'default'
    const emulatorConfig = {
      ...config.firebase,
      databaseURL: `http://localhost:9000/?ns=${namespace}`
    }
    firebase.initializeApp(emulatorConfig)
    
    // Connect to Auth emulator  
    firebase.auth().useEmulator('http://localhost:9099')
  } else {
    firebase.initializeApp(config.firebase)
  }
  
  Object.assign(global, { firebase })
}

if (module.hot) {
  module.hot.accept()
}
