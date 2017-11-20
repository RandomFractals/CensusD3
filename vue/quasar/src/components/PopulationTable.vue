<template>
  <q-card class="table-card">
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.regionName}}</span>
    </q-card-title>
    <q-card-separator />
    <div class="card-subtitle">
      <span class="text-faded">population:</span>
      <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
    </div>
    <div class="card-subtitle">
      <span class="text-faded">density:</span>
      <span class="text-bold">{{selectedRegion.density | formatDecimal}}</span>
      <span class="text-small">p/mi²</span>
    </div>    
    <q-card-main class="data-table">
      <table id="data-table" style="width: 100%"
        class="q-table standard bordered compact highlight vertical-separator">
        <thead>
          <tr>
            <th @click="sortTableData('regionName')">{{regionLabel}}</th>
            <th @click="sortTableData('population')">Population</th>
            <th @click="sortTableData('density')">Density</th>
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
  </q-card>
</template>

<style>
.card-subtitle {
  padding-left: 5px;
  font-size: 12px;
}
.data-table {
  margin: 5px 0px 0px 5px;
  overflow-y: scroll;
}
th, td {
  cursor: pointer;
  font-size: 12px;
}
</style>

<script>

import {Events} from 'quasar'

export default {
  name: 'population-table',
  data () {
    return {
      selectedRegion: {},
      tableData: [],
      sortColumn: 'regionName',
      sortAscending: true,
      regionLabel: 'State'
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
    // add population data update event handler
    this.onPopulationUpdate = eventData => {
      this.selectedRegion = eventData.selectedRegion
      this.tableData = eventData.populationData
      console.log('table data updated') // , eventData)
    }
    this.$q.events.$on('census:population', this.onPopulationUpdate)

    // add region selection change event handler
    this.onRegionSelectionChange = regionData => {
      this.selectedRegion = regionData
      console.log('table:selectedRegion:', regionData.regionName)
    }
    this.$q.events.$on('census:region', this.onRegionSelectionChange)

    console.log('table created')
  },

  mounted () {
    console.log('table mounted')
  },

  /**
   * Removes table data and view update handlers.
   */
  beforeDestroy () {
    this.$q.events.$off('census:population', this.onPopulationUpdate)
    this.$q.events.$off('census:region', this.onRegionSelectionChange)
  },

  methods: {

    /**
     * Table row click event handler.
     */
    rowClick (rowIndex) {
      console.log(`table:rowClick: rowIndex=${rowIndex}`)
      // notify app components about region selection change
      Events.$emit('census:region', this.tableData[rowIndex])
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
