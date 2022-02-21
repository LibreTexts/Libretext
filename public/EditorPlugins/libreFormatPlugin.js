/**
 * @file Defines the customized LibreFormat formatting dropdown for use in
 * LibreTexts CKEditor instances.
 * @author LibreTexts
 */
/* eslint-disable no-param-reassign */
console.log('CKEditor LibreFormat Plugin');
LibreEditor.libreFormat = (libreConfig) => {
  libreConfig.toolbar[2] = ['LibreFormatOptions']; // Override format toolbar group
  const formatOptions = [
    {
      element: 'h2', // HTML element
      value: 'h2', // Internal command name
      text: 'Heading 2', // UI label
      note: '', // Additional UI text (muted)
      keyCode: 50, // Keystroke number
    }, {
      element: 'h3',
      value: 'h3',
      text: 'Heading 3',
      note: '',
      keyCode: 51,
    }, {
      element: 'h4',
      value: 'h4',
      text: 'Heading 4',
      note: '',
      keyCode: 52,
    }, {
      element: 'h5',
      value: 'h5',
      text: 'Heading 5',
      note: 'Box Legends',
      keyCode: 53,
    }, {
      element: 'h6',
      value: 'h6',
      text: 'Heading 6',
      note: 'Intrabox Headings',
      keyCode: 54,
    }, {
      element: 'p',
      value: 'normal',
      text: 'Normal',
      note: '',
      keyCode: 48,
    },
  ];
  /* Add keyboard shortcut definitions */
  CKEDITOR.on('instanceLoaded', (event) => {
    event.editor.lang['mt-a11yhelp'].shortcuts = {
      ...event.editor.lang['mt-a11yhelp'].shortcuts,
      h1: 'Heading 1 (Disabled)',
      h6: 'Heading 6',
    };
  });
  /* Override or register commands */
  CKEDITOR.on('instanceReady', (event) => {
    for (let i = 0, n = formatOptions.length; i < n; i += 1) {
      // eslint-disable-next-line new-cap
      const newCommand = new CKEDITOR.command(event.editor, {
        exec(editorInst) {
          const bookmark = editorInst.getSelection().createBookmarks(true);
          editorInst.elementPath().block.renameNode(formatOptions[i].element);
          editorInst.getSelection().selectBookmarks(bookmark);
        },
      });
      if (formatOptions[i].value !== 'h6') {
        event.editor.commands[formatOptions[i].value] = newCommand;
      } else {
        event.editor.addCommand(formatOptions[i].value, newCommand);
        event.editor.setKeystroke(
          CKEDITOR.CTRL + CKEDITOR.ALT + formatOptions[i].keyCode,
          formatOptions[i].value,
        );
      }
    }
  });
  /* Add dropdown to first Format dropdown menu */
  CKEDITOR.config.toolbarMenu.format[4] = {
    group: 'libreFormat',
    items: {
      LibreFormatOptions: true,
    },
  };
  /* Define plugin */
  CKEDITOR.plugins.add('LibreFormat', {
    require: ['richcombo'],
    /**
     * Add the dropdown to the editor UI.
     *
     * @param {object} editor - The current CKEditor instance.
     */
    init(editor) {
      const pluginLabel = 'Headings';
      const pluginTitle = 'Paragraph Format';
      /* Define the dropdown menu */
      editor.ui.addRichCombo('LibreFormatOptions', {
        label: pluginLabel,
        title: pluginTitle,
        voiceLabel: pluginTitle,
        toolbar: 'insert',
        multiSelect: false,
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
          for (let i = 0, n = formatOptions.length; i < n; i += 1) {
            const optionNote = `${formatOptions[i].note.length > 0 ? `(${formatOptions[i].note})` : ''}`;
            this.add(
              formatOptions[i].value,
              `<span>${formatOptions[i].text} <span style="color: #6c757d; font-size: 12px">${optionNote}</span></span>`,
              formatOptions[i].text,
            );
          }
        },
        /**
         * Execute the previously-defined command to update the block type.
         *
         * @param {string} value - The command name to execute.
         */
        onClick(value) {
          editor.execCommand(value);
        },
        /**
         * When the dropdown renders, start listening to editor selection change events and
         * update the dropdown's current selection/value when triggered.
         */
        onRender() {
          editor.on('selectionChange', (event) => {
            const currentTag = this.getValue();
            const currentElem = event.data?.path?.block?.getName();
            for (let i = 0, n = formatOptions.length; i < n; i += 1) {
              if (currentElem === formatOptions[i].element && currentElem !== currentTag) {
                this.setValue(formatOptions[i].value, formatOptions[i].text);
                return;
              }
            }
            this.setValue(''); // reset value if element isn't in list
          }, this);
        },
      });
    },
  });
  CKEDITOR.config.extraPlugins += `${CKEDITOR.config.extraPlugins === '' ? '' : ','}LibreFormat`;
};
