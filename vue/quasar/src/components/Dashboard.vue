<template>
  <q-layout ref="layout"
    view="lHh Lpr fFf">
    <!-- dashboard view resize observable -->
    <q-window-resize-observable @resize="resize" />
    <!-- app toolbar -->
    <q-toolbar slot="header" class="app-toolbar">
      <q-btn flat @click="$refs.layout.toggleLeft()">
        <q-icon name="menu" />
      </q-btn>
      <q-toolbar-title>
        <q-btn flat class="app-title" @click="appTitleClick()">USA Census Vue</q-btn>
      </q-toolbar-title>
      <q-btn flat @click="scrollToCard('mapCard')">
        <q-icon name="map" />
      </q-btn>
      <q-btn flat @click="scrollToCard('listCard')">
        <q-icon name="list" />
      </q-btn>
      <q-btn flat @click="scrollToCard('chartCard')">
        <q-icon name="poll" />
      </q-btn>      
    </q-toolbar>

    <!-- left side panel/app menu -->
    <div slot="left">
      <app-menu />
    </div>

    <!-- app content -->
    <!--
      Note: replace following <div> with <router-view /> component if using subRoutes
    -->    
    <div class="app-content sm-gutter">
      <div class="row">
        <div ref="mapCard" class="col-xs-12 col-sm-8 col-md-8 col-lg-8 colcl-8 map-card">
          <usa-map ref="map" :map-data="populationData" />
        </div>
        <div ref="listCard" class="col-xs-12 col-sm-4 col-md-4 col-lg-4 col-xl-4">
          <population-table ref="dataTable" :table-data="populationData" />
        </div>
      </div>
      <div class="row">
        <div ref="chartCard" class="col-12 chart-card">
          <population-chart ref="populationChart" :chart-data="populationData" />
        </div>
      </div>
    </div>

    <!-- footer -->
    <q-toolbar slot="footer" color="light" class="app-footer">
      <small>
        <img src="statics/images/rfi-github.png" height="20" style="vertical-align: top;" />
        <a href="https://github.com/RandomFractals/CensusD3/tree/master/vue/quasar" target="_blank"
          title="census-vue project on github">census-vue</a>
        <span class="text-faded">&copy;Random Fractals Inc. 2017</span>
      </small>
      <!-- back to top button for small screens -->
      <q-fixed-position corner="bottom-right" :offset="[0, -30]">
        <q-btn v-back-to-top small color="primary" class="map-button">
          <q-icon name="keyboard_arrow_up" />
        </q-btn>
      </q-fixed-position>
    </q-toolbar>
 
  </q-layout>
</template>

<style>
/* app content styles */
.app-toolbar {
  padding: 0px;
  min-height: 40px;
}
.app-title {
  padding: 5px;
  text-transform: none;
}
.app-content {
  margin: 5px 20px 5px 0px;
}
.app-footer {
  min-height: 30px;
  padding: 0px 5px 0px 10px;
}

/* app card styles */
.map-card, .table-card {
  height: 360px;
  padding: 0px;
}

.table-card {
  margin-left: 0px;
  margin-right: 0px;
}

.chart-card {
  height: 280px;
}

/* override q-card styles to slim them down */
.q-card {
  padding: 0px;
  margin: 0px;
}
.q-card-title {
  padding: 0px;
  padding-left: 5px;
  font-size: 16px;
}
.q-card-container {
  padding: 0px;
}
</style>

<script>
import {
  BackToTop,
  Events,
  QLayout,
  QFixedPosition,
  QToolbar,
  QToolbarTitle,
  QBtn,
  QIcon,
  QWindowResizeObservable
} from 'quasar'

import AppMenu from './AppMenu.vue'
import USAMap from './USAMap.vue'
import PopulationTable from './PopulationTable.vue'
import PopulationChart from './PopulationChart.vue'

export default {
  name: 'index',
  components: {
    QLayout,
    QFixedPosition,
    QToolbar,
    QToolbarTitle,
    QBtn,
    QIcon,
    QWindowResizeObservable,
    AppMenu,
    usaMap: USAMap,
    PopulationTable,
    PopulationChart
  },

  directives: {
    BackToTop
  },

  data () {
    return {
      usaData: { // hardcoded USA population data for initial app load
        regionId: '00',
        regionName: 'USA',
        regionType: 'country',
        population: 320832714,
        density: 87.4 // per squar mile according to 2015 census data
      },
      selectedRegion: this.usaData,
      populationData: [],
      loaded: false,
      showError: false,
      errorMessage: 'Error loading population data'
    }
  },

  methods: {

    /**
     * Resets view data load and error message display view state.
     */
    resetState () {
      this.loaded = false
      this.showError = false
    },

    /**
     * Reloads USA states population census data display.
     */
    appTitleClick () {
      Events.$emit(this.$census.events.REGION, this.usaData)
      // get USA states population data
      this.$census.getPopulation()
    },

    /**
     * Scrolls to the specified content card on small screens.
     */
    scrollToCard (cardName) {
      console.log('dashboard:scrollTo:', cardName)
      let card = this.$refs[cardName]
      const cardBounds = card.getBoundingClientRect()
      window.scrollTo(0, cardBounds.y)
    },

    /**
     * Window resize handler
     */
    resize (size) {
      // TODO: adjust chart card height
      // to fit bottom of the screen on larger screens
      // console.log('dashboard:resize', size)
    }
  }, // end of methods

  /**
   * Adds app view visibility handler
   * and handles dashboard view init.
   */
  created () {
    // add quasar app visibility handler
    this.onAppViewUpdate = appViewState => {
      console.log('app:visibility:', appViewState)
    }
    this.$q.events.$on('app:visibility', this.onAppViewUpdate)

    // add region selection change event handler
    this.onRegionSelectionChange = regionData => {
      this.selectedRegion = regionData
      console.log('dashboard:selectedRegion:', regionData)
    }
    this.$q.events.$on(this.$census.events.REGION, this.onRegionSelectionChange)

    console.log('dashboard created')
  },

  /**
   * Adds app view change event handlers,
   * and gets initial USA population data
   * to display on app load for now.
   */
  mounted () {
    this.$nextTick(() => {
      if (this.orienting) {
        window.addEventListener('deviceorientation', this.orient, false)
      }
      else if (this.rotating) {
        window.addEventListener('devicemove', this.rotate, false)
      }
      else {
        document.addEventListener('mousemove', this.move)
      }
    })
    console.log('dashboard mounted')

    // triggeer USA region selection on dashboard app init
    Events.$emit(this.$census.events.REGION, this.usaData)

    // get initial USA states population data for now
    this.$census.getPopulation()
  },

  /**
   * Removes app view event handlers.
   */
  beforeDestroy () {
    if (this.orienting) {
      window.removeEventListener('deviceorientation', this.orient, false)
    }
    else if (this.rotating) {
      window.removeEventListener('devicemove', this.rotate, false)
    }
    else {
      document.removeEventListener('mousemove', this.move)
    }

    // remove app view and census data event handlers
    this.$q.events.$off('app:visibility', this.onAppViewUpdate)
    this.$q.events.$off(this.$census.events.REGION, this.onRegionSelectionChange)
  }
}
</script>