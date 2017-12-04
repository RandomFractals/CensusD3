<template>
  <div class="region-tooltip" 
    :style="{display: display, left: positionX + 'px', top: positionY + 'px'}">
    <div class="card-subtitle">
      <!--
      <img :src="regionIconSrc" class="flag" height="24" />
      -->
      <span class="card-title">{{region.regionName}}</span>
    </div>
    <hr />
    <div class="card-subtitle">
      <q-icon name="people" />
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
  display: none;
  position: absolute;
  background-color: #fffafa;
  border: 1px solid #666;
  border-radius: 3px;
  padding: 5px;
  z-index: 500;
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

  computed: {
    regionIconSrc: function () {
      const regionFlagId = (this.region.regionType === 'state')
        ? this.region.regionId : this.region.parentId
      return this.$census.getRegionImageUrl(regionFlagId)
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
      // console.log(`regionTooltip:show: X=${this.positionX} Y=${this.positionY}`)
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

