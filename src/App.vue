<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Workbook } from '@syncfusion/ej2-excel-export'
import ClientsTable from './components/ClientsTable.vue'
import ClientDetail from './components/ClientDetail.vue'
import { useOpenRouter } from './composables/useOpenRouter'
import type { Client } from './types'

const { loading, error, fetchData } = useOpenRouter()

const clients = ref<Client[]>([])
const selectedName = ref<string | null>(null)
const searchQuery = ref('')

async function load() {
  const result = await fetchData()
  clients.value = result
  selectedName.value = result[0]?.name ?? null
}

onMounted(load)

const filteredClients = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return clients.value
  return clients.value.filter(c =>
    (c.name + (c.case ?? '') + c.status).toLowerCase().includes(q),
  )
})

const selectedClient = computed(() =>
  clients.value.find(c => c.name === selectedName.value) ?? null,
)

// Excel-экспорт всех отфильтрованных данных по всем юзерам
function exportXlsx() {
  const headerStyle = { bold: true, backColor: '#2563eb', fontColor: '#FFFFFF' }

  const idx = <T,>(arr: T[]) => arr.map((item, i) => ({ ...item, index: i + 1 }))

  const dataRows = filteredClients.value.flatMap(client =>
    client.events.map(event => ({
      cells: idx([
        { value: client.name },
        { value: event.operation },
        { value: event.service },
        { value: event.date },
        { value: event.cost.toFixed(6) },
      ]),
    })),
  )

  const allRows = idx([
    {
      cells: idx(
        ['Пользователь', 'ИИ-операция', 'Сервис', 'Дата', 'Стоимость ($)'].map(v => ({
          value: v,
          cellStyle: headerStyle,
        })),
      ),
    },
    ...dataRows,
  ])

  const workbook = new Workbook(
    {
      worksheets: [{ name: 'AI Costs', rows: allRows }],
    },
    'xlsx',
  )

  workbook.save(`ai-costs-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>

<template>
  <main>
    <div class="top-bar">
      <h1>Расходы на ИИ по клиентам</h1>
      <div class="top-actions">
        <button
          class="btn-export"
          :disabled="filteredClients.length === 0"
          @click="exportXlsx"
        >
          ↓ Excel
        </button>
        <button class="btn-load" :disabled="loading" @click="load">
          <span v-if="loading" class="spinner" />
          {{ loading ? 'Загрузка...' : '↻ Обновить' }}
        </button>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-if="error" class="error-bar">⚠ {{ error }}</div>

    <input
      v-model="searchQuery"
      class="search"
      placeholder="Поиск клиента или статуса"
    />

    <section class="layout" :class="{ 'show-detail': selectedName !== null }">
      <ClientsTable
        :clients="filteredClients"
        :selected-name="selectedName"
        @select="selectedName = $event"
      />
      <div class="detail-col">
        <button class="btn-back" @click="selectedName = null">← К списку</button>
        <ClientDetail :client="selectedClient" />
      </div>
    </section>
  </main>
</template>

<!-- Глобальные стили — переопределяем vite-шаблон -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');

:root {
  --bg: #f6f7fb;
  --card: #fff;
  --text: #111827;
  --mut: #667085;
  --line: #e5e7eb;
  --blue: #2563eb;
  --blueBg: #eff6ff;
  --r: 16px;
  --s: 0 8px 24px #0f172a10;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

/* Сбрасываем дефолтный стиль #app из vite-шаблона */
#app {
  all: unset;
  display: block;
}
</style>

<style scoped>
main {
  max-width: 1920px;
  margin: auto;
  padding: 28px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.top-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: -0.03em;
}

.btn-load {
  height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  background: var(--blue);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.btn-load:hover:not(:disabled) {
  opacity: 0.88;
}

.btn-load:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-export {
  height: 40px;
  padding: 0 18px;
  border-radius: 10px;
  background: white;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  border: 1px solid var(--line);
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, color 0.15s;
}

.btn-export:hover:not(:disabled) {
  border-color: var(--blue);
  color: var(--blue);
}

.btn-export:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-bar {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
  font-size: 13px;
  color: #dc2626;
}

.search {
  height: 40px;
  width: 360px;
  max-width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: white;
  color: var(--text);
  padding: 0 12px;
  font-weight: 700;
  font-size: 14px;
  font-family: inherit;
  margin-bottom: 16px;
  outline: none;
  transition: border-color 0.15s;
}

.search:focus {
  border-color: var(--blue);
}

.layout {
  display: grid;
  grid-template-columns: 520px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.detail-col {
  display: contents;
}

.btn-back {
  display: none;
}

@media (max-width: 980px) {
  main {
    padding: 18px;
  }

  .top-bar {
    flex-wrap: wrap;
  }

  h1 {
    font-size: 22px;
  }

  .layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  main {
    padding: 12px;
  }

  h1 {
    font-size: 18px;
  }

  .search {
    width: 100%;
  }

  /* master-detail: show only one panel at a time */
  .layout {
    display: block;
  }

  .detail-col {
    display: none;
  }

  .layout.show-detail > :first-child {
    display: none;
  }

  .layout.show-detail .detail-col {
    display: block;
  }

  /* back button */
  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
    height: 36px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: white;
    color: var(--text);
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
  }
}
</style>
