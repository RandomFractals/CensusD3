<template>
  <q-card class="map-card">
    <q-card-title>
      <img :src="regionIconSrc" class="flag" height="24" />
      <span class="card-title">{{selectedRegion.regionName}}</span>
      <q-icon name="people" />
      <span class="card-subtitle">
        <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
      </span>
    </q-card-title>
    <q-progress ref="progressBar" :percentage="mapProgress" 
      color="red" style="height: 2px" />
    <q-card-main class="map-container">
      <region-tooltip id="regionTooltip" ref="regionTooltip" />
      <!--
      <legend-box id="mapLegend" ref="mapLegend"
        title="density (p/mi²)"
        :color-stops="densityColors" />
      -->
      <v-map ref="map" style="height: 100%" :zoom="zoom" :center="mapCenter">
        <v-tilelayer :url="tilesUrl" :attribution="attribution"></v-tilelayer>
        <v-geojson-layer v-if="showTopology"
          :geojson="statesTopology" :options="topologyOptions"></v-geojson-layer>
      </v-map>
    </q-card-main>
  </q-card>  
</template>

<style>
/* leafletJS css imports */
@import "../../node_modules/leaflet/dist/leaflet.css";
@import "../../node_modules/leaflet-fullscreen/dist/leaflet.fullscreen.css";

/* map content container */
.map-container {
  height: 327px;
  padding: 0px;
}
.map-button {
  color: #666;
  padding: 3px;
}

/* TODO: move these to separate reusable leafletJS control plugin modules */

/* center map button control styles */
.leaflet-control-center-map a {
  background:#fff url(../statics/images/leaflet/zoom-out.png) no-repeat 0 0;
  background-size: 26px 26px;
}
.leaflet-touch .leaflet-control-center-map a {
  background-position: 2px 2px;
}

/* legend box styles */
.legend-box {
  display: block;
  border: 0px;
  padding: 5px;
  z-index: 500;
}
.legend-table {
  background-color: #eee;  
  display: table;
  border-spacing: 0;
  border-collapse: collapse;
  empty-cells: show;
}
.legend-table tr {
  display: table-row;
}
.legend-table th {
  background-color: #fff;
  opacity: 0.6;
  font-size: 10px;
  font-weight: normal;
  text-align: left;
  padding: 2px;
  min-width: 40px;
}
.legend-label {
  color: #5dbbfb;
  font-size: 10px;
}
</style>

<script>
// TODO: find a better way to import this JS, which is not a proper JS module
require('../../node_modules/leaflet-fullscreen/dist/Leaflet.fullscreen.min.js')

// LeafletJS and TopoJson imports
import * as L from 'leaflet' // direct leaflet.js import for topo json load extension
import * as topojson from 'topojson-client' // for topo json leaflet extension
import axios from 'axios' // for geo and topo json data load

// Quasar and custom vue components imports
import {QBtn, QProgress, Events} from 'quasar'
import Vue2Leaflet from 'vue2-leaflet' // leaflet vue wrapper
import RegionTooltip from './RegionTooltip.vue'
import LegendBox from './LegendBox.vue'

/* --------------- Custom LeafletJS Controls and TopoJSON Extensions ------------------------------ */

/**
 * Adds custom center map control to leafletJS
 * for zooming out and centering the map on USA to display all states.
 */
function addCenterMapControl (map, centerPoint, zoomLevel) {
  L.Control.CenterMap = L.Control.extend({
    onAdd: function (map) {
      const container = L.DomUtil.create('div', 'leaflet-control-center-map leaflet-bar leaflet-control')
      this.link = L.DomUtil.create('a', 'leaflet-control-center-map-button leaflet-bar-part', container)
      this.link.href = '#'
      this._map = map
      this._mapCenter = centerPoint
      this._zoomLevel = zoomLevel
      L.DomEvent.on(this.link, 'click', this._click, this)
      return container
    },
    _click: function (e) {
      L.DomEvent.stopPropagation(e)
      L.DomEvent.preventDefault(e)
      // we'll use leafletJS map flyTo for animated zoom out and center map
      this._map.flyTo(this._mapCenter, this._zoomLevel)
    },
    onRemove: function (map) {
      // nothing to do here
    }
  })

  L.control.centerMap = function (opts) {
    return new L.Control.CenterMap(opts, centerPoint, zoomLevel)
  }

  // add center map button control to the top left leaflet map zoom controls box
  L.control.centerMap({position: 'topleft'}).addTo(map)
}

/**
 * Adds custom legends control box to the leaflet map.
 */
function addLegendsControl (map, title, colorStops) {
  const legendsControl = L.control({position: 'bottomleft'})
  legendsControl.onAdd = function (map) {
    // create legends box container
    const div = L.DomUtil.create('div', 'legend-box')

    // add legends box title
    div.innerHTML += `<span class="legend-label">${title}</span>`

    // add legends table for horizontal legends UI display
    const table = L.DomUtil.create('table', 'legend-table', div)
    const row = L.DomUtil.create('tr', 'legend-row', table)
    colorStops.map(colorStop => {
      row.innerHTML += `<th title="${colorStop.value}" style="background: ${colorStop.color}">` +
        `<span class="legend-label">${colorStop.value}</span></th>`
    })
    return div
  }
  legendsControl.addTo(map)
}

