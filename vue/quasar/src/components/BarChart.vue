<script>
import {Bar, mixins} from 'vue-chartjs'

export default {
  extends: Bar,
  mixins: [mixins.reactiveProp],
  props: {
    chartData: {
      type: Array | Object,
      required: true
    },
    chartLabels: {
      type: Array,
      required: false
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
            barThickness: 16
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
    this.redraw()
  },

  methods: {
    redraw () {
      this.renderChart({
        labels: this.chartLabels,
        datasets: [{
          label: 'population',
          borderColor: '#249EBF',
          pointBackgroundColor: 'orange',
          borderWidth: 1,
          pointBorderColor: '#249EBF',
          backgroundColor: '#96e5ff',
          data: this.chartData
        }]
      }, this.options)
    }
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