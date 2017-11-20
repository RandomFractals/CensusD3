import axios from 'axios'
import {Events} from 'quasar'
import {usaStates} from '../data/us-states.js'

export default {
  install: (Vue) => {
    Vue.prototype.$census = {

      // states map
      states: usaStates,

      /**
       * Gets country/state flag image src url.
       * @param {*} regionId Numeric region id.
       */
      getRegionImageUrl (regionId = '00') { // for usa
        return `http://censusd3.herokuapp.com/images/flags/${this.states[regionId].code}.png`
      },

      /**
       * Gets USA or state population data.
       */
      getPopulation (region = 'USA') {
        // get USA population data for all states
        axios.get(`http://censusd3.herokuapp.com/census/population/state:*`)
          .then(response => {
            console.log('census::getPopulation:regions:', response.data.length)

            // strip out header row and Puerto Rico data (last row)
            let popData = response.data.slice(1, 51)

            // create selected region population data object
            // for the total USA population count display
            let selectedRegion = {
              regionName: region,
              population: popData.map(regionData => Number(regionData[0]))
                .reduce((a, b) => a + b, 0) // total count
            }

            // create population data for sub-regions (states or counties)
            let populationData = popData.map(function (regionData) {
              return { // create simple region population data object
                regionName: regionData[1].substr(0, regionData[1].indexOf(',')), // region name without state
                regionId: regionData[4], // numeric region code
                regionType: 'state', // top-level region type for now
                population: Number(regionData[0]), // population count column data
                density: Number(regionData[3]) // density column data
              }
            })
            console.log('census:population:data:', populationData)

            // push new census data to the global quasar app event bus
            Events.$emit('census:population', {
              selectedRegion: selectedRegion,
              populationData: populationData
            })
          })
          .catch(err => {
            Events.$emit('census:population:error', err.response) // .data.error)
          })
      } // end of getPopulation()
    }
  }
}
