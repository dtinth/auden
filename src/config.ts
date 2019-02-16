import * as quiz from './scenes/quiz'
import * as vote from './scenes/vote'
import { IConfig } from './core/model'

export const config: IConfig = {
  firebase: {
    apiKey: 'AIzaSyDWaXE2bSrgg1AL4TG1rZmFC2NyUQ2_D2A',
    authDomain: 'ingage-platform-demo.firebaseapp.com',
    databaseURL: 'https://ingage-platform-demo.firebaseio.com',
    projectId: 'ingage-platform-demo',
    storageBucket: 'ingage-platform-demo.appspot.com',
    messagingSenderId: '13020059910'
  },
  scenes: [quiz.scene, vote.scene]
}