/**
 * Gets hex color for the specified number value and configured color palette.
 * Note: colorStops is an array of objects with color and value properties.
 */
function getColor (colorStops, value) {
  let colorIndex = colorStops.length - 1
  while (colorIndex >= 0) { // check in reverse
    let colorStop = colorStops[colorIndex]
    if (value >= colorStop.value) {
      return colorStop.color
    }
    colorIndex--
  }
  return '#fff' // should never really get here
}

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

/* -------------------- LeafletJS Layer Mouse Event Handlers ----------------------- */

/**
 * Map layer mouse out event handler.
 */
function onLayerMouseOver ({ target }) {
  target.setStyle(this.hoverLayerStyle)
  if (target !== this.selectedLayer && !L.Browser.ie && !L.Browser.opera) {
    target.bringToFront()
  }

  // get hover region info
  const hoverRegion = this.mapData.find(
    region => region.regionId === target.feature.id) // region id from geo json

  // show region tooltip
  this.showRegionTooltip(hoverRegion)
}

/**
 * Map layer mouse out event handler.
 */
function onLayerMouseOut ({ target }) {
  if (target !== this.selectedLayer) {
    target.setStyle(this.layerStyle)
  }
  if (this.selectedLayer !== null && !L.Browser.ie && !L.Browser.opera) {
    this.selectedLayer.bringToFront()
  }
  this.hideRegionTooltip()
}

/**
 * Map layer mouse click event handler.
 */
function onLayerClick ({target}) {
  console.log('map click:', target.feature.properties.name) // region name from geo json

  // notify app components about region selection change
  Events.$emit(this.$census.events.REGION, this.mapData.find(
    region => region.regionId === target.feature.id)) // region id from geo json

  // get population data for state counties
  this.$census.getPopulation('county', `*&in=state:${target.feature.id}`) // state code from the map

  if (target !== this.selectedLayer) {
    // zoom to region
    this._map.fitBounds(target.getBounds())
  }
}

