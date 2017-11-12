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
    </q-card-main>
  </q-card>  
</template>

<script>
import axios from 'axios'

export default {
  name: 'population-chart',
  props: {},

  data () {
    return {
      title: 'USA population',
      loaded: false,
      populationData: [],
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
      axios.get(`http://censusd3.herokuapp.com/census/population/state:*`)
        .then(response => {
          console.log('getPopulationData:', response.data)
          this.populationData = response.data
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
