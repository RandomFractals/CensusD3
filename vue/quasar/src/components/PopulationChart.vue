<template>
  <q-card class="chart" style="width: 100%">
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.regionName}} population:</span>
      <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
    </q-card-title>
    <q-card-separator />
    <q-card-main>
      <div class="error-message" v-if="showError">
       {{ errorMessage }}
      </div>
      <bar-chart ref="chart" chart-id="population-chart" v-if="loaded"
        :chart-data="chartData"
        :chart-labels="chartLabels"
        :height="chartHeight" />
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
      selectedRegion: {},
      populationData: [],
      chartData: [],
      chartLabels: [],
      loaded: false,
      chartHeight: 240,
      showError: false,
      errorMessage: 'Error loading population data'
    }
  },

  computed: {
    regionIconSrc: function () {
      return `http://censusd3.herokuapp.com/images/flags/${this.selectedRegion.regionName}.png`
    }
  },

  created () {
    this.dataHandler = state => {
      this.selectedRegion = state.selectedRegion
      this.populationData = state.populationData
      this.chartData = state.populationData.map(regionData => regionData.population)
      this.chartLabels = state.populationData.map(regionData => regionData.regionName)
      this.regions = state.regions
      // this.redraw()
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
          // console.log('getPopulationData:', response.data)
          // strip out header row
          let popData = response.data.slice(1, 51)
          this.chartData = popData.map(regionData => regionData[0]) // pop count
          this.chartLabels = popData.map(
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
