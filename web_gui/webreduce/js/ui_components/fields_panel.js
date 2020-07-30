import { Vue } from '../libraries.js';
import { Components } from './fields/components.js';
import { filebrowser } from '../filebrowser.js';
import { app } from '../main.js';

let template = `
<div class="fields-panel">
  <h3>{{ module_def.name }}</h3>
	<button @click="help">help</button>
	<fileinfo-ui 
		v-for="(field, index) in fileinfos"
		:key="module_id + ':' + field.id"
		ref="fileinfos"
		:active="active_fileinfo == index"
		:field="field"
    :value="(config || {})[field.id]"
		@activate="activate_fileinfo(index)"
		>

	</fileinfo-ui>
  <div 
		v-for="(field, index) in fields"
		:class="['fields', field.datatype]"
		:key="JSON.stringify(field)"
		ref="fields"
    >
    <component 
			v-bind:is="field.datatype + '-ui'"
			:field="field"
      :value="(config || {})[field.id]"
			class="item-component"
			@change="changed">
    </component>
  </div>
  <div class="control-buttons" style="position:absolute;bottom:10px;">
    <button class="accept config" @click="accept">{{(auto_accept) ? "replot" : "accept"}}</button>
    <button class="clear config" @click="clear">clear</button>
  </div>
</div>
`

export const FieldsPanel = {
  name: "fields-panel",
  components: Components,
  data: () => ({
    module_def: {},
    module_id: null,
    terminal_id: null,
    config: {},
    auto_accept: true,
    active_fileinfo: 0
  }),
  computed: {
    fileinfos() {
      return (this.module_def.fields || []).filter(f => (f.datatype == 'fileinfo'));
    },
    fields() {
      return (this.module_def.fields || []).filter(f => (f.datatype != 'fileinfo'));
    }
  },
  methods: {
    help() {
      let helpwindow = window.open("", "help", "location=0,toolbar=no,menubar=no,scrollbars=yes,resizable=yes,width=960,height=480");
      helpwindow.document.title = "Web reduction help";
      helpwindow.document.write(this.module_def.description);
      helpwindow.document.close();
      if (helpwindow.MathJax) {
        helpwindow.MathJax.Hub.Queue(["Typeset", helpwindow.MathJax.Hub]);
      }
    },
    changed(id, value) {
      if (app.settings.auto_accept_changes) {
        this.$set(this.config, id, value);
      }
    },
    type_count(field) {
      this.datatype_count[field.datatype] = this.datatype_count[field.datatype] || 0;
      return this.datatype_count[field.datatype]++;
    },
    field_value(field_id) {
      return config[field_id];
    },
    activate_fileinfo(index = null) {
      if (index != null) {
        this.active_fileinfo = index;
      }
      let active_field = this.fileinfos[this.active_fileinfo];
      let value = (active_field) ? (this.config[active_field.id] || []) : [];
      this.fileinfoChanged(value);
    },
    update_fileinfo(value) {
      let active_field = this.fileinfos[this.active_fileinfo];
      if (active_field) {
        this.$set(this.config, active_field.id, value);
      }
    },
    accept() {
    },
    clear() {
      if (this.config) { delete this.config }
      this.$emit("clear");
    },
    fileinfoChanged(value) {
      // initialize this callback later?
      // if there is a terminal selected, let that be plotted, 
      // else plot the loaded files:
      let no_terminal_selected = (this.terminal_id == null);
      filebrowser.fileinfoUpdate(value, no_terminal_selected);
    }
  },
  beforeUpdate: function () {
    // reset the active file picker to the first one.
    this.active_fileinfo = 0;
  },
  template
}

export const fieldUI = {};

fieldUI.create_instance = function (target_id) {
  let target = document.getElementById(target_id);
  const FieldsPanelClass = Vue.extend(FieldsPanel);
  this.instance = new FieldsPanelClass({
    data: () => ({
      module_def: {},
      config: {},
      auto_accept: true
    })
  }).$mount(target);
}