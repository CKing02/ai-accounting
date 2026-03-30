<template>
  <div class="chart-card">
    <h3>{{ title }}</h3>
    <div class="chart-container">
      <v-chart :option="option" autoresize />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, PieChart, TitleComponent, TooltipComponent, LegendComponent])

const props = defineProps({
  title: {
    type: String,
    default: '支出构成'
  },
  data: {
    type: Object,
    default: () => ({})
  }
})

const option = computed(() => {
  const pieData = Object.entries(props.data).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }))

  // 颜色配置
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BDC3C7', '#E74C3C',
    '#3498DB', '#2ECC71', '#9B59B6', '#F39C12', '#1ABC9C'
  ]

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#eee',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: {
        color: '#666'
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 12
    },
    series: [
      {
        type: 'pie',
        radius: ['45%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'outside',
          formatter: '{b}: {d}%',
          color: '#666'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            formatter: '{b}\n{d}%'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false,
          length: 15,
          length2: 10
        },
        data: pieData,
        color: colors
      }
    ]
  }
})
</script>

<style scoped>
.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.chart-card h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 16px;
  font-weight: 600;
}

.chart-container {
  height: 300px;
}
</style>
