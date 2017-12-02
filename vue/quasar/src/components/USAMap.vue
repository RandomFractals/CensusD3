<template>
  <q-card class="map-card">
    <q-card-title>
      <img :src="regionIconSrc" class="flag" height="24" />
      <span class="card-title">{{selectedRegion.regionName}}</span>
      <q-icon name="people" />
      <span class="card-subtitle">
        <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
      </span>
      <q-btn small flat slot="right" class="map-button" @click="zoomOut()">
        <q-icon name="zoom out map" />
      </q-btn>
    </q-card-title>
    <q-progress ref="progressBar" :percentage="mapProgress" 
      color="red" style="height: 2px" />
    <q-card-main class="map-container">
      <region-tooltip id="regionTooltip" ref="regionTooltip" />
      <legend-box id="mapLegend" ref="mapLegend" />      
      <v-map ref="map" style="height: 100%" :zoom="zoom" :center="mapCenter">
        <v-tilelayer :url="tilesUrl" :attribution="attribution"></v-tilelayer>
        <v-geojson-layer v-if="showTopology"
          :geojson="statesTopology" :options="topologyOptions"></v-geojson-layer>
      </v-map>
    </q-card-main>
  </q-card>  
</template>

<style>
.map-container {
  height: 327px;
  padding: 0px;
}
.map-button {
  color: #666;
  padding: 3px;
}
</style>

<script>
import {QBtn, QProgress, Events} from 'quasar'
import Vue2Leaflet from 'vue2-leaflet' // leaflet vue wrapper
import axios from 'axios' // for geo and topo json data load
import * as L from 'leaflet' // direct leaflet.js import for topo json load extension
import * as topojson from 'topojson-client' // for topo json leaflet extension
import RegionTooltip from './RegionTooltip.vue'
import LegendBox from './LegendBox.vue'

/**
 * ---------------------- Leaflet Methods -------------------------------------
 **/

/**
 * Makes Leaflet Geo JSON API Topo JSON aware.
 */
function addLeafletTopoJSONSupport () {
  L.TopoJSON = L.GeoJSON.extend({
    addData: function (jsonData) {
      if (jsonData.type === 'Topology') {
        for (let key in jsonData.objects) {
          let geojson = topojson.feature(jsonData, jsonData.objects[key])
          L.GeoJSON.prototype.addData.call(this, geojson)
        }
      }
      else {
        L.GeoJSON.prototype.addData.call(this, jsonData)
      }
    }
  })
}

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
  // get hover region info
  const hoverRegion = this.mapData.find(
    x => x.regionId === target.feature.id) // region id from geo json

  // show region tooltip
  const tooltipPosition = [70, 70]
  this.$refs.regionTooltip.show(hoverRegion, tooltipPosition)
}

/**
 * Map layer mouse out event handler.
 */
function onLayerMouseOut ({ target }) {
  if (target !== this.selectedLayer) {
    target.setStyle(this.layerStyle)
  }
  this.$refs.regionTooltip.hide()
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
    QBtn,
    QProgress,
    RegionTooltip,
    LegendBox,
    'v-map': Vue2Leaflet.Map,
    'v-geojson-layer': Vue2Leaflet.GeoJSON,
    'v-tilelayer': Vue2Leaflet.TileLayer
  },

  data () {
    return {
      mapCenter: [37.8, -96],
      zoom: 4,
      tilesUrl: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      selectedRegion: {},
      mapProgress: 10,
      mapData: [],
      mapLayers: {},
      selectedLayer: null,
      statesTopology: null,
      usaTopology: null,
      usaTopologyLayer: null,
      showTopology: true,
      colorBy: 'density',
      layerStyle: {
        weight: 2,
        color: '#ECEFF1',
        opacity: 0.5,
        dashArray: 0,
        fillOpacity: 0.9
      },
      hoverLayerStyle: {
        weight: 3,
        color: 'black',
        dashArray: '0'
      },
      selectedLayerStyle: {
        weight: 3,
        color: 'black',
        opacity: 0.6,
        dashArray: 0,
        fillOpacity: 1.0
      },
      topologyOptions: {
        style: function () {
          return {
            weight: 2,
            color: '#ECEFF1',
            opacity: 0.5,
            dashArray: 0,
            fillColor: '#eee',
            fillOpacity: 0.9
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
    // enable topo JSON map load for state counties display
    addLeafletTopoJSONSupport()

    // add region selection change event handler
    this.onRegionSelectionChange = regionData => {
      this.selectedRegion = regionData
      this.zoomToSelectedRegion()
      console.log('map:selectedRegion:', regionData.regionName)
    }
    this.$q.events.$on(this.$census.events.REGION, this.onRegionSelectionChange)

    // add population data update event handler
    this.onPopulationUpdate = eventData => {
      // update selected region total population sum
      this.selectedRegion.population = eventData.totalPopulation

      // TODO: change this when state counties topojson data load is wired
      // and selected state counties display is added to the map
      if (this.mapData.length === 0) {
        // update map data
        this.mapData = eventData.populationData

        // update map layers fill color for proper states choropleth display
        this.mapData.map(region => {
          let regionLayer = this.mapLayers[region.regionId]
          if (regionLayer !== undefined) {
            regionLayer.setStyle({
              fillColor: // by density for now
                this.$refs.mapLegend.getColor(region.density)
            })
          }
        })
      }

      console.log('map data updated') // , eventData)
    }
    this.$q.events.$on(this.$census.events.POPULATION, this.onPopulationUpdate)

    console.log('map created')

    // get USA states geo json for the states choropleth map topology display
    this.getStatesGeoJsonData()
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
    getStatesGeoJsonData () {
      console.log('map:getStatesGeoJsonData...')
      axios.get(`${this.$census.serviceHost}/data/us-states-geo.json`)
        .then(response => {
          // console.log('map geo json', response.data)
          this.statesTopology = response.data
          console.log('map:getStatesGeoJsonData:regions:', this.statesTopology.features.length)

          // update map load progress
          this.mapProgress = 100

          // trigger load of USA states with counties topology for the state counties map zoom
          // this.getUSACountiesTopoJsonData()
        })
        .catch(err => {
          this.showTopology = false
          console.log('map:getStatesGeoJsonData:error', err.response.data.error)
        })
    },

    /**
     * Gets all USA states and counties topology for the state counties choropleth display.
     */
    getUSACountiesTopoJsonData () {
      console.log('map:getUSACountiesTopoJsonData...')
      axios.get(`${this.$census.serviceHost}/data/us.json`)
        .then(response => {
          // console.log('map topo json', response.data)
          const usaTopology = response.data
          // console.log('map:getUSACountiesTopoJsonData:', usaTopology)
          console.log('map:getUSACountiesTopoJsonData:regions: states:',
            usaTopology.objects.states.geometries.length, 'counties:',
            usaTopology.objects.counties.geometries.length)

          // create USA topology layer
          this.usaTopologyLayer = new L.TopoJSON()
          this.usaTopologyLayer.addData(usaTopology)
          this.usaTopologyLayer.addTo(this.$refs.map.mapObject)

          // update map load progress
          this.mapProgress = 100
        })
        .catch(err => {
          // this.showTopology = false
          console.log('map:getUSACountiesTopoJsonData:error', err.response.data.error)
        })
    }

  }
}
</script>

<style>
@import "../../node_modules/leaflet/dist/leaflet.css";
</style>
