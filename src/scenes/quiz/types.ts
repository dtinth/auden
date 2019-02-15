export interface QuizDataModel {
  state?: {
    currentQuestion?: {
      questionId?: string
      startedAt?: string
    }
  }
  questions?: {
    [id: string]: {
      text?: string
    }
  }
}
