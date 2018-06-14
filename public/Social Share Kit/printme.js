window.addEventListener("load",()=>{
let printme = document.getElementById("printme");
let root = "https://home.miniland1333.com/";
let sendButton = document.createElement("a");
sendButton.href = root+"print/url="+window.location;
sendButton.textContent = "Send to "+root;
printme.appendChild(sendButton);
});