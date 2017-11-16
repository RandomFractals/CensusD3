<script>
import {Bar} from 'vue-chartjs'

export default {
  extends: Bar,
  props: {
    chartData: {
      type: Array | Object,
      required: false
    },
    chartLabels: {
      type: Array,
      required: true
    }
  },
  data () {
    return {
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            },
            gridLines: {
              display: true
            }
          }],
          xAxes: [ {
            gridLines: {
              display: false
            },
            barThickness: 5
          }]
        },
        legend: {
          display: false
        },
        responsive: true,
        maintainAspectRatio: false
      }
    }
  },
  mounted () {
    this.renderChart({
      labels: this.chartLabels,
      datasets: [{
        label: 'population',
        borderColor: '#249EBF',
        pointBackgroundColor: 'white',
        borderWidth: 1,
        pointBorderColor: '#249EBF',
        backgroundColor: 'transparent',
        data: this.chartData
      }]
    }, this.options)
  }
}
</script>

<style>
.chart {
  background: #fefefe;
  border-radius: 2px;
  box-shadow: 0px 2px 15px rgba(25, 25, 25, 0.27);
  margin:  0px;
}
</style>