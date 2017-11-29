<template>
  <div class="region-tooltip">
    <div class="card-subtitle">
      <span class="text-faded">population:</span>
      <span class="text-bold">{{region.population | formatNumber}}</span>
    </div>    
    <div class="card-subtitle">
      <span class="text-faded">density:</span>
      <span class="text-bold">{{region.density | formatDecimal}}</span>
      <span class="text-small">p/mi²</span>
    </div>    
  </div>
</template>

<style>
.region-tooltip {
  display: hidden;
  position: absolute;
}
</style>

<script>
import {
  QProgress
} from 'quasar'

export default {
  name: 'region-tooltip',
  components: {
    QProgress
  },

  data () {
    return {
      region: {},
      positionX: 0,
      positionY: 0,
      display: 'none'
    }
  },

  methods: {
    /**
     * Displays region tooltip at the specified mouse over position.
     */
    show (region, position) { // [x,y]
      this.region = region
      if (position && position !== undefined && position.length === 2) {
        this.positionX = Number(position[0])
        this.positionY = Number(position[1])
      }
      else {
        // reset display position to 0,0
        this.positionX = 0
        this.positionY = 0
      }
      // show tooltip
      this.display = 'block'
    },

    /**
     * Hides region tooltip display.
     */
    hide () {
      this.display = 'none'
    }
  }
}
</script>

