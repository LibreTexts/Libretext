/**
 * @file Defines the customized Query templates dropdown for use in
 * LibreTexts CKEditor instances.
 * @author LibreTexts
 */
console.log('CKEditor LibreQuery Plugin');
LibreEditor.libreQuery = (libreConfig) => {
  if (Array.isArray(libreConfig.toolbar[12])) {
    libreConfig.toolbar[12].push('LibreQueryOptions'); // add to toolbar
  }
  /* Define plugin */
  CKEDITOR.plugins.add('LibreQuery', {
    require: ['richcombo'],
    /**
     * Define the query template options, register commands, and add the dropdown to the editor UI.
     *
     * @param {object} editor - The current CKEditor instance.
     */
    init(editor) {
      const pluginTitle = 'Query';
      const queryOptions = [
        {
          template: 'QueryH5P',
          value: 'query-h5p',
          text: 'H5P',
        }, {
          template: 'QueryIMath',
          value: 'query-imath',
          text: 'IMath',
        }, {
          template: 'QueryWebWork',
          value: 'query-webwork',
          text: 'WeBWorK',
        },
      ];
      for (let i = 0, n = queryOptions.length; i < n; i += 1) {
        editor.addCommand(queryOptions[i].value, {
          async exec(editorInst) {
            const errorMsg = 'Sorry, we\'re having trouble loading the template. Please use Elements > Templates to insert.';
            try {
              const templateRequest = new XMLHttpRequest();
              templateRequest.onerror = (err) => {
                console.error(err);
                alert(errorMsg);
              };
              templateRequest.onload = () => {
                console.log(templateRequest.responseText);
                const jsonResponse = JSON.parse(templateRequest.responseText);
                if (typeof (jsonResponse.template) === 'string') {
                  editorInst.insertHtml(jsonResponse.template.trim());
                }
              };
              templateRequest.open('PUT', 'https://api.libretexts.org/endpoint/template');
              templateRequest.setRequestHeader('Content-Type', 'application/json;');
              templateRequest.send(JSON.stringify({
                path: `Template:${queryOptions[i].template}`,
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
      editor.ui.addRichCombo('LibreQueryOptions', {
        label: pluginTitle,
        title: pluginTitle,
        voiceLabel: pluginTitle,
        toolbar: 'insert',
        multiSelect: false,
        className: 'cke_librequery', // CSS defined in Template:Custom/Views/ContentHeader/CSS
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
          for (let i = 0, n = queryOptions.length; i < n; i += 1) {
            this.add(queryOptions[i].value, `<span>${queryOptions[i].text}</span>`, queryOptions[i].text);
          }
        },
        /**
         * Execute the previously-defined command to insert the template.
         *
         * @param {string} value - The command name to execute.
         */
        onClick(value) {
          editor.execCommand(value);
        },
      });
    },
  });
  CKEDITOR.config.extraPlugins += `${CKEDITOR.config.extraPlugins === '' ? '' : ','}LibreQuery`;
};
