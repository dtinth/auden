import { IScene } from '../../core/model'
import { QuizBackstage } from './QuizBackstage'
import { QuizPresentation } from './QuizPresentation'

export const scene: IScene = {
  name: 'quiz',
  backstageComponent: QuizBackstage,
  presentationComponent: QuizPresentation
}
