<template>
  <q-card class="table-card">
    <q-card-title>
      {{title}}
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

import QDataTable from 'quasar'

export default {
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
      title: 'USA population',
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

  mounted () {
    console.log('table mounted')
  },

  beforeDestroy () {
  }

}
</script>

<style>
</style>
