export interface AiEvent {
  date: string
  operation: string
  service: string
  cost: number
}

export interface Client {
  name: string
  case?: string
  status: string
  events: AiEvent[]
}
