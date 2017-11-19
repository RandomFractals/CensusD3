<template>
  <q-card class="map-card">
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.name}} population:</span>
      <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
    </q-card-title>
    <q-card-separator />
    <q-card-main style="height: 80%">
      <v-map style="height: 100%" :zoom="zoom" :center="center">
        <v-tilelayer :url="tilesUrl" :attribution="attribution"></v-tilelayer>
        <v-geojson-layer v-if="showTopology" 
          :geojson="topology" :options="topologyOptions"></v-geojson-layer>
      </v-map>
    </q-card-main>
  </q-card>  
</template>

<script>
import axios from 'axios'
import Vue2Leaflet from 'vue2-leaflet'

export default {
  name: 'usa-map',
  components: {
    'v-map': Vue2Leaflet.Map,
    'v-geojson-layer': Vue2Leaflet.GeoJSON,
    'v-tilelayer': Vue2Leaflet.TileLayer
  },

  data () {
    return {
      center: [37.8, -96],
      zoom: 4,
      tilesUrl: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      selectedRegion: {},
      mapData: [],
      topology: null,
      showTopology: true,
      topologyOptions: {
        style: function () {
          return {
            weight: 2,
            color: '#ECEFF1',
            opacity: 0.5,
            fillColor: '#00bfff',
            fillOpacity: 0.4
          }
        }
      }
    }
  },

  computed: {
    regionIconSrc: function () {
      return `http://censusd3.herokuapp.com/images/flags/${this.selectedRegion.name}.png`
    }
  },

  /**
   * Adds map data and view update handlers.
   */
  created () {
    // create and add population data update event handler
    this.onPopulationUpdate = eventData => {
      this.selectedRegion = eventData.selectedRegion
      this.mapData = eventData.populationData
      console.log('map data updated') // , eventData)
    }
    this.$q.events.$on('census:population', this.onPopulationUpdate)

    // load USA states geojson for choropleth topology display
    axios.get('https://censusd3.herokuapp.com/data/us-states-geo.json')
      .then(response => {
        // console.log('geoJson', response.data)
        this.topology = response.data
        // console.log('loaded map geo json', this.geoJson.features)
      })
      .catch(err => {
        this.showTopology = false
        console.log('geoJson', err.response.data.error)
      })
    console.log('map created')
  },

  mounted () {
    console.log('map mounted')
  },

  /**
   * Removes map data and view update handlers.
   */
  beforeDestroy () {
    this.$q.events.$off('census:population', this.onPopulationUpdate)
  }}
</script>

<style>
@import "../../node_modules/leaflet/dist/leaflet.css";
</style>
