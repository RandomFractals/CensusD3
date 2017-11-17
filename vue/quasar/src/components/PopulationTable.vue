<template>
  <q-card class="table-card">
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.name}} population:</span>
      <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
    </q-card-title>
    <q-card-separator />
    <q-card-main class="data-table">
      <table class="q-table standard striped bordered compact highlight vertical-separator">
        <thead>
          <tr>
            <th @click="sortData('regionName')">State</th>
            <th @click="sortData('population')">Population</th>
            <th @click="sortData('density')">Density</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="region in populationData" :key="region.regionId"
            @click="selectRegion(region.regionId)">
            <td data-th="State">{{region.regionName}}</td>
            <td data-th="Population">{{region.population | formatNumber}}</td>
            <td data-th="Density">{{region.density | formatDecimal}}</td>
          </tr>
        </tbody>
      </table>
      <!--
      <q-data-table :data="table" 
        :config="config" 
        :columns="columns"
        @rowClick="rowClick">
        -->
      </q-data-table>
    </q-card-main>
  </q-card>
</template>

<style>
.data-table {
  height: 320px;
  margin: 5px 0px 0px 5px;
  overflow-y: scroll;
}
</style>

<script>

import {QDataTable, Events} from 'quasar'

export default {
  name: 'population-table',
  components: {
    QDataTable: QDataTable
  },

  data () {
    return {
      selectedRegion: {},
      populationData: [],
      config: {
        title: 'Population',
        noHeader: false,
        refresh: false,
        columnPicker: false,
        // (optional)
        // Styling the body of the data table;
        // "minHeight", "maxHeight" or "height" are important
        bodyStyle: {
          maxHeight: '500px'
        },
        rowHeight: '50px',
        responsive: true
      },
      columns: [
        {
          label: 'Region',
          field: 'region',
          filter: true,
          sort: true,
          type: 'string',
          width: '100px'
        },
        {
          label: 'Population',
          field: 'population',
          filter: false,
          sort: true,
          type: 'number',
          width: '100px'
        }
      ]
    }
  },

  computed: {
    regionIconSrc: function () {
      return `http://censusd3.herokuapp.com/images/flags/${this.selectedRegion.name}.png`
    }
  },

  /**
   * Adds global quasar event bus data handlers.
   */
  created () {
    this.dataHandler = state => {
      this.selectedRegion = state.selectedRegion
      this.populationData = state.populationData
      console.log('table data', state)
    }
    this.$q.events.$on('census:population', this.dataHandler)
    console.log('table created')
  },

  mounted () {
    console.log('table mounted')
  },

  /**
   * Removes global quasar event bus data handlers.
   */
  beforeDestroy () {
    this.$q.events.$off('census:population', this.dataHandler)
  },

  methods: {
    selectRegion (regionId) {
      console.log(`table:selectRegion: regionId=${regionId}`)
      // notify app about region selection change
      Events.$emit('census:regionChange', {
        selectedRegion: regionId
      })
    },

    rowClick (row) {
      console.log('clicked on a row', row)
    },

    sortData (sortBy) {
      console.log(`table:sortData: property=${sortBy}`)
      this.populationData = this.populationData.sort((a, b) => a[sortBy] > b[sortBy])
      console.log(this.populationData)
    }
  }

}
</script>

<style>
</style>
