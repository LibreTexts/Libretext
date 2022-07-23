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
 
   /**
    * Retrieves a template's contents from the LibreTexts API server and inserts it
    * into the editor content at the current cursor position.
    *
    * @param {string} name - The name of the template to retrieve.
    * @param {CKEDITOR.editor} editorInst - The editor instance to insert the content into.
    */
   async function addTemplate(name, editorInst) {
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
         path: `Template:${name}`,
         subdomain: LibreTexts.extractSubdomain(),
       }));
     } catch (err) {
       alert(errorMsg);
       console.error(err);
     }
   }
 
   /* Define plugin */
   CKEDITOR.plugins.add('LibreQuery', {
     requires: ['menubutton'],
     /**
      * Define the query template options, register commands, and add the dropdown to the editor UI.
      *
      * @param {object} editor - The current CKEditor instance.
      */
     init(editor) {
       const pluginTitle = 'Query';
       const group = 'LibreQueryGroup';
       const menuItems = {
         h5p: {
           label: 'H5P',
           command: 'QueryH5P',
           group,
         },
         imath: {
           label: 'IMath',
           command: 'QueryIMath',
           group,
         },
         webwork: {
           label: 'WeBWorK',
           command: 'QueryWebWork',
           group,
         },
       };
 
       editor.ui.add('LibreQueryOptions', CKEDITOR.UI_MENUBUTTON, {
         icon: 'https://cdn.libretexts.net/Icons/query.ico',
         label: pluginTitle,
         title: pluginTitle,
         voiceLabel: pluginTitle,
         toolbar: 'insert',
         className: 'cke_librequery', // CSS defined in Template:Custom/Views/ContentHeader/CSS
         onMenu() {
           return menuItems;
         }
       });
       editor.addMenuGroup(group);
       editor.addMenuItems(menuItems);
 
       const menuOptions = Object.values(menuItems);
       for (let i = 0, n = menuOptions.length; i < n; i += 1) {
         const command = menuOptions[i].command;
         editor.addCommand(command, {
           exec(editorInst) {
             addTemplate(command, editorInst);
           }
         })
       }
     },
   });
   CKEDITOR.config.extraPlugins += `${CKEDITOR.config.extraPlugins === '' ? '' : ','}LibreQuery`;
 };
 