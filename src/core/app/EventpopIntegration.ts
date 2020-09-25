export function checkHashForEventpopTicketToken() {
  const regexp = /#eventpop_ticket_token=([^&#]+)/
  const m = (window.location.hash || '').match(regexp)
  if (m) {
    sessionStorage.eventpopTicketToken = m[1]
    window.location.hash = window.location.hash.replace(regexp, '')
  }
}
