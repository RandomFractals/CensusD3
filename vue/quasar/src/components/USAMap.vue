<template>
  <q-card class="primary-content">
    <q-card-title>
      {{title}}
    </q-card-title>
    <q-card-separator />
    <q-card-main style="height: 80%">
      <v-map style="height: 100%" :zoom="zoom" :center="center">
        <v-tilelayer :url="url" :attribution="attribution"></v-tilelayer>
      </v-map>
    </q-card-main>
  </q-card>  
</template>

<script>
import Vue2Leaflet from 'vue2-leaflet'

export default {
  name: 'usa-map',
  components: {
    'v-map': Vue2Leaflet.Map,
    'v-tilelayer': Vue2Leaflet.TileLayer
  },

  data () {
    return {
      title: 'USA map',
      zoom: 4,
      center: [37.8, -96],
      url: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }
  }
}
</script>

<style>
@import "../../node_modules/leaflet/dist/leaflet.css";
</style>
