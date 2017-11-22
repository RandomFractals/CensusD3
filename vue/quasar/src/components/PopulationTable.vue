<template>
  <q-card class="table-card">
    <!-- table card header -->
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.regionName}}</span>
      <q-btn small flat slot="right" class="map-button" 
        icon="vertical_align_top" 
        @click="backToTopLevel()" />
    </q-card-title>
    <q-card-separator />
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
    <!-- table data content -->
    <q-card-main class="data-table">
      <table id="data-table" style="width: 100%"
        class="q-table standard bordered compact highlight vertical-separator">
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
            @click="rowClick(index)">
            <td data-th="State">{{region.regionName}}</td>
            <td data-th="Population">{{region.population | formatNumber}}</td>
            <td data-th="Density">{{region.density | formatDecimal}}</td>
          </tr>
        </tbody>
      </table>
    </q-card-main>
    </q-collapsible>
  </q-card>
</template>

<style>
.q-item {
  min-height: 24px;
  padding: 0px 5px 0px 5px;
}
.q-item-side {
  min-width: 24px;
}
.q-collapsible-sub-item {
  padding: 0px;
}
.card-subtitle {
  padding-left: 5px;
  font-size: 12px;
}
.data-table {
  height: 280px;
  margin: 5px 0px 0px 5px;
  overflow-y: scroll;
}
th {
  background-color: #efefef;
}
th, td {
  cursor: pointer;
  font-size: 12px;
}
</style>

<script>

import {QBtn, Events} from 'quasar'

export default {
  name: 'population-table',

  components: {
    QBtn
  },

  data () {
    return {
      selectedRegion: {},
      topLevelRegion: null,
      tableData: [],
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
      console.log('table:selectedRegion:', regionData.regionName)
    }
    this.$q.events.$on(this.$census.events.REGION, this.onRegionSelectionChange)

    // add population data update event handler
    this.onPopulationUpdate = eventData => {
      // update selected region total population sum
      this.selectedRegion.population = eventData.totalPopulation

      // update table data
      this.tableData = eventData.populationData

      // update region column label
      this.regionColumnLabel = this.tableData[0].regionType

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
              if (a[sortBy] < b[sortBy]) { return -1 }
              if (a[sortBy] > b[sortBy]) { return 1 }
              return 0
            })
            break
          default: // number sort
            this.tableData = this.tableData.sort((a, b) => Number(a[sortBy]) - Number(b[sortBy]))
            break
        }
        this.sortColumn = sortBy
        this.sortAscending = true
      }
      console.log(`table:sortData: property=${sortBy} ascending=${this.sortAscending}`)
    }
  }

}
</script>

<style>
</style>
