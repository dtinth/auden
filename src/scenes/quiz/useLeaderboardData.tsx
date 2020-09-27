import { useSceneContext } from '../../core/app/SceneContext'
import { useFirebaseDatabase } from 'fiery'
import { firebaseToEntries } from '../../core/app'

export function useLeaderboardData() {
  const context = useSceneContext()
  const scoreRef = context.dataRef
    .child('main')
    .child('state')
    .child('public-read')
    .child('score')
  const scoreState = useFirebaseDatabase(scoreRef)
  const points = (d: any) => firebaseToEntries(d).reduce((a, e) => a + e.val, 0)
  const scoreData = firebaseToEntries(scoreState.unstable_read())
    .sort((a, b) => {
      return points(b.val) - points(a.val)
    })
    .map((entry) => ({
      uid: entry.key,
      points: points(entry.val),
    }))
  return scoreData
}
