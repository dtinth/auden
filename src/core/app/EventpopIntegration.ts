import firebase from 'firebase'
import { signInIntegrationCallbacks } from './SignInIntegrationCallbacks'

export function checkHashForEventpopTicketToken() {
  const regexp = /#eventpop_ticket_token=([^&#]+)/
  const m = (window.location.hash || '').match(regexp)
  if (m) {
    sessionStorage.eventpopTicketToken = m[1]
    window.location.hash = window.location.hash.replace(regexp, '')
  }
  if (sessionStorage.eventpopTicketToken) {
    const idToken = sessionStorage.eventpopTicketToken
    delete sessionStorage.eventpopTicketToken
    signInIntegrationCallbacks.push(async () => {
      const result = await firebase
        .functions()
        .httpsCallable('authenticateEventpopTicket')({ idToken })
      if (!result.data.token) {
        throw new Error('Did not receive a token')
      }
      await firebase.auth().signInWithCustomToken(result.data.token)
    })
  }
}
