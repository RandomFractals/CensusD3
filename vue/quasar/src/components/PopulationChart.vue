<template>
  <q-card class="chart" style="width: 100%">
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.regionName}}</span>
      <q-icon name="people" />              
      <span class="card-subtitle">
        <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
      </span>      
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
      viewType: 'country',
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
      return this.$census.getRegionImageUrl(this.selectedRegion.regionId)
    }
  },

  /**
   * Adds chart data and view event handlers.
   */
  created () {
    this.onPopulationUpdate = eventData => {
      if (this.populationData.length === 0) {
        // update selected region total population sum
        this.selectedRegion.population = eventData.totalPopulation

        // update population chart data collections
        this.populationData = eventData.populationData
        this.chartData = this.populationData.map(regionData => regionData.population)
        this.chartLabels = this.populationData.map(regionData => regionData.regionName)

        // this.redraw()
        console.log('chart data updated')
      }
    }
    this.$q.events.$on(this.$census.events.POPULATION, this.onPopulationUpdate)

    // add region selection change event handler
    this.onRegionSelectionChange = regionData => {
      if (this.viewType === regionData.regionType) {
        this.selectedRegion = regionData
        console.log('chart:selectedRegion:', regionData.regionName)
      }
    }
    this.$q.events.$on(this.$census.events.REGION, this.onRegionSelectionChange)

    console.log('chart created')
  },

  /**
   * Removes chart data and view update handlers.
   */
  beforeDestroy () {
    this.$q.events.$off(this.$census.events.POPULATION, this.onPopulationUpdate)
    this.$q.events.$off(this.$census.events.REGION, this.onRegionSelectionChange)
  },

  mounted () {
    // TODO: remove this after global get pop data hookup is fully wired
    this.getPopulationData()
    console.log('chart mounted')
  },

  methods: {

    resetState () {
      this.loaded = false
      this.showError = false
    },

    // TODO: remove this after global get pop data hookup is fully wired
    getPopulationData () {
      this.resetState()
      axios.get(`https://censusd3.herokuapp.com/census/population/state:*`)
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