/* -------------------------- USA Map Vue Component JS ----------------------------------- */

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

  props: ['fullScreen'], // true || false to enable fullscreen map view

  data () {
    return {
      mapCenter: [37.8, -96], // USA center lat lng coordinates
      zoom: 4, // zoom level for displaying all states
      tilesUrl: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      selectedRegion: {},
      mapProgress: 10,
      mapData: [],
      mapLayers: {},
      countyData: [],
      countyLayers: {},
      countyLayerGroup: null,
      selectedLayer: null,
      statesTopology: null,
      usaTopology: null,
      usaTopologyLayer: null,
      showTopology: true,
      colorBy: 'density',
      densityColors: [ // custom density color swatch for now
        {value: 0, color: '#FFEDA0'},
        {value: 10, color: '#FED976'},
        {value: 20, color: '#FEB24C'},
        {value: 50, color: '#FD8D3C'},
        {value: 100, color: '#FC4E2A'},
        {value: 200, color: '#E31A1C'},
        {value: 500, color: '#BD0026'},
        {value: 1000, color: '#800026'}
      ],
      layerStyle: {
        weight: 2,
        color: '#ECEFF1',
        opacity: 0.5,
        dashArray: 0,
        fillOpacity: 0.6
      },
      hoverLayerStyle: {
        weight: 3,
        color: 'red',
        dashArray: '0'
      },
      selectedLayerStyle: {
        weight: 3,
        color: 'red',
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
            fillOpacity: 0.6
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

    /**
     * Creates country/state region image flag url for the selected map region.
     */
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
      if (this.mapData.length === 0) { // for initial states population data load
        // update states map data
        this.mapData = eventData.populationData

        // update map layers fill color for proper states choropleth display
        this.mapData.map(region => {
          let regionLayer = this.mapLayers[region.regionId]
          if (regionLayer !== undefined) {
            regionLayer.setStyle({
              fillColor: // color by density for now
                getColor(this.densityColors, region.density)
            })
          }
        })
      }
      else if (this.selectedRegion !== null) {
        // show selected state counties data
        this.showCounties(this.selectedRegion.regionId, eventData.populationData)
      }
      console.log('map data updated') // , eventData)
    }
    this.$q.events.$on(this.$census.events.POPULATION, this.onPopulationUpdate)

    console.log('map created')

    // get USA states geo json for the states choropleth map topology display
    this.getStatesGeoJsonData()
  },

  mounted () {
    // create shorter leafletjs map reference to work with
    this._map = this.$refs.map.mapObject

    if (this.fullScreen) {
      // enable leaflet map fullscreen
      this.addFullScreenSupport()
    }
    addCenterMapControl(this._map, this.mapCenter, this.zoom)
    addLegendsControl(this._map, 'density (p/mi²)', this.densityColors)
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
     * Adds full screen control and support to the leaflet map.
     */
    addFullScreenSupport () {
      this._map.addControl(new L.Control.Fullscreen({position: 'topright'}))
      this._map.on('fullscreenchage', function () {
        if (this._map.isFullscreen()) {
          console.log('map entered fullscreen')
        }
        else {
          console.log('map exited fullscreen')
        }
      })
    },

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
        this._map.fitBounds(this.selectedLayer.getBounds())
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
      this._map.flyTo(this.mapCenter, this.zoom)
      this.hideRegionTooltip()
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
          this.mapProgress = 80

          // trigger load of USA states with counties topology for the state counties map zoom
          this.getUSATopoJsonData()
        })
        .catch(err => {
          this.showTopology = false
          console.log('map:getStatesGeoJsonData:error', err.response.data.error)
        })
    },

    /**
     * Gets all USA states and counties topology for the state counties choropleth display.
     */
    getUSATopoJsonData () {
      console.log('map:getUSATopoJsonData...')
      axios.get(`${this.$census.serviceHost}/data/us.json`)
        .then(response => {
          // console.log('map topo json', response.data)
          const usaTopology = response.data
          // console.log('map:getUSACountiesTopoJsonData:', usaTopology)
          console.log('map:getUSATopoJsonData:regions: states:',
            usaTopology.objects.states.geometries.length, 'counties:',
            usaTopology.objects.counties.geometries.length)

          // create USA topology layer
          this.usaTopologyLayer = new L.TopoJSON()
          this.usaTopologyLayer.addData(usaTopology)

          // get all states and counties layers
          const layers = this.usaTopologyLayer._layers
          console.log('map:getUSATopoJsonData:layers:', Object.keys(layers).length)

          // create county layers for lookups
          let countyLayerCount = 0
          Object.keys(layers).forEach((layerKey) => {
            let layer = layers[layerKey]
            let featureId = layer.feature.id
            if (featureId !== undefined && Number(featureId) > 100) { // not a state or land
              // add it to the county layers for lookup on state click
              this.countyLayers[featureId.toString()] = layer
              countyLayerCount++
            }
          })
          console.log('map:getUSATopoJsonData:countyLayers:', countyLayerCount)

          // craete and add empty county layers group to the map
          this.countyLayerGroup = L.layerGroup().addTo(this._map)

          // update map load progress
          this.mapProgress = 100
        })
        .catch(err => {
          // this.showTopology = false
          console.log('map:getUSATopoJsonData:error', err.response.data.error)
        })
    }, // end of getUSATopoJsonData()

    /**
     * Displays state counties population data
     */
    showCounties (stateCode, countiesData) {
      console.log('map:showCounties:sate:id', stateCode)

      // save new state counties data
      this.countyData = countiesData
      console.log('map:showCounties:count:', this.countyData.length)

      // remove previously shown county layers
      this.countyLayerGroup.clearLayers()

      // set parent state region map layer fill opacity to 0.0
      // for proper counties density color coding display
      if (this.selectedLayer !== null) {
        this.selectedLayer.setStyle({
          fillOpacity: 0.0
        })
      }

      // show selected state counties
      let countyLayerCount = 0
      this.countyData.map(region => {
        // county code: state code + 3 digit county code from pop. data results
        let countyCode = Number(stateCode).toString() + region.regionId
        region.parentId = stateCode
        // console.log('map:showCounties:county', countyCode, region.regionName) // county name

        // get county map layer
        let countyLayer = this.countyLayers[countyCode]
        if (countyLayer !== undefined) {
          // set county layer styles for choropleth display
          countyLayer.setStyle({
            weight: 1,
            color: '#333',
            fillOpacity: 0.6,
            fillColor: // by density for now
              getColor(this.densityColors, region.density)
          })
          // add county layer mouse and click events
          countyLayer.on({
            mouseover: () => { this.showRegionTooltip(region) },
            mouseout: () => {
              this.hideRegionTooltip()
            },
            click: () => {
              this.showRegionTooltip(region)
              // highlight clicked county map layer
              countyLayer.setStyle({
                weight: 3,
                color: '#0066ff'
              })
            }
          })
          // add selected state county layer to the counties group for display
          this.countyLayerGroup.addLayer(countyLayer)
          countyLayerCount++
        }
      })
      console.log(`map:showCounties: added ${countyLayerCount} county map layers`)
    }, // end of showCounties()

    /**
     * Displays region tooltip on map layer mouse over and click.
     */
    showRegionTooltip (region) {
      const tooltipPosition = [70, 68]
      this.$refs.regionTooltip.show(region, tooltipPosition)
    },

    /**
     * Hides map region tooltip.
     */
    hideRegionTooltip () {
      this.$refs.regionTooltip.hide()
    }
  }
}
</script>
