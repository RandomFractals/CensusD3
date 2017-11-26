<style>
.chart {
  background: #fefefe;
  border-radius: 2px;
  box-shadow: 0px 2px 15px rgba(25, 25, 25, 0.27);
  margin:  0px;
}
</style>

<script>
import {Bar, mixins} from 'vue-chartjs'
const {reactiveProp} = mixins

export default {
  extends: Bar,
  mixins: [reactiveProp],
  name: 'bar-chart',

  data () {
    return {
      // bar chart config
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
    this.renderChart(this.chartData, this.options)
  },

  methods: {
    update () {
      this.$data._chart.update()
    }
  }
}
</script>