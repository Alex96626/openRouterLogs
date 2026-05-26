import { ref } from 'vue'
import type { Client, AiEvent } from '../types'

const URL = import.meta.env.VITE_OR_URL?.trim()
const API_KEY = import.meta.env.VITE_OR_API_KEY?.trim()
const BFL_API_KEY = import.meta.env.VITE_BFL_API_KEY?.trim()

const PROFILE_URL = 'https://api-bfldocs.bfl-soft.com/api/kval//user-profile/users'
const STATUS_URL = 'https://api-bfldocs.bfl-soft.com/api/kval//user-status/statuses'

// Кэш guid → отображаемое имя, живёт на всё время сессии
const nameCache = new Map<string, string>()
const statusCache = new Map<string, string>()

interface LogRecord {
  id: string
  guid: string
  model: string
  action?: string
  description?: string
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

interface UserStatus {
  data?: {
    step_type?: {
      value?: string | null
    } | null
  }
  success?: boolean
}

async function fetchUserName(guid: string): Promise<string> {
  if (nameCache.has(guid)) return nameCache.get(guid)!

  try {
    const res = await fetch(`${PROFILE_URL}/${guid}`, {
      headers: { Authorization: `Bearer ${BFL_API_KEY}` },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`profile ${res.status}: ${body.slice(0, 200)}`)
    }

    const json = await res.json() as UserProfile
    if (!json.success || !json.data) throw new Error('profile: no data')

    const { first_name, last_name, patronymic } = json.data
    const name = [last_name, first_name, patronymic].filter(Boolean).join(' ') || guid
    nameCache.set(guid, name)
    return name
  } catch (e) {
    // не кэшируем ошибку — следующий вызов повторит запрос
    console.warn('[profile]', guid, (e as Error).message)
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
      operation: [rec.action, rec.description].filter(Boolean).join(' ') || rec.model,
      service: rec.model.split('/').pop()!,
      cost: parseFloat(rec.total_cost),
    }

    map.get(rec.guid)!.events.push(event)
  }

  return Array.from(map.values())
}

async function fetchUserStatus(guid: string): Promise<string> {
  if (statusCache.has(guid)) return statusCache.get(guid)!

  try {
    const res = await fetch(`${STATUS_URL}/${guid}`, {
      headers: { Authorization: `Bearer ${BFL_API_KEY}` },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      throw new Error(`status ${res.status}: ${body.slice(0, 200)}`)
    }

    const json = await res.json() as UserStatus
    const value = json.data?.step_type?.value
    if (!value) throw new Error('status: no step_type.value')

    statusCache.set(guid, value)
    return value
  } catch (e) {
    console.warn('[status]', guid, (e as Error).message)
    return ''
  }
}

async function enrichWithNames(clients: Client[], guids: string[]): Promise<void> {
  // Один запрос на guid, параллельно
  const names = await Promise.all(guids.map(guid => fetchUserName(guid)))
  guids.forEach((guid, i) => {
    const client = clients.find(c => c.name === guid)
    if (client) client.name = names[i]
  })
}

async function enrichWithStatuses(clients: Client[], guids: string[]): Promise<void> {
  const statuses = await Promise.all(guids.map(guid => fetchUserStatus(guid)))
  guids.forEach((guid, i) => {
    if (!statuses[i]) return
    const client = clients.find(c => c.case === `(${guid})`)
    if (client) client.status = statuses[i]
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
      await Promise.all([
        enrichWithNames(clients, guids),
        enrichWithStatuses(clients, guids),
      ])

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
