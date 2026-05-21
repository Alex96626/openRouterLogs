<script setup lang="ts">
import type { Client } from '../types'

defineProps<{
  client: Client | null
}>()

function fmt(n: number): string {
  return `$${n.toFixed(6)}`
}

function total(client: Client): number {
  return client.events.reduce((s, e) => s + e.cost, 0)
}
</script>

<template>
  <aside class="card detail">
    <template v-if="client">
      <div class="summary">
        <div>
          <div class="name">{{ client.name }}</div>
          <div v-if="client.case" class="sub">{{ client.case }}</div>
          <div class="meta">
            <span class="pill">{{ client.status }}</span>
            <span class="pill">{{ client.events.length }} ИИ-операций</span>
          </div>
        </div>
        <div class="total">{{ fmt(total(client)) }}</div>
      </div>

      <div class="events-wrap">
        <div class="list">
          <div class="row header">
            <div class="cell">Дата / время</div>
            <div class="cell">ИИ-операция</div>
            <div class="cell">Сервис</div>
            <div class="cell right">Стоимость</div>
          </div>

          <div v-for="(event, i) in client.events" :key="i" class="row">
            <div class="cell date">{{ event.date }}</div>
            <div class="cell op">{{ event.operation }}</div>
            <div class="cell">{{ event.service }}</div>
            <div class="cell right money">{{ fmt(event.cost) }}</div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="empty">Выберите клиента</div>
  </aside>
</template>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--r);
  box-shadow: var(--s);
  overflow: hidden;
}

.detail {
  position: sticky;
  top: 28px;
  max-height: calc(100vh - 56px);
  display: flex;
  flex-direction: column;
}

.summary {
  padding: 18px;
  background: var(--blueBg);
  border-bottom: 1px solid #bfdbfe;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: start;
  flex-shrink: 0;
}

.name {
  font-size: 20px;
  font-weight: 900;
}

.sub {
  font-size: 12px;
  color: var(--mut);
  margin-top: 3px;
}

.total {
  font-size: 26px;
  font-weight: 900;
  color: var(--blue);
  white-space: nowrap;
}

.meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.pill {
  border-radius: 999px;
  background: white;
  border: 1px solid #bfdbfe;
  color: #1e40af;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 900;
}

.events-wrap {
  overflow: auto;
  flex: 1;
}

.list {
  display: grid;
  grid-template-columns: 180px 1fr 100px 140px;
  font-size: 14px;
}

.row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}

.header {
  position: sticky;
  top: 0;
  z-index: 1;
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
  align-items: center;
}

.right {
  justify-content: flex-end;
}

.date {
  color: var(--mut);
  font-size: 13px;
}

.op {
  font-weight: 700;
}

.money {
  font-weight: 900;
  white-space: nowrap;
}

.empty {
  padding: 22px;
  color: var(--mut);
  text-align: center;
}

@media (max-width: 980px) {
  .detail {
    position: static;
    max-height: none;
  }

  .summary {
    grid-template-columns: 1fr auto;
  }

  .total {
    font-size: 20px;
  }
}

@media (max-width: 720px) {
  .detail {
    position: static;
    max-height: none;
  }

  .summary {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .total {
    font-size: 22px;
  }

  /* event rows: card style */
  .list {
    display: flex;
    flex-direction: column;
  }

  .row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--line);
  }

  .row.header {
    display: none;
  }

  .cell {
    padding: 0;
    border-bottom: none;
  }

  /* operation: top, bold */
  .cell.op {
    font-size: 14px;
    order: 1;
  }

  /* date + service: small muted row */
  .cell.date {
    order: 2;
    font-size: 12px;
  }

  /* service: inline after date */
  .cell:nth-child(3) {
    order: 2;
    font-size: 12px;
    flex-direction: row;
  }

  /* cost: right-aligned below */
  .cell.money {
    order: 3;
    justify-content: flex-start;
    font-size: 15px;
  }
}
</style>
