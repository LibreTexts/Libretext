/**
 * @file Defines reusable "default" page content and layouts.
 * @author LibreTexts <info@libretexts.org>
 */

const dynamicTOCLayout = `
  <p>{{template.DynamicTOC()}}</p>
  <p class="template:tag-insert">
    <em>Tags recommended by the template: </em>
    <a href="#">article:topic</a>
    <a href="#">showtoc:no</a>
  </p>
`;

const dynamicLicensingLayout = `
  <p>{{template.DynamicLicensing()}}</p>
  <p class="template:tag-insert">
    <em>Tags recommended by the template: </em>
    <a href="#">article:topic</a>
    <a href="#">showtoc:no</a>
  </p>
`;

const dynamicDetailedLicensingLayout = `
  <p>{{template.DynamicDetailedLicensing()}}</p>
  <p class="template:tag-insert">
    <em>Tags recommended by the template: </em>
    <a href="#">article:topic</a>
    <a href="#>showtoc:no</a>
  </p>
`;

module.exports = {
  dynamicTOCLayout,
  dynamicLicensingLayout,
  dynamicDetailedLicensingLayout,
};
