<template>
  <q-card class="map-card">
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.regionName}}</span>
      <span class="card-subtitle">
        <span class="text-faded">population:</span>
        <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
        <span class="text-faded"> | density:</span>
        <span class="text-bold">{{selectedRegion.density | formatDecimal}}</span>
        <span class="text-faded">p/mi²</span>
      </span>
    </q-card-title>
    <q-card-separator />
    <q-card-main class="map-container">
      <v-map ref="map" style="height: 100%" :zoom="zoom" :center="center">
        <v-tilelayer :url="tilesUrl" :attribution="attribution"></v-tilelayer>
        <v-geojson-layer v-if="showTopology" 
          :geojson="topology" :options="topologyOptions"></v-geojson-layer>
      </v-map>
    </q-card-main>
  </q-card>  
</template>

<style>
.map-container {
  height: 327px;
  padding: 1px;
}
</style>

<script>
import axios from 'axios'
import Vue2Leaflet from 'vue2-leaflet'
import {Events} from 'quasar'

/**
 * Map layer mouse out event handler.
 */
function onLayerMouseOver ({ target }) {
  target.setStyle({
    weight: 3,
    color: '#666',
    dashArray: ''
  })
  /*
  if (!L.Browser.ie && !L.Browser.opera) {
    target.bringToFront()
  }
  */
  // let region = target.feature.properties
}

/**
 * Map layer mouse out event handler.
 */
function onLayerMouseOut ({ target }) {
  target.setStyle({
    weight: 2,
    color: '#FFF',
    dashArray: ''
  })
}

/**
 * Map layer mouse click event handler.
 */
function onLayerClick ({target}) {
  console.log('map click:', target.feature.properties.name) // region name from geo json
  // notify app components about region selection change
  Events.$emit('census:region', this.mapData.find(
    x => x.regionId === target.feature.id)) // region id from geo json

  // zoom to region
  this.$refs.map.mapObject.fitBounds(target.getBounds())
}

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
      mapLayers: {},
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
        },
        onEachFeature: (feature, layer) => {
          // save region map layer for zoom to later
          this.mapLayers[feature.id] = layer
          // add mouse events
          layer.on({
            mouseover: onLayerMouseOver.bind(this),
            mouseout: onLayerMouseOut.bind(this),
            click: onLayerClick.bind(this)
          })
        }
      }
    }
  },

  computed: {
    regionIconSrc: function () {
      return this.$census.getRegionImageUrl(this.selectedRegion.regionId)
    }
  },

  /**
   * Adds map data and view update handlers.
   */
  created () {
    // add population data update event handler
    this.onPopulationUpdate = eventData => {
      this.selectedRegion = eventData.selectedRegion
      this.mapData = eventData.populationData
      console.log('map data updated') // , eventData)
    }
    this.$q.events.$on('census:population', this.onPopulationUpdate)

    // add region selection change event handler
    this.onRegionSelectionChange = regionData => {
      this.selectedRegion = regionData
      // zoom to selected region
      this.$refs.map.mapObject.fitBounds(
        this.mapLayers[this.selectedRegion.regionId]._bounds)
      console.log('map:selectedRegion:', regionData.regionName)
    }
    this.$q.events.$on('census:region', this.onRegionSelectionChange)
    console.log('map created')

    // get USA states geo json for the states choropleth map topology display
    this.getStatesGeoData()
  },

  mounted () {
    console.log('map mounted')
  },

  /**
   * Removes map data and view update handlers.
   */
  beforeDestroy () {
    this.$q.events.$off('census:population', this.onPopulationUpdate)
    this.$q.events.$off('census:region', this.onRegionSelectionChange)
  },

  methods: {

    /**
     * Gets initial USA states topology for the states choropleth display.
     */
    getStatesGeoData () {
      console.log('map:getStatesGeoData...')
      axios.get(`${this.$census.serviceHost}/data/us-states-geo.json`)
        .then(response => {
          // console.log('map geo json', response.data)
          this.topology = response.data
          console.log('map:getStatesGeoData:regions:', this.topology.features.length)
        })
        .catch(err => {
          this.showTopology = false
          console.log('map:getStatesGeoData:error', err.response.data.error)
        })
    }
  }
}
</script>

<style>
@import "../../node_modules/leaflet/dist/leaflet.css";
</style>
