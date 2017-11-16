<template>
  <q-card class="chart" style="width: 100%">
    <q-card-title>
      {{region}} population: {{population}}
    </q-card-title>
    <q-card-separator />
    <q-card-main>
      <div class="error-message" v-if="showError">
       {{ errorMessage }}
      </div>
      <bar-chart chart-id="population-chart" v-if="loaded"
        :chart-data="populationData"
        :chart-labels="regions"
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

  data () {
    return {
      region: 'USA',
      population: 0,
      height: 240,
      loaded: false,
      regions: [],
      showError: false,
      errorMessage: 'Error loading population data'
    }
  },

  created () {
    this.dataHandler = state => {
      this.region = state.region
      this.population = state.totalPopulation
      this.populationData = state.populationData
      this.regions = state.regions
      console.log('chart data', state)
    }
    this.$q.events.$on('census:population', this.dataHandler)
    console.log('chart created')
  },

  mounted () {
    // TODO: remove this after global get pop data hookup is fully wired
    this.getPopulationData()
    console.log('chart mounted')
  },

  beforeDestroy () {
    this.$q.events.$off('census:population', this.dataHandler)
  },

  methods: {
    resetState () {
      this.loaded = false
      this.showError = false
    },
    // TODO: remove this after global get pop data hookup is fully wired
    getPopulationData () {
      this.resetState()
      axios.get(`http://censusd3.herokuapp.com/census/population/state:*`)
        .then(response => {
          console.log('getPopulationData:', response.data)
          // strip out header row
          let popData = response.data.slice(1)
          this.populationData = popData.map(regionData => regionData[0]) // pop count
          this.regions = popData.map(
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
