<style>
.chart {
  background: #fefefe;
  border-radius: 2px;
  box-shadow: 0px 2px 15px rgba(25, 25, 25, 0.27);
  margin:  0px;
}
</style>

<script>
import numeral from 'numeral'
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
              beginAtZero: true,
              callback: function (label, index, labels) {
                return numeral(label).format('0,0')
              }
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
      if (this.$data !== undefined && this.$data._chart !== undefined) {
        // call chartjs directly to render new data update
        // see doc: http://vue-chartjs.org/#/home?id=chart-js-object
        this.$data._chart.update()
      }
    }
  }
}
</script>