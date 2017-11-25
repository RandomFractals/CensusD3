<template>
  <div>
  <!--
    Note: use <q-side-link> component instead of <q-item>
      for internal vue-router navigation
  -->
    <q-list no-border link inset-delimiter>
      <q-list-header>
        <img src="statics/images/quasar-logo.png" height="24" />
        powered by Quasar Framework
      </q-list-header>
      <q-item-separator />
      <q-item @click="openPage('http://quasar-framework.org')">
        <q-item-side icon="school" />
        <q-item-main label="Docs" sublabel="quasar-framework.org" />
      </q-item>
      <q-item @click="openPage('http://forum.quasar-framework.org')">
        <q-item-side icon="record_voice_over" />
        <q-item-main label="Forum" sublabel="forum.quasar-framework.org" />
      </q-item>
      <q-item @click="openPage('https://gitter.im/quasarframework/Lobby')">
        <q-item-side icon="chat" />
        <q-item-main label="Gitter Channel" sublabel="Quasar Lobby" />
      </q-item>
      <q-item @click="openPage('https://twitter.com/quasarframework')">
        <q-item-side icon="rss feed" />
        <q-item-main label="Twitter" sublabel="@quasarframework" />
      </q-item>
      <q-item-separator />
      <q-item @click="openPage('https://api.census.gov/data.html')">
        <q-item-side icon="file download" />
        <q-item-main label="USA Census Data" sublabel="https://api.census.gov/data.html" />
      </q-item>
      <q-item-separator />
      <q-item @click="openPage('https://github.com/RandomFractals/CensusD3/tree/master/vue/quasar')">
        <q-item-side icon="merge type" />
        <q-item-main label="Census Vue on Github" sublabel="RandomFractals/CensusD3/vue" />
      </q-item>        
    </q-list>
  </div>
</template>

<style>
</style>

<script>
import {
  QList,
  QListHeader,
  QItem,
  QItemSide,
  QItemMain,
  QItemSeparator,
  openURL
} from 'quasar'

export default {
  name: 'app-menu',

  components: {
    QList,
    QListHeader,
    QItem,
    QItemSide,
    QItemMain,
    QItemSeparator
  },

  data () {
    return {}
  },

  methods: {

    /**
     * Opens the specified app menu link url in a new browser tab.
     */
    openPage (pageUrl) {
      openURL(pageUrl)
    }
  }
}
</script>

