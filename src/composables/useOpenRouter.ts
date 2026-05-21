import { ref } from 'vue'
import type { Client, AiEvent } from '../types'

const URL = import.meta.env.VITE_OR_URL?.trim()
const API_KEY = import.meta.env.VITE_OR_API_KEY?.trim()

const PROFILE_URL = '/proxy/user-profile/users'

// Кэш guid → отображаемое имя, живёт на всё время сессии
const nameCache = new Map<string, string>()

interface LogRecord {
  id: string
  guid: string
  model: string
  date: string
  total_cost: string
}

interface UserProfile {
  data?: {
    first_name?: string | null
    last_name?: string | null
    patronymic?: string | null
    guid?: string
  }
  success?: boolean
}

async function fetchUserName(guid: string): Promise<string> {
  if (nameCache.has(guid)) return nameCache.get(guid)!

  try {
    const res = await fetch(`${PROFILE_URL}/${guid}`)
    if (!res.ok) throw new Error('not ok')

    const json = await res.json() as UserProfile
    if (!json.success || !json.data) throw new Error('no data')

    const { first_name, last_name, patronymic } = json.data
    const name = [last_name, first_name, patronymic].filter(Boolean).join(' ') || guid
    nameCache.set(guid, name)
    return name
  } catch {
    nameCache.set(guid, guid)
    return guid
  }
}

function logsToClients(records: LogRecord[]): Client[] {
  const map = new Map<string, Client>()

  for (const rec of records) {
    const parts = rec.model.split('/')
    const provider = parts.length > 1 ? parts[0] : rec.model

    if (!map.has(rec.guid)) {
      map.set(rec.guid, {
        name: rec.guid, // временно guid, заменим после обогащения
        case: `(${rec.guid})`,
        status: provider,
        events: [],
      })
    }

    const event: AiEvent = {
      date: rec.date,
      operation: rec.model,
      service: provider,
      cost: parseFloat(rec.total_cost),
    }

    map.get(rec.guid)!.events.push(event)
  }

  return Array.from(map.values())
}

async function enrichWithNames(clients: Client[], guids: string[]): Promise<void> {
  // Один запрос на guid, параллельно
  const names = await Promise.all(guids.map(guid => fetchUserName(guid)))
  guids.forEach((guid, i) => {
    const client = clients.find(c => c.name === guid)
    if (client) client.name = names[i]
  })
}

export function useOpenRouter() {
  const loading = ref(false)
  const error = ref('')

  async function fetchData(): Promise<Client[]> {
    loading.value = true
    error.value = ''

    try {
      const res = await fetch(URL, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`${res.status}: ${txt.slice(0, 150)}`)
      }

      const data = await res.json() as LogRecord[]
      const clients = logsToClients(data)

      const guids = clients.map(c => c.name) // имена пока = guid
      await enrichWithNames(clients, guids)

      return clients
    } catch (e) {
      error.value = (e as Error).message ?? 'Ошибка при загрузке'
      return []
    } finally {
      loading.value = false
    }
  }

  return { loading, error, fetchData }
}
