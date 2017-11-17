<template>
  <q-card class="table-card">
    <q-card-title>
      <img :src="regionIconSrc" height="18" />
      <span class="card-title">{{selectedRegion.name}} population:</span>
      <span class="text-bold">{{selectedRegion.population | formatNumber}}</span>
    </q-card-title>
    <q-card-separator />
    <q-card-main>
      <table class="q-table responsive">
        <thead>
          <tr>
            <th>State</th>
            <th>Population</th>
            <th>Density</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-th="State">State</td>
            <td data-th="Population">0</td>
            <td data-th="Density">0</td>
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

<script>

import {QDataTable} from 'quasar'

export default {
  name: 'population-table',
  components: {
    QDataTable: QDataTable
  },

  methods: {
    rowClick (row) {
      console.log('clicked on a row', row)
    }
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
      return 'http://censusd3.herokuapp.com/images/flags/' + this.selectedRegion.name + '.png'
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
  }
}
</script>

<style>
</style>
