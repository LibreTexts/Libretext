import React from 'react';
import RemixerFunctions from "../reusableFunctions";


export default class PublishPanel extends React.Component {
  async publish() {
    let subdomain = window.location.origin.split('/')[2].split('.')[0];
    let institution = document.getElementById('LTFormInstitutions');
    if (institution.value === '') {
      if (confirm('Would you like to send an email to info@libretexts.com to request your institution?'))
        window.location.href = 'mailto:info@libretexts.org?subject=Remixer%20Institution%20Request';
      return false;
    }
    let name = document.getElementById('LTFormName').value;
    let college = institution.value;
    if (college.includes('Remixer_University')) {
      college += `/Username:_${document.getElementById('usernameHolder').innerText}`;
      await fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(`${college.replace(window.location.origin, '')}`)) + '/contents?edittime=now', {
        method: 'POST',
        body: '<p>{{template.ShowCategory()}}</p>',
        headers: {'x-deki-token': this.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'},
      });
      await fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(`${college.replace(window.location.origin, '')}`)) + '/tags', {
        method: 'PUT',
        body: '<tags><tag value="article:topic-category"/></tags>',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'x-deki-token': this.keys[subdomain],
          'x-requested-with': 'XMLHttpRequest',
        },
      });
    }
    let url = `${college}/${name.replace(/ /g, '_')}`;
    if (!name) {
      alert('No name provided!');
      return false;
    }
    let response = await LibreTexts.authenticatedFetch(`${college.replace(window.location.origin, '')}/${name}`, 'info', subdomain);
    if (response.ok) {
      alert(`The page ${url} already exists!`);
      return false;
    }
    this.autonumber();
    
    
    const isAdmin = document.getElementById('adminHolder').innerText === 'true';
    const isPro = document.getElementById('proHolder').innerText === 'true';
    const groups = document.getElementById('groupHolder').innerText.toLowerCase();
    const isDemonstration = RemixerFunctions.userPermissions() === 'Workshop';
    let allowed = isAdmin || (isPro && groups.includes('faculty') || isDemonstration);
    if (!allowed) {
      if (confirm('Thanks for trying out the OER Remixer in Demonstration mode!\n\nIf you are interested, contact us to get a free account so that you can publish your own LibreText! Would you like to send an email to info@libretexts.com to get started?'))
        window.location.href = 'mailto:info@libretexts.org?subject=Remixer%20Account%20Request';
      return false;
    }
    let copyMode = document.getElementById('LTFormCopyMode') ? document.getElementById('LTFormCopyMode').value : undefined;
    if (copyMode && copyMode === 'deep' && !isAdmin) {
      alert('Deep copy is restricted to administratiors. Access Denied.');
      document.getElementById('LTFormCopyMode').value = 'transclude';
      return false;
    }
    
    // let subdomain = window.location.origin.split("/")[2].split(".")[0];
    let LTRight = $('#LTRight').fancytree('getTree');
    let RightAlert = $('#LTRightAlert');
    
    RightAlert.text('Beginning Publication process');
    RightAlert.slideDown();
    LTRight.enable(false);
    let tree = LTRight.toDict()[0];
    tree.data = {url: url};
    let destRoot = tree.data.url;
    const results = document.getElementById('copyResults');
    const errors = document.getElementById('copyErrors');
    results.innerText = 'Processing';
    console.log(tree);
    let counter = 0;
    let startedAt = new Date();
    let failedCounter = 0;
    let errorText = '';
    const total = getTotal(tree.children);
    
    await coverPage(tree);
    await doCopy(destRoot, tree.children, 1);
    const text = `${'Finished: ' + counter + ' pages completed' + (failedCounter ? '\\nFailed: ' + failedCounter : '')}`;
    results.innerHTML = `<div><div>${text}</div><a href="${destRoot}" target="_blank">Visit your new LibreText here</a></div>`;
    RightAlert.text(text);
    RightAlert.slideUp();
    LTRight.enable(true);
    
    function decodeHTML(content) {
      let ret = content.replace(/&gt;/g, '>');
      ret = ret.replace(/&lt;/g, '<');
      ret = ret.replace(/&quot;/g, '"');
      ret = ret.replace(/&apos;/g, '\'');
      ret = ret.replace(/&amp;/g, '&');
      return ret;
    }
    
    async function coverPage(tree) {
      let path = tree.data.url.replace(window.location.origin + '/', '');
      let content = '<p>{{template.ShowCategory()}}</p>';
      await fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/contents?abort=exists', {
        method: 'POST',
        body: content,
        headers: {'x-deki-token': this.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'},
      });
      let tags = '<tags><tag value="article:topic-category"/><tag value="coverpage:yes"/></tags>';
      let propertyArray = [putProperty('mindtouch.page#welcomeHidden', true), putProperty('mindtouch.idf#subpageListing', 'simple'), fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/tags', {
        method: 'PUT',
        body: tags,
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'x-deki-token': this.keys[subdomain],
          'x-requested-with': 'XMLHttpRequest',
        },
      })];
      
      await Promise.all(propertyArray);
      await fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/move?title=' + tree.title + '&name=' + encodeURIComponent(tree.title.replace(' ', '_')), {
        method: 'POST',
        headers: {'x-deki-token': this.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'},
      });
      
      async function putProperty(name, value) {
        await fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/properties', {
          method: 'POST',
          body: value,
          headers: {
            'Slug': name,
            'x-deki-token': this.keys[subdomain],
            'x-requested-with': 'XMLHttpRequest',
          },
        });
      }
    }
    
    function getTotal(treeArray) {
      let result = treeArray.length;
      for (let i = 0; i < treeArray.length; i++) {
        let child = treeArray[i].children;
        if (child) {
          result += getTotal(child);
        }
      }
      return result;
    }
    
    async function doCopy(destRoot, tree, depth) {
      
      for (let i = 0; i < tree.length; i++) {
        const child = tree[i];
        child.title = child.title.replace(/[{}]/g, '');
        child.data.padded = child.data.padded ? child.data.padded.replace(/[{}]/g, '') : false;
        let url = destRoot + '/' + (child.data.padded || child.title);
        let path = url.replace(window.location.origin + '/', '');
        if (!child.data.url) { //New Page
          const isGuide = depth === 1;
          await fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/contents?abort=exists', {
            method: 'POST',
            body: isGuide ? '<p>{{template.ShowGuide()}}</p><p className="template:tag-insert"><em>Tags recommended by the template: </em><a href="#">article:topic-guide</a></p>\n'
                : '',
            headers: {'x-deki-token': this.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'},
          });
          let tags = `<tags><tag value="${isGuide ? 'article:topic-guide' : 'article:topic'}"/></tags>`;
          await fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/tags', {
            method: 'PUT',
            body: tags,
            headers: {
              'Content-Type': 'text/xml; charset=utf-8',
              'x-deki-token': this.keys[subdomain],
              'x-requested-with': 'XMLHttpRequest',
            },
          });
          // Title cleanup
          if (child.data.padded) {
            fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/move?title=' + child.title + '&name=' + child.data.padded, {
              method: 'POST',
              headers: {'x-deki-token': this.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'},
            }).then();
          }
          if (isGuide) {
            await Promise.all(
                [putProperty('mindtouch.idf#guideDisplay', 'single', path),
                  putProperty('mindtouch.page#welcomeHidden', true, path),
                  putProperty('mindtouch#idf.guideTabs', '[{"templateKey":"Topic_hierarchy","templateTitle":"Topic hierarchy","templatePath":"MindTouch/IDF3/Views/Topic_hierarchy","guid":"fc488b5c-f7e1-1cad-1a9a-343d5c8641f5"}]', path)]);
            
            let current = window.location.origin.split('/')[2].split('.')[0];
            let headers = {
              headers: {
                'x-deki-token': this.keys['chem'],
              },
            };
            if (current === 'chem')
              headers.headers['x-requested-with'] = 'XMLHttpRequest';
            let image = await fetch('https://chem.libretexts.org/@api/deki/files/239314/default.png?origin=mt-web', headers);
            
            image = await image.blob();
            fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/files/=mindtouch.page%2523thumbnail', {
              method: 'PUT',
              body: image,
              headers: {
                'x-deki-token': this.keys[subdomain],
                'x-requested-with': 'XMLHttpRequest',
              },
            }).then();
          }
        }
        else { //copying from an exisiting source
          // child.path = child.data.url.replace(window.location.origin + "/", ""); //source
          child.path = child.data.path;
          let content;
          //get info
          let info = await LibreTexts.authenticatedFetch(child.path, 'info?dream.out.format=json', child.data.subdomain);
          
          //get Tags
          let copyMode = document.getElementById('LTFormCopyMode') ? document.getElementById('LTFormCopyMode').value : undefined;
          let copyContent = copyMode && copyMode !== 'transclude';
          let response = await LibreTexts.authenticatedFetch(child.path, 'tags?dream.out.format=json', child.data.subdomain);
          let tags = await response.json();
          if (response.ok && tags['@count'] !== '0') {
            if (tags.tag) {
              if (tags.tag.length) {
                tags = tags.tag.map((tag) => tag['@value']);
              }
              else {
                tags = [tags.tag['@value']];
              }
            }
            copyContent = copyContent || tags.includes('article:topic-category') || tags.includes('article:topic-guide');
            if (!copyContent) {
              tags.push('transcluded:yes');
            }
          }
          else {
            tags = ['transcluded:yes'];
          }
          info = await (await info).json();
          
          tags.push(`source-${child.data.subdomain}-${info['@id']}`);
          let tagsHTML = tags.map((tag) => `<tag value="${tag}"/>`).join('');
          tagsHTML = '<tags>' + tagsHTML + '</tags>';
          
          //copy Content
          let current = window.location.origin.split('/')[2].split('.')[0];
          if (copyContent) {
            if (child.data.subdomain === current) {
              content = await LibreTexts.authenticatedFetch(child.path, 'contents?mode=raw', child.data.subdomain, {isLimited: isDemonstration});
              content = await content.text();
              content = content.match(/<body>([\s\S]*?)<\/body>/)[1].replace('<body>', '').replace('</body>', '');
              content = decodeHTML(content);
            }
            else {
              //Get cross content
              content = await fetch('https://api.libretexts.org/endpoint/contents', {
                method: 'PUT',
                body: JSON.stringify({
                  path: child.path,
                  api: 'contents?mode=raw',
                  subdomain: child.data.subdomain,
                }),
              });
              content = await content.text();
              content = content.match(/<body>([\s\S]*?)<\/body>/)[1].replace('<body>', '').replace('</body>', '');
              content = decodeHTML(content);
              
              let copyMode = document.getElementById('LTFormCopyMode') ? document.getElementById('LTFormCopyMode').value : undefined;
              if (copyMode === 'copy') {
                content = content.replace(/\/@api\/deki/g, `https://${child.data.subdomain}.libretexts.org/@api/deki`);
                content = content.replace(/ fileid=".*?"/g, '');
              }
              else if (copyMode === 'deep') {
                //Fancy file transfer VERY SLOW BUT EFFECTIVE
                response = await LibreTexts.authenticatedFetch(child.path, 'files?dream.out.format=json', child.data.subdomain);
                if (response.ok) {
                  let files = await response.json();
                  if (files['@count'] !== '0') {
                    if (files.file) {
                      if (!files.file.length) {
                        files = [files.file];
                      }
                      else {
                        files = files.file;
                      }
                    }
                  }
                  let promiseArray = [];
                  for (let i = 0; i < files.length; i++) {
                    let file = files[i];
                    if (file['@res-is-deleted'] === 'false')
                      promiseArray.push(processFile(file, child, path, file['@id']));
                  }
                  promiseArray = await Promise.all(promiseArray);
                  for (let i = 0; i < promiseArray.length; i++) {
                    if (promiseArray[i]) {
                      content = content.replace(promiseArray[i].original, promiseArray[i].final);
                      content = content.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
                    }
                  }
                }
                
                // Handling of hotlinked images (not attached to the page)
                response = await LibreTexts.authenticatedFetch(path, 'files?dream.out.format=json');
                if (response.ok) {
                  let files = await response.json();
                  if (files['@count'] !== '0') {
                    if (files.file) {
                      if (!files.file.length) {
                        files = [files.file];
                      }
                      else {
                        files = files.file;
                      }
                    }
                  }
                  files = files.map((file) => file['@id']);
                  
                  let promiseArray = [];
                  let images = content.match(/(<img.*?src="\/@api\/deki\/files\/)[\S\s]*?(")/g);
                  if (images) {
                    for (let i = 0; i < images.length; i++) {
                      images[i] = images[i].match(/src="\/@api\/deki\/files\/([\S\s]*?)["/]/)[1];
                      
                      if (!files.includes(images[i])) {
                        promiseArray.push(processFile(null, child, path, images[i]));
                      }
                    }
                    
                    promiseArray = await Promise.all(promiseArray);
                    for (let i = 0; i < promiseArray.length; i++) {
                      if (promiseArray[i]) {
                        content = content.replace(promiseArray[i].original, promiseArray[i].final);
                        content = content.replace(`fileid="${promiseArray[i].oldID}"`, `fileid="${promiseArray[i].newID}"`);
                      }
                    }
                  }
                }
              }
            }
          }
          else if (child.data.subdomain !== current) {
            content = `<p className="mt-script-comment">Cross Library Transclusion</p>

<pre className="script">
template('CrossTransclude/Web',{'Library':'${child.data.subdomain}','PageID':${child.data.id}});</pre>

<div className="comment">
<div className="mt-comment-content">
<p><a href="${child.data.url}">Cross-Library Link: ${child.data.url}</a><br/>source-${child.data.subdomain}-${info['@id']}</p>
</div>
</div>`;
          }
          else {
            content = `<div className="mt-contentreuse-widget" data-page="${child.path}" data-section="" data-show="false">
<pre className="script">
wiki.page("${child.path}", NULL)</pre>
</div>

<div className="comment">
<div className="mt-comment-content">
<p><a href="${child.data.url}">Content Reuse Link: ${child.data.url}</a></p>
</div>
</div>`;
          }
          response = await fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/contents?edittime=now', {
            method: 'POST',
            body: content,
            headers: {'x-deki-token': this.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'},
          });
          if (response.status >= 400) {
            failedCounter++;
          }
          switch (response.status) {
            case 403:
              errorText += '403 Forbidden - User does not have permission to create' + path + '\n';
              break;
            case 500:
              errorText += '500 Server Error ' + path + '\n';
              break;
            case 409:
              errorText += '409 Conflict - Page already exists ' + path + '\n';
              break;
            default:
              errorText += 'Error ' + response.status + ' ' + path + '\n';
              break;
            case 200:
              //copy Tags
              if (tagsHTML) {
                fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/tags', {
                  method: 'PUT',
                  body: tagsHTML,
                  headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'x-deki-token': this.keys[subdomain],
                    'x-requested-with': 'XMLHttpRequest',
                  },
                }).then();
              }
              //Properties
              LibreTexts.authenticatedFetch(child.path, 'properties?dream.out.format=json', child.data.subdomain).then(async (response) => {
                let content = await response.json();
                if (content['@count'] !== '0') {
                  if (content.property) {
                    if (content.property.length) {
                      content = content.property.map((property) => {
                        return {name: property['@name'], value: property['contents']['#text']};
                      });
                    }
                    else {
                      content = [{
                        name: content.property['@name'],
                        value: content.property['contents']['#text'],
                      }];
                    }
                  }
                }
                for (let i = 0; i < content.length; i++) {
                  switch (content[i].name) {
                      //subpageListing check
                    case 'mindtouch.idf#subpageListing':
                      if (tags.includes('article:topic-category')) {
                        fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/properties', {
                          method: 'POST',
                          body: content[i].value,
                          headers: {
                            'Slug': content[i].name,
                            'x-deki-token': this.keys[subdomain],
                            'x-requested-with': 'XMLHttpRequest',
                          },
                        }).then();
                      }
                      break;
                      //subpageListing check
                    case 'mindtouch.idf#guideDisplay':
                      if (tags.includes('article:topic-guide')) {
                        fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/properties', {
                          method: 'POST',
                          body: content[i].value,
                          headers: {
                            'Slug': content[i].name,
                            'x-deki-token': this.keys[subdomain],
                            'x-requested-with': 'XMLHttpRequest',
                          },
                        }).then();
                      }
                      break;
                      //pagecontent
                    case 'mindtouch.page#overview':
                    case 'mindtouch#idf.guideTabs':
                    case 'mindtouch.page#welcomeHidden':
                    case 'mindtouch.idf#product-image': //NEED FILE TRANSFER
                      fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/properties', {
                        method: 'POST',
                        body: content[i].value,
                        headers: {
                          'Slug': content[i].name,
                          'x-deki-token': this.keys[subdomain],
                          'x-requested-with': 'XMLHttpRequest',
                        },
                      }).then();
                      break;
                  }
                }
              });
              
              // Title cleanup
              if (child.data.padded) {
                fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/move?title=' + child.title + '&name=' + child.data.padded, {
                  method: 'POST',
                  headers: {
                    'x-deki-token': this.keys[subdomain],
                    'x-requested-with': 'XMLHttpRequest',
                  },
                }).then();
              }
              
              //Thumbnail
              LibreTexts.authenticatedFetch(child.path, 'files', child.data.subdomain).then(async (response) => {
                if (response.ok) {
                  let files = await response.text();
                  if (files.includes('mindtouch.page#thumbnail') || files.includes('mindtouch.page%23thumbnail')) {
                    let image = await LibreTexts.authenticatedFetch(child.path, 'thumbnail', child.data.subdomain);
                    
                    image = await image.blob();
                    fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/files/=mindtouch.page%2523thumbnail', {
                      method: 'PUT',
                      body: image,
                      headers: {
                        'x-deki-token': this.keys[subdomain],
                        'x-requested-with': 'XMLHttpRequest',
                      },
                    }).then();
                  }
                  else if (tags.includes('article:topic-category') || tags.includes('article:topic-guide')) {
                    let current = window.location.origin.split('/')[2].split('.')[0];
                    let image = await fetch('https://chem.libretexts.org/@api/deki/files/239314/default.png?origin=mt-web', {
                      headers: {
                        'x-deki-token': this.keys['chem'],
                        'x-requested-with': current === 'chem' ? 'XMLHttpRequest' : '',
                      },
                    });
                    
                    image = await image.blob();
                    fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/files/=mindtouch.page%2523thumbnail', {
                      method: 'PUT',
                      body: image,
                      headers: {
                        'x-deki-token': this.keys[subdomain],
                        'x-requested-with': 'XMLHttpRequest',
                      },
                    }).then();
                  }
                }
              });
          }
        }
        
        
        counter++;
        var elapsed = (new Date() - startedAt) / 1000;
        var rate = counter / elapsed;
        var estimated = total / rate;
        var eta = estimated - elapsed;
        var etah = secondsToStr(eta);
        const text = `Processing: ${counter}/${total} pages completed (${Math.round(counter * 100 / total)}%)` + (failedCounter ? '\nFailed: ' + failedCounter : '');
        
        
        results.innerText = `${text} ETA: ${etah}`;
        RightAlert.text(text);
        errors.innerText = errorText;
        if (child.children) {
          await doCopy(url, child.children, depth + 1);
        }
      }
      
      
      async function putProperty(name, value, path) {
        fetch('/@api/deki/pages/=' + encodeURIComponent(encodeURIComponent(path)) + '/properties', {
          method: 'POST',
          body: value,
          headers: {
            'Slug': name,
            'x-deki-token': this.keys[subdomain],
            'x-requested-with': 'XMLHttpRequest',
          },
        });
      }
      
      async function processFile(file, child, path, id) {
        let image, filename;
        if (!file) {
          image = await fetch(`https://${child.data.subdomain}.libretexts.org/@api/deki/files/${id}?dream.out.format=json`, {
            headers: {'x-deki-token': this.keys[child.data.subdomain]},
          });
          filename = await fetch(`https://${child.data.subdomain}.libretexts.org/@api/deki/files/${id}/info?dream.out.format=json`, {
            headers: {'x-deki-token': this.keys[child.data.subdomain]},
          });
          if (!image.ok || !filename.ok)
            return false;
          filename = await filename.json();
          filename = filename['filename'];
          
        }
        else if (!(file.contents['@href'].includes('mindtouch.page#thumbnail') || file.contents['@href'].includes('mindtouch.page%23thumbnail'))) {
          //only files with extensions
          filename = file['filename'];
          image = await LibreTexts.authenticatedFetch(child.path, `files/${filename}`, child.data.subdomain);
          if (!image.ok)
            return false;
        }
        
        
        if (filename) {
          image = await image.blob();
          
          let response = await fetch(`/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}?dream.out.format=json`, {
            method: 'PUT',
            body: image,
            headers: {'x-deki-token': this.keys[subdomain], 'x-requested-with': 'XMLHttpRequest'},
          });
          if (!response.ok)
            return false;
          
          response = await response.json();
          let original = file ? file.contents['@href'].replace(`https://${child.data.subdomain}.libretexts.org`, '') : `/@api/deki/files/${id}`;
          return {
            original: original,
            oldID: id,
            newID: response['@id'],
            final: `/@api/deki/pages/=${encodeURIComponent(encodeURIComponent(path))}/files/${filename}`,
          };
        }
        return false;
      }
    }
  }
  render() {
    return <div>
      Publish panel
    </div>;
  }
}