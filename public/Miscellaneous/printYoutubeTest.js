
if (!window["youtubeIFrame"]) {
	window["youtubeIframe"] = true;

	window.addEventListener("load", () => {

		let candidates = $("iframe");
			for (let i = 0; i < candidates.length; i++) {
			if (iframe && iframe.src && !iframe.classList.contains("youtubeIFrame")) {
				let videoID = iframe.src.match(/^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/);
				if(videoID)
				if (iframe.src.includes("www.youtube.com") || iframe.src.includes("www.youtube-nocookie.com")) {
					videoID = videoID[2];
					iframe.src = iframe.src.replace('www.youtube.com','www.youtube-nocookie.com');
					iframe.classList.add("youtubeIFrame");
					let youtubeImgContainer = document.createElement("a");
					youtubeImgContainer.innerHTML = `<img class="youtubeImage" src="https://img.youtube.com/vi/${videoID}/0.jpg`
					let link = "https://www.youtube.com/watch?v="+videoID;
					youtubeImgContainer.href = link;

					let qr_img = document.getElementById("qrcode");

					youtubeImgContainer.classList.add("youtubeImageContainer");
					$(youtubeImgContainer).insertAfter(iframe);

					let extraDiv = document.createElement("div");
					extraDiv.innerHTML = '<button class="ytp-large-play-button ytp-button" aria-label="Play"><svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path class="ytp-large-play-button-bg" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z" fill="#212121" fill-opacity="0.8"></path><path d="M 45,24 27,14 27,34" fill="#fff"></path></svg></button>';
					// $(extraDiv).insertAfter(youtubeImgContainer);
					youtubeImgContainer.appendChild(extraDiv);
				}
			}
		}
	});
}

/*
let link = "https://www.youtube.com/watch?v="+videoID;

let qr_img = document.getElementById("qrcode");

console.log("yes");

QRCode.toDataURL(link).then(url => {
	console.log(link);
	qr_img.src = url;
});*/



/*
class autoqr {
	constructor(qr){
	this.qrcode = qr;
	}
}

					let qrImage = document.createElement("img");
					qrImage.innerHTML = <img class = "qrimage" src = "$.getScript('https://awesomefiles.libretexts.org/Miscellaneous/qrcode.js', function(
		{newQR = new autoqr(QRCode.toDataURL("https://www.youtube.com/watch?v=hy8d8nXa-Jw").then(i => document.getElementById("qrcode").src=i));
		document.getElementByID("QRGen").innerHTML = autoqr
	})
);>
*/

//
// let qrImage = document.createElement("img");




				 // QRCode.toDataURL("https://www.youtube.com/watch?v=hy8d8nXa-Jw").then(i => document.getElementById("qrcode").src=i)
				 //
					// QRCode.toDataURL("stuff2")
