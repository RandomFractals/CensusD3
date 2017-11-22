<template>
  <q-card class="map-card">
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.regionName}}</span>
      <span class="card-subtitle">
        <span class="text-faded">population:</span>
        <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
      </span>
      <q-btn small flat slot="right" class="map-button" icon="zoom_out_map" @click="zoomOut()" />
    </q-card-title>
    <q-card-separator />
    <q-card-main class="map-container">
      <v-map ref="map" style="height: 100%" :zoom="zoom" :center="mapCenter">
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
.map-button {
  color: #666;
  padding: 0px;
}
</style>

<script>
import axios from 'axios'
import Vue2Leaflet from 'vue2-leaflet'
import {QBtn, Events} from 'quasar'

/**
 * Map layer mouse out event handler.
 */
function onLayerMouseOver ({ target }) {
  target.setStyle(this.hoverLayerStyle)
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
  if (target !== this.selectedLayer) {
    target.setStyle(this.layerStyle)
  }
}

/**
 * Map layer mouse click event handler.
 */
function onLayerClick ({target}) {
  console.log('map click:', target.feature.properties.name) // region name from geo json

  // notify app components about region selection change
  Events.$emit(this.$census.events.REGION, this.mapData.find(
    x => x.regionId === target.feature.id)) // region id from geo json

  // get population data for state counties
  this.$census.getPopulation('county', `*&in=state:${target.feature.id}`) // state code from the map

  if (target !== this.selectedLayer) {
    // zoom to region
    this.$refs.map.mapObject.fitBounds(target.getBounds())
  }
}

export default {
  name: 'usa-map',
  components: {
    'v-map': Vue2Leaflet.Map,
    'v-geojson-layer': Vue2Leaflet.GeoJSON,
    'v-tilelayer': Vue2Leaflet.TileLayer,
    QBtn
  },

  data () {
    return {
      mapCenter: [37.8, -96],
      zoom: 4,
      tilesUrl: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      selectedRegion: {},
      mapData: [],
      mapLayers: {},
      selectedLayer: null,
      topology: null,
      showTopology: true,
      colorBy: 'density',
      layerStyle: {
        weight: 2,
        color: '#ECEFF1',
        opacity: 0.5,
        dashArray: 0,
        fillOpacity: 0.4
      },
      hoverLayerStyle: {
        weight: 3,
        color: 'red',
        dashArray: '0'
      },
      selectedLayerStyle: {
        weight: 3,
        color: '#ff002b',
        opacity: 0.6,
        dashArray: 0,
        fillOpacity: 0.6
      },
      topologyOptions: {
        style: function () {
          return {
            weight: 2,
            color: '#ECEFF1',
            opacity: 0.5,
            dashArray: 0,
            fillColor: '#eee',
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
      // update selected region total population sum
      this.selectedRegion.population = eventData.totalPopulation

      // TODO: change this when state counties topojson data load is wired
      // and selected state counties display is added to the map
      if (this.selectedRegion.regionType !== 'county') {
        // update map data
        this.mapData = eventData.populationData
        // update map layers fill color for proper states choropleth display
        this.mapData.map(region => {
          let regionLayer = this.mapLayers[region.regionId]
          regionLayer.setStyle({
            fillColor: this.getLayerFillColor(region.density) // color by density for now
          })
        })
      }

      console.log('map data updated') // , eventData)
    }
    this.$q.events.$on(this.$census.events.POPULATION, this.onPopulationUpdate)

    // add region selection change event handler
    this.onRegionSelectionChange = regionData => {
      this.selectedRegion = regionData
      this.zoomToSelectedRegion()
      console.log('map:selectedRegion:', regionData.regionName)
    }
    this.$q.events.$on(this.$census.events.REGION, this.onRegionSelectionChange)

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
    this.$q.events.$off(this.$census.events.POPULATION, this.onPopulationUpdate)
    this.$q.events.$off(this.$census.events.REGION, this.onRegionSelectionChange)
  },

  methods: {

    /**
     * Zooms the map to the selected region layer
     * and toggles map layer selection styles.
     */
    zoomToSelectedRegion () {
      // zoom to selected region
      if (this.selectedLayer !== null) {
        // reset previously selected map layer style
        this.selectedLayer.setStyle(this.layerStyle)
      }
      this.selectedLayer = this.mapLayers[this.selectedRegion.regionId]
      if (this.selectedLayer !== undefined) {
        // update map layer styles to zoom in
        this.selectedLayer.setStyle(this.selectedLayerStyle)
        this.$refs.map.mapObject.fitBounds(this.selectedLayer.getBounds())
      }
      else {
        // reset selected layer and zoom out to the whole USA map view
        this.selectedLayer = null
        this.zoomOut()
      }
    },

    /**
     * Zooms out to show the whole USA map view.
     */
    zoomOut () {
      this.$refs.map.mapObject.flyTo(this.mapCenter, this.zoom)
    },

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

          // trigger load of USA counties topology for state counties map zoom
          this.getUSACountiesGeoData()
        })
        .catch(err => {
          this.showTopology = false
          console.log('map:getStatesGeoData:error', err.response.data.error)
        })
    },

    /**
     * Gets all USA counties topology for the state counties choropleth display.
     */
    getUSACountiesGeoData () {
      console.log('map:getUSACountiesGeoData...')
      axios.get(`${this.$census.serviceHost}/data/us.json`)
        .then(response => {
          // console.log('map geo json', response.data)
          // this.topology = response.data
          console.log('map:getUSACountiesGeoData:regions:', this.topology.features.length)
        })
        .catch(err => {
          // this.showTopology = false
          console.log('map:getUSACountiesGeoData:error', err.response.data.error)
        })
    },

    /**
     * Gets map layer fill color for the specified region population density.
     */
    getLayerFillColor (d) {
      return d > 1000 ? '#800026'
        : d > 500 ? '#BD0026'
          : d > 200 ? '#E31A1C'
            : d > 100 ? '#FC4E2A'
              : d > 50 ? '#FD8D3C'
                : d > 20 ? '#FEB24C'
                  : d > 10 ? '#FED976' : '#FFEDA0'
    }

  }
}
</script>

<style>
@import "../../node_modules/leaflet/dist/leaflet.css";
</style>
