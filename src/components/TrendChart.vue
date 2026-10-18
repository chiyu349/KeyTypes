<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    values: number[]
    title: string
    unit: string
    color?: string
    precision?: number
  }>(),
  {
    color: 'var(--accent)',
    precision: 0,
  },
)

const WIDTH = 320
const HEIGHT = 118
const PAD_X = 12
const PAD_Y = 16

const chart = computed(() => {
  const values = props.values
  if (!values.length) return null

  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const spread = maxValue - minValue
  const padding = spread > 0 ? spread * 0.18 : Math.max(1, maxValue * 0.12)
  const lower = Math.max(0, minValue - padding)
  const upper = Math.max(lower + 1, maxValue + padding)
  const span = upper - lower
  const step = values.length > 1 ? (WIDTH - PAD_X * 2) / (values.length - 1) : 0

  const points = values.map((value, index) => ({
    x: values.length > 1 ? PAD_X + step * index : WIDTH / 2,
    y: HEIGHT - PAD_Y - ((value - lower) / span) * (HEIGHT - PAD_Y * 2),
    value,
  }))

  const line = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ')
  const area = `${PAD_X},${HEIGHT - PAD_Y} ${line} ${WIDTH - PAD_X},${HEIGHT - PAD_Y}`

  return {
    points,
    line,
    area,
    min: minValue,
    max: maxValue,
    last: values[values.length - 1] as number,
  }
})
</script>

<template>
  <section class="chart-card">
    <header class="chart-head">
      <div>
        <span class="card-title">{{ title }}</span>
        <span class="faint small chart-count">近 {{ values.length }} 次</span>
      </div>
      <div class="chart-last">
        <strong>{{ chart ? chart.last.toFixed(precision) : '—' }}</strong>
        <small>{{ unit }}</small>
      </div>
    </header>

    <div v-if="chart" class="chart-body">
      <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" class="chart-svg" role="img" :aria-label="`${title}趋势`">
        <line
          v-for="ratio in [0.25, 0.5, 0.75]"
          :key="ratio"
          :x1="PAD_X"
          :x2="WIDTH - PAD_X"
          :y1="HEIGHT * ratio + PAD_Y / 2"
          :y2="HEIGHT * ratio + PAD_Y / 2"
          class="chart-grid"
        />
        <polygon :points="chart.area" :fill="color" opacity="0.08" />
        <polyline
          :points="chart.line"
          fill="none"
          :stroke="color"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          v-for="(point, index) in chart.points"
          :key="index"
          :cx="point.x"
          :cy="point.y"
          :r="index === chart.points.length - 1 ? 3.4 : 2"
          :fill="index === chart.points.length - 1 ? color : 'var(--panel)'"
          :stroke="color"
          stroke-width="1.4"
        />
      </svg>
      <div class="chart-scale faint">
        <span>{{ chart.max.toFixed(precision) }}</span>
        <span>{{ chart.min.toFixed(precision) }}</span>
      </div>
    </div>
    <p v-else class="faint small chart-empty">完成至少一次练习后显示趋势。</p>
  </section>
</template>

<style scoped>
.chart-card {
  padding: 16px 18px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--panel);
}

.chart-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.chart-head > div {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.chart-count {
  font-size: 11px;
}

.chart-last {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.chart-last strong {
  font-family: var(--font-mono);
  font-size: 21px;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.chart-last small {
  font-size: 10.5px;
  color: var(--text-faint);
}

.chart-body {
  position: relative;
  margin-top: 6px;
}

.chart-svg {
  display: block;
  width: 100%;
  height: auto;
}

.chart-grid {
  stroke: var(--line);
  stroke-width: 1;
  stroke-dasharray: 2 5;
}

.chart-scale {
  position: absolute;
  inset: 4px auto 10px 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 9.5px;
  font-family: var(--font-mono);
  pointer-events: none;
}

.chart-empty {
  padding: 26px 0 18px;
  text-align: center;
}
</style>
