/**
 * @file Defines the customized LibreBoxes template dropdown for use in
 * LibreTexts CKEditor instances.
 * @author LibreTexts
 */
console.log('CKEditor LibreBoxes Plugin');
LibreEditor.libreBoxes = (libreConfig) => {
  if (Array.isArray(libreConfig.toolbar[10])) {
    libreConfig.toolbar[10].push('LibreBoxesOptions'); // add to toolbar
  }
  /* Define plugin */
  CKEDITOR.plugins.add('LibreBoxes', {
    require: ['richcombo'],
    /**
     * Define the box options, register commands, and add the dropdown to the editor UI.
     *
     * @param {object} editor - The current CKEditor instance.
     */
    init(editor) {
      const pluginTitle = 'Boxes';
      const boxOptions = [
        {
          template: 'BoxDefinition',
          value: 'box-definition',
          text: 'Definition',
        }, {
          template: 'BoxEmphasis',
          value: 'box-emphasis',
          text: 'Emphasis',
        }, {
          template: 'BoxExample',
          value: 'box-example',
          text: 'Example',
        }, {
          template: 'BoxExercise',
          value: 'box-exercise',
          text: 'Exercise',
        }, {
          template: 'BoxInteractive',
          value: 'box-interactive',
          text: 'Interactive',
        }, {
          template: 'BoxNote',
          value: 'box-note',
          text: 'Note',
        }, {
          template: 'BoxObjectives',
          value: 'box-objectives',
          text: 'Objectives',
        }, {
          template: 'BoxQuery',
          value: 'box-query',
          text: 'Query',
        }, {
          template: 'BoxTheorem',
          value: 'box-theorem',
          text: 'Theorem',
        }, {
          template: 'BoxWarning',
          value: 'box-warning',
          text: 'Warning',
        },
      ];
      for (let i = 0, n = boxOptions.length; i < n; i += 1) {
        editor.addCommand(boxOptions[i].value, {
          async exec(editorInst) {
            const errorMsg = 'Sorry, we\'re having trouble loading the template. Please use Elements > Templates to insert.';
            try {
              const templateRequest = new XMLHttpRequest();
              templateRequest.onerror = (err) => {
                console.error(err);
                alert(errorMsg);
              };
              templateRequest.onload = () => {
                const jsonResponse = JSON.parse(templateRequest.responseText);
                if (typeof (jsonResponse.template) === 'string') {
                  editorInst.insertHtml(jsonResponse.template.trim());
                }
              };
              templateRequest.open('PUT', 'https://api.libretexts.org/endpoint/template');
              templateRequest.setRequestHeader('Content-Type', 'application/json;');
              templateRequest.send(JSON.stringify({
                path: `Template:${boxOptions[i].template}`,
                subdomain: LibreTexts.extractSubdomain(),
              }));
            } catch (err) {
              alert(errorMsg);
              console.error(err);
            }
          },
        });
      }
      /* Define the dropdown menu */
      editor.ui.addRichCombo('LibreBoxesOptions', {
        label: pluginTitle,
        title: pluginTitle,
        voiceLabel: pluginTitle,
        toolbar: 'insert',
        multiSelect: false,
        className: 'cke_librebox', // CSS defined in Template:Custom/Views/ContentHeader/CSS
        panel: {
          css: [editor.config.contentsCss, CKEDITOR.skin.getPath('editor')],
          voiceLabel: pluginTitle,
          attributes: {
            'aria-label': pluginTitle,
          },
        },
        /**
         * Insert the format options into the dropdown menu.
         */
        init() {
          this.startGroup(pluginTitle);
          for (let i = 0, n = boxOptions.length; i < n; i += 1) {
            this.add(boxOptions[i].value, `<span>${boxOptions[i].text}</span>`, boxOptions[i].text);
          }
        },
        /**
         * Execute the previously-defined command to insert the box block.
         *
         * @param {string} value - The command name to execute.
         */
        onClick(value) {
          editor.execCommand(value);
        },
      });
    },
  });
  CKEDITOR.config.extraPlugins += `${CKEDITOR.config.extraPlugins === '' ? '' : ','}LibreBoxes`;
};
