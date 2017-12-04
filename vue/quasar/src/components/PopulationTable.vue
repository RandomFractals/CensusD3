<template>
  <q-card>
    <!-- table card header -->
    <q-card-title>
      <img :src="regionIconSrc" class="flag" height="24" />
      <span class="card-title">{{selectedRegion.regionName}}</span>
      <q-btn small flat slot="right" class="map-button" 
        @click="backToTopLevel()">
        <q-icon name="arrow back" />
      </q-btn>
    </q-card-title>
    <q-progress ref="progressBar" :percentage="dataProgress" 
      color="primary" style="height: 2px" />
    <!-- table card subheader -->
    <q-collapsible icon="people" opened
      :label="selectedRegion.population | formatNumber">
      <!--
      <div class="card-subtitle">
        <span class="text-faded">population:</span>
        <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
      </div>
      -->
      <div class="card-subtitle">
        <span class="text-faded">density:</span>
        <span class="text-bold">{{selectedRegion.density | formatDecimal}}</span>
        <span class="text-small">p/mi²</span>
      </div>    
    <!-- data table content -->
    <q-card-main class="table card data-table">
      <region-tooltip id="regionTooltip" ref="regionTooltip" />
      <table id="data-table" ref="dataTable" style="width: 100%"
        class="q-table standard bordered highlight horizontal-separator vertical-separator">
        <thead>
          <tr>
            <th @click="sortTableData('regionName')">{{regionColumnLabel}}</th>
            <th @click="sortTableData('population')">population</th>
            <th @click="sortTableData('density')">density</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(region, index) in tableData" 
            :key="region.regionId"
            :data-index="index"
            @click="rowClick(index)"
            @mouseover="rowMouseOver"
            @mouseout="rowMouseOut">
            <td data-th="State">{{region.regionName}}</td>
            <td data-th="Population">
              {{region.population | formatNumber}}
              <q-progress :percentage="(region.population / selectedRegion.population) * 100"
                color="cyan" style="height: 2px" />                
            </td>
            <td data-th="Density">
              {{region.density | formatDecimal}}
              <q-progress :percentage="(region.density / maxDensity) * 100"
                color="red" style="height: 2px" />              
            </td>
          </tr>
        </tbody>
      </table>
    </q-card-main>
    </q-collapsible>
  </q-card>
</template>

<style>
.q-item {
  min-height: 32px;
  padding: 0px 5px 0px 5px;
}
.q-item-side {
  min-width: 32px;
}
.q-collapsible-sub-item {
  padding: 0px;
}
.card-subtitle {
  padding-left: 5px;
  font-size: 14px;
}
.flag {
  vertical-align: middle;
}
.data-table {
  height: 272px;
  margin: 5px 0px 0px 2px;
  overflow-y: scroll;
}
th {
  background-color: #efefef;
}
table.q-table th, table.q-table td, th, td {
  border: 1px solid #eee;
  cursor: pointer;
  font-size: 14px;
  padding: 5px;
}
</style>

<script>

import {
  QBtn,
  QProgress,
  Events
} from 'quasar'

import RegionTooltip from './RegionTooltip.vue'

