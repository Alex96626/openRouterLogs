<script setup lang="ts">
import type { Client } from '../types'

defineProps<{
  clients: Client[]
  selectedName: string | null
}>()

const emit = defineEmits<{
  select: [name: string]
}>()

function fmt(n: number): string {
  return `$${n.toFixed(6)}`
}

function total(client: Client): number {
  return client.events.reduce((s, e) => s + e.cost, 0)
}
</script>

<template>
  <div class="card">
    <div class="head">
      <div class="title">Клиенты</div>
      <div class="hint">Выбор клиента сразу обновляет карточку справа.</div>
    </div>
    <div class="list-wrap">
      <div class="list">
        <div class="row header">
          <div class="cell">Клиент</div>
          <div class="cell">Статус</div>
          <div class="cell center">Операций</div>
          <div class="cell right">Расход</div>
        </div>

        <div
          v-for="client in clients"
          :key="client.name"
          class="row"
          :class="{ active: client.name === selectedName }"
          @click="emit('select', client.name)"
        >
          <div class="cell">
            <div class="name">{{ client.name }}</div>
            <div v-if="client.case" class="sub">{{ client.case }}</div>
          </div>
          <div class="cell"><span class="badge">{{ client.status }}</span></div>
          <div class="cell center">{{ client.events.length }}</div>
          <div class="cell right money">{{ fmt(total(client)) }}</div>
        </div>

        <div v-if="!clients.length" class="empty">Клиенты не найдены</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r);
  box-shadow: var(--s);
  overflow: hidden;
}

.head {
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
}

.title {
  font-size: 18px;
  font-weight: 900;
}

.hint {
  color: var(--mut);
  font-size: 13px;
  margin-top: 4px;
}

.list-wrap {
  max-height: calc(100vh - 190px);
  overflow: auto;
}

.list {
  display: grid;
  grid-template-columns: 1fr 130px 90px 140px;
  font-size: 14px;
}

.row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  cursor: pointer;
  transition: background 0.1s;
}

.row:hover,
.row.active {
  background: #f9fafb;
}

.header {
  position: sticky;
  top: 0;
  z-index: 1;
  cursor: default;
  background: #f9fafb;
}

.header .cell {
  color: var(--mut);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.cell {
  padding: 13px 14px;
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.center {
  align-items: center;
}

.right {
  align-items: flex-end;
}

.name {
  font-weight: 900;
}

.sub {
  font-size: 12px;
  color: var(--mut);
  margin-top: 3px;
}

.badge {
  display: inline-block;
  border-radius: 999px;
  background: #eef2ff;
  color: #1e40af;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.money {
  font-weight: 900;
  white-space: nowrap;
}

.empty {
  grid-column: 1 / -1;
  padding: 24px;
  color: var(--mut);
  text-align: center;
}

@media (max-width: 980px) {
  .list-wrap {
    max-height: none;
  }
}

@media (max-width: 720px) {
  .list {
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 10px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
    cursor: pointer;
  }

  .row.header {
    display: none;
  }

  .row.active,
  .row:hover {
    background: #f9fafb;
  }

  /* name + guid: grow to fill */
  .cell:nth-child(1) {
    flex: 1;
    min-width: 0;
    padding: 0;
    border-bottom: none;
  }

  /* status badge */
  .cell:nth-child(2) {
    order: 3;
    padding: 0;
    border-bottom: none;
  }

  /* ops count: hide */
  .cell:nth-child(3) {
    display: none;
  }

  /* cost */
  .cell:nth-child(4) {
    padding: 0;
    border-bottom: none;
    align-items: flex-end;
  }
}
</style>
