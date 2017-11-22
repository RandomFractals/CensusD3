import axios from 'axios'
import {Events} from 'quasar'
import {usaStates} from '../data/us-states.js'

export default {
  install: (Vue) => {
    Vue.prototype.$census = {

      // custom Census data service properites
      states: usaStates, // states map for state code lookups
      serviceHost: 'https://censusd3.herokuapp.com', // using old d3 proj. node for app data

      // census data service/bus events
      events: {
        POPULATION: 'census:population', // population data update event
        REGION: 'census:regionChange' // new region selection event
      },

      /**
       * Gets country/state flag image src url.
       *
       * @param {*} regionId Numeric region id.
       * See data/us-state.js config
       */
      getRegionImageUrl (regionId = '00') { // for usa
        return `${this.serviceHost}/images/flags/${this.states[regionId].code}.png`
      },

      /**
       * Gets USA states or state counties population data.
       *
       * @param regionType 'state' for all states data (deafult),
       *  or 'county' for all state counties population data
       *
       * @param query population data query params, such as *[&in=state:22]
       */
      getPopulation (regionType = 'state', query = '*') {
        // get population data from our custom node.js express data service
        // Note: see /routes/index.js in CensusD3 repository on github
        axios.get(`${this.serviceHost}/census/population/${regionType}:${query}`)
          .then(response => {
            console.log('census::getPopulation:regions:', response.data.length)

            // strip out header row
            let popData = response.data.slice(1)
            if (regionType === 'state') {
              // strip out Puerto Rico data (last row)
              popData = popData.slice(0, 51)
            }

            // get total sum
            const totalPopulation = popData.map(regionData => Number(regionData[0]))
              .reduce((a, b) => a + b, 0) // total count accumulator

            // create regions population data collection for states or counties
            const populationData = popData.map(function (regionData) {
              return { // create simple region population data object
                population: Number(regionData[0]), // population count column data
                regionName: regionData[1].substr(0, regionData[1].indexOf(',')), // region name without state
                regionType: regionType,
                density: Number(regionData[3]), // density column data
                regionId: regionData.length < 6 ? regionData[4] : regionData[5] // state/county code
              }
            })

            console.log(`census:population:data: regionsCount=${populationData.length} total=${totalPopulation}`)

            // push new census population data
            // to the global quasar app event bus
            // for the dashboard app components to digest
            Events.$emit(this.events.POPULATION, {
              totalPopulation: totalPopulation,
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
