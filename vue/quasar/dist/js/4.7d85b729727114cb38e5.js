webpackJsonp([4],{282:function(t,e,a){var o=a(283);"string"==typeof o&&(o=[[t.i,o,""]]),o.locals&&(t.exports=o.locals);a(50)("751853b8",o,!0)},283:function(t,e,a){e=t.exports=a(49)(void 0),e.push([t.i,".q-item{min-height:32px;padding:0 5px}.q-item-side{min-width:32px}.q-collapsible-sub-item{padding:0}.card-subtitle{padding-left:5px;font-size:14px}.flag{vertical-align:middle}.data-table{height:272px;margin:5px 0 0 2px;overflow-y:scroll}th{background-color:#efefef}table.q-table td,table.q-table th,td,th{cursor:pointer;font-size:14px;padding:5px}",""])},284:function(t,e,a){var o=a(285);"string"==typeof o&&(o=[[t.i,o,""]]),o.locals&&(t.exports=o.locals);a(50)("7119e297",o,!0)},285:function(t,e,a){e=t.exports=a(49)(void 0),e.push([t.i,"",""])},286:function(t,e,a){"use strict";var o=a(2);e.a={name:"population-table",components:{QBtn:o.e,QProgress:o.t},data:function(){return{selectedRegion:{},topLevelRegion:null,tableData:[],dataProgress:15,sortColumn:"regionName",sortAscending:!0,regionColumnLabel:"state"}},computed:{regionIconSrc:function(){return this.$census.getRegionImageUrl(this.selectedRegion.regionId)}},created:function(){var t=this;this.onRegionSelectionChange=function(e){t.selectedRegion=e,null===t.topLevelRegion&&(t.topLevelRegion=e),t.dataProgress=15,console.log("table:selectedRegion:",e.regionName)},this.$q.events.$on(this.$census.events.REGION,this.onRegionSelectionChange),this.onPopulationUpdate=function(e){t.selectedRegion.population=e.totalPopulation,t.tableData=e.populationData,t.dataProgress=100,t.regionColumnLabel=t.tableData[0].regionType,console.log("table data updated")},this.$q.events.$on(this.$census.events.POPULATION,this.onPopulationUpdate),console.log("table created")},mounted:function(){console.log("table mounted")},beforeDestroy:function(){this.$q.events.$off(this.$census.events.REGION,this.onRegionSelectionChange),this.$q.events.$off(this.$census.events.POPULATION,this.onPopulationUpdate)},methods:{backToTopLevel:function(){o.b.$emit(this.$census.events.REGION,this.topLevelRegion),this.$census.getPopulation()},rowClick:function(t){console.log("table:rowClick: rowIndex="+t);var e=this.tableData[t];"state"===e.regionType&&o.b.$emit(this.$census.events.REGION,e)},sortTableData:function(t){if(this.sortColumn===t)this.tableData=this.tableData.reverse(),this.sortAscending=!this.sortAscending;else{switch(t){case"regionName":this.tableData=this.tableData.sort(function(e,a){return e[t]<a[t]?-1:e[t]>a[t]?1:0});break;default:this.tableData=this.tableData.sort(function(e,a){return Number(e[t])-Number(a[t])})}this.sortColumn=t,this.sortAscending=!0}console.log("table:sortData: property="+t+" ascending="+this.sortAscending)}}}},287:function(t,e,a){"use strict";var o=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("q-card",[a("q-card-title",[a("img",{staticClass:"flag",attrs:{src:t.regionIconSrc,height:"24"}}),t._v(" "),a("span",{staticClass:"card-title"},[t._v(t._s(t.selectedRegion.regionName))]),t._v(" "),a("q-btn",{staticClass:"map-button",attrs:{slot:"right",small:"",flat:""},on:{click:function(e){t.backToTopLevel()}},slot:"right"},[a("q-icon",{attrs:{name:"arrow back"}})],1)],1),t._v(" "),a("q-progress",{ref:"progressBar",staticStyle:{height:"2px"},attrs:{percentage:t.dataProgress,color:"primary"}}),t._v(" "),a("q-collapsible",{attrs:{icon:"people",opened:"",label:t._f("formatNumber")(t.selectedRegion.population)}},[a("div",{staticClass:"card-subtitle"},[a("span",{staticClass:"text-faded"},[t._v("density:")]),t._v(" "),a("span",{staticClass:"text-bold"},[t._v(t._s(t._f("formatDecimal")(t.selectedRegion.density)))]),t._v(" "),a("span",{staticClass:"text-small"},[t._v("p/mi²")])]),t._v(" "),a("q-card-main",{staticClass:"table card data-table"},[a("table",{staticClass:"q-table standard bordered highlight horizontal-separator vertical-separator",staticStyle:{width:"100%"},attrs:{id:"data-table"}},[a("thead",[a("tr",[a("th",{on:{click:function(e){t.sortTableData("regionName")}}},[t._v(t._s(t.regionColumnLabel))]),t._v(" "),a("th",{on:{click:function(e){t.sortTableData("population")}}},[t._v("population")]),t._v(" "),a("th",{on:{click:function(e){t.sortTableData("density")}}},[t._v("density")])])]),t._v(" "),a("tbody",t._l(t.tableData,function(e,o){return a("tr",{key:e.regionId,attrs:{"data-index":o},on:{click:function(e){t.rowClick(o)}}},[a("td",{attrs:{"data-th":"State"}},[t._v(t._s(e.regionName))]),t._v(" "),a("td",{attrs:{"data-th":"Population"}},[t._v(t._s(t._f("formatNumber")(e.population)))]),t._v(" "),a("td",{attrs:{"data-th":"Density"}},[t._v(t._s(t._f("formatDecimal")(e.density)))])])}))])])],1)],1)},n=[],s={render:o,staticRenderFns:n};e.a=s},54:function(t,e,a){"use strict";function o(t){a(282),a(284)}Object.defineProperty(e,"__esModule",{value:!0});var n=a(286),s=a(287),i=a(11),l=o,r=i(n.a,s.a,!1,l,null,null);e.default=r.exports}});