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
      const result = await fetch(
        'https://auden-eventpop.vercel.app/api/eventpop',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken }),
        }
      ).then((res) => res.json())
      if (!result.token) {
        throw new Error('Did not receive a token')
      }
      await firebase.auth().signInWithCustomToken(result.token)
    })
  }
}
