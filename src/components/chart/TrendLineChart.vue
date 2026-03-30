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
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent, LegendComponent])

const props = defineProps({
  title: {
    type: String,
    default: '收支趋势'
  },
  incomeData: {
    type: Array,
    default: () => []
  },
  expenseData: {
    type: Array,
    default: () => []
  },
  labels: {
    type: Array,
    default: () => []
  }
})

const option = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    },
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderColor: '#eee',
    borderWidth: 1,
    textStyle: {
      color: '#333'
    },
    formatter: function(params) {
      let result = params[0].axisValue + '<br/>'
      params.forEach(param => {
        const color = param.seriesName === '收入' ? '#38ef7d' : '#eb3349'
        result += `<span style="display:inline-block;margin-right:5px;border-radius:50%;width:10px;height:10px;background-color:${color};"></span>`
        result += `${param.seriesName}: ¥${param.value.toFixed(2)}<br/>`
      })
      return result
    }
  },
  legend: {
    data: ['收入', '支出'],
    textStyle: {
      color: '#666'
    },
    top: 0,
    right: 10
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '15%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.labels,
    axisLine: {
      lineStyle: {
        color: '#ddd'
      }
    },
    axisLabel: {
      color: '#666',
      fontSize: 11
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '¥{value}',
      color: '#666'
    },
    splitLine: {
      lineStyle: {
        color: '#f0f0f0'
      }
    }
  },
  series: [
    {
      name: '收入',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      emphasis: {
        focus: 'series',
        itemStyle: {
          borderWidth: 2
        }
      },
      lineStyle: {
        width: 3,
        color: '#38ef7d'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(56, 239, 125, 0.3)' },
            { offset: 1, color: 'rgba(56, 239, 125, 0.05)' }
          ]
        }
      },
      itemStyle: {
        color: '#38ef7d',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: props.incomeData
    },
    {
      name: '支出',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: false,
      emphasis: {
        focus: 'series',
        itemStyle: {
          borderWidth: 2
        }
      },
      lineStyle: {
        width: 3,
        color: '#eb3349'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(235, 51, 73, 0.3)' },
            { offset: 1, color: 'rgba(235, 51, 73, 0.05)' }
          ]
        }
      },
      itemStyle: {
        color: '#eb3349',
        borderColor: '#fff',
        borderWidth: 2
      },
      data: props.expenseData
    }
  ]
}))
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
