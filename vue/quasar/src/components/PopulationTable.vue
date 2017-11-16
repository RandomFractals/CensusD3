<template>
  <q-card class="table-card">
    <q-card-title>
      {{region}} population: {{population}}
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

  props: {
    populationData: {
      type: Array | Object,
      required: true
    }
  },

  methods: {
    rowClick (row) {
      console.log('clicked on a row', row)
    }
  },

  data () {
    return {
      region: 'USA',
      population: 0,
      table: [{region: 'test', population: 0}],
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

  created () {
    this.dataHandler = state => {
      this.region = state.region
      this.population = state.totalPopulation
      this.populationData = state.populationData
      this.regions = state.regions
      console.log('table data', state)
    }
    this.$q.events.$on('census:population', this.dataHandler)
    console.log('table created')
  },

  mounted () {
    console.log('table mounted')
  },

  beforeDestroy () {
    this.$q.events.$off('census:population', this.dataHandler)
  }
}
</script>

<style>
</style>