export default {
  name: 'population-table',
  components: {
    QBtn,
    QProgress,
    RegionTooltip
  },
  data () {
    return {
      selectedRegion: {},
      topLevelRegion: null,
      tableData: [],
      dataProgress: 15,
      maxPopulation: 0,
      maxDensity: 0,
      sortColumn: 'regionName',
      sortAscending: true,
      regionColumnLabel: 'state'
    }
  },

  computed: {
    regionIconSrc: function () {
      return this.$census.getRegionImageUrl(this.selectedRegion.regionId)
    }
  },

  /**
   * Adds table data and view event handlers.
   */
  created () {
    // add region selection change event handler
    this.onRegionSelectionChange = regionData => {
      this.selectedRegion = regionData
      if (this.topLevelRegion === null) {
        // set top level for back to top click
        this.topLevelRegion = regionData
      }
      this.dataProgress = 15
      console.log('table:selectedRegion:', regionData.regionName)
    }
    this.$q.events.$on(this.$census.events.REGION, this.onRegionSelectionChange)

    // add population data update event handler
    this.onPopulationUpdate = eventData => {
      // update selected region total population sum
      this.selectedRegion.population = eventData.totalPopulation

      // update table data and view
      this.tableData = eventData.populationData
      this.dataProgress = 100

      // update region column label, sort column, order, etc
      this.sortColumn = 'regionName'
      this.sortAscending = true
      if (this.tableData && this.tableData.length > 0) {
        this.regionColumnLabel = this.tableData[0].regionType
        this.maxPopulation = this.getMaxValue(this.tableData, 'population')
        this.maxDensity = this.getMaxValue(this.tableData, 'density')
      }
      // sort by population for new list data display
      this.sortTableData('population')

      console.log('table data updated') // , eventData)
    }
    this.$q.events.$on(this.$census.events.POPULATION, this.onPopulationUpdate)

    console.log('table created')
  },

  mounted () {
    console.log('table mounted')
  },

  /**
   * Removes table data and view update handlers.
   */
  beforeDestroy () {
    this.$q.events.$off(this.$census.events.REGION, this.onRegionSelectionChange)
    this.$q.events.$off(this.$census.events.POPULATION, this.onPopulationUpdate)
  },

  methods: {

    /**
     * Reloads USA states population census data display.
     */
    backToTopLevel () {
      Events.$emit(this.$census.events.REGION, this.topLevelRegion)
      // get USA states population data
      this.$census.getPopulation()

      // hide tooltip if shown
      this.$refs.regionTooltip.hide()
    },

    /**
     * Table row click event handler.
     */
    rowClick (rowIndex) {
      console.log(`table:rowClick: rowIndex=${rowIndex}`)
      const region = this.tableData[rowIndex]
      if (region.regionType === 'state') {
        // notify app components about state region selection change
        Events.$emit(this.$census.events.REGION, region)
      }
    },

    /**
     * Displays region data tooltip on data table row mouse over.
     */
    rowMouseOver (mouseEvent) {
      // get mouse over row index
      // Note: mouse overs are fired on td cells
      const rowIndex = mouseEvent.target.parentNode.getAttribute('data-index')
      // console.log(`table:row:mouseOver: rowIndex=${rowIndex}`)

      if (rowIndex && this.$refs.regionTooltip !== undefined) {
        // set parent Id for county state info display
        this.tableData[rowIndex].parentId = this.selectedRegion.regionId
        // show mouse over region tooltip
        const tooltipPosition = [2, -32]
        this.$refs.regionTooltip.show(this.tableData[rowIndex], tooltipPosition)
      }
    },

    /**
     * Hides region data tooltip on data table row mouse out.
     */
    rowMouseOut (mouseEvent) {
      this.$refs.regionTooltip.hide()
    },

    /**
     * Sorts table data by the specified sort property/column and order.
     */
    sortTableData (sortBy) {
      if (this.sortColumn === sortBy) {
        this.tableData = this.tableData.reverse()
        this.sortAscending = !this.sortAscending
      }
      else {
        // sort by new column
        switch (sortBy) {
          case 'regionName': // string sort
            this.tableData = this.tableData.sort(function (a, b) {
              if (a[sortBy] > b[sortBy]) { return -1 }
              if (a[sortBy] < b[sortBy]) { return 1 }
              return 0
            })
            break
          default: // number sort
            this.tableData = this.tableData.sort((a, b) => Number(a[sortBy]) - Number(b[sortBy]))
            break
        }
        this.sortColumn = sortBy
        // default to descending and reverse on new column sort
        this.sortAscending = false
        this.tableData = this.tableData.reverse()
      }
      console.log(`table:sortData: property=${sortBy} ascending=${this.sortAscending}`)
    },

    /**
     * Gets max value for the specified array and object property key.
     */
    getMaxValue (array, key) {
      return Math.max(...array.filter(x => Number(x[key])).map(x => Number(x[key])))
    }

  } // end of methods

}
</script>

<style>
</style>
