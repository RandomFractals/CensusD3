<template>
  <q-card class="chart" style="width: 100%">
    <q-card-title>
      {{title}}
    </q-card-title>
    <q-card-separator />
    <q-card-main>
      <div class="error-message" v-if="showError">
       {{ errorMessage }}
      </div>
      <bar-chart chart-id="population-chart" v-if="loaded"
        :chart-data="populationData"
        :chart-labels="labels"
        :height="height" />
    </q-card-main>
  </q-card>
</template>

<script>
import axios from 'axios'
import BarChart from './BarChart.vue'

export default {
  name: 'population-chart',
  components: {
    BarChart
  },

  props: {
    populationData: {
      type: Array | Object,
      required: true
    }
  },

  data () {
    return {
      title: 'USA population',
      height: 240,
      loaded: false,
      labels: [],
      showError: false,
      errorMessage: 'Error loading population data'
    }
  },

  mounted () {
    this.getPopulationData()
  },

  methods: {
    resetState () {
      this.loaded = false
      this.showError = false
    },
    getPopulationData () {
      this.resetState()
      axios.get(`http://censusd3.herokuapp.com/census/population/state:*`)
        .then(response => {
          console.log('getPopulationData:', response.data)
          // strip out header row
          let popData = response.data.slice(1)
          this.populationData = popData.map(regionData => regionData[0]) // pop count
          this.labels = popData.map(
            regionData => regionData[1].substr(0, regionData[1].indexOf(','))) // region name without state
          this.loaded = true
        })
        .catch(err => {
          this.errorMessage = err.response.data.error
          this.showError = true
        })
    }
  }
}
</script>

<style>
</style>
