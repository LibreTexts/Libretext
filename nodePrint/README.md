NodePrint
===========
NodePrint is a NodeJS application to generate PDFs from LibreTexts using Puppeteer. This dynamic print generation is required in order to properly render Javascript elements such as GLmol.

NodePrint also has a Dockerized version such that it is suitable for Kubernetes load distribution. This allows for the application to autoscale based on load.