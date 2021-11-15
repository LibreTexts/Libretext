window.addEventListener("load", libreNavButtons);

function libreNavButtons() {
	if (window !== window.top) // don't show in iFrame
		return;

	if ($('#pageTagsHolder').text().includes('"article:topic"') || $('#pageTagsHolder').text().includes('"article:topic-guide"')) {

		let prevArticle = $("a.mt-icon-previous-article").first();
		let nextArticle = $("a.mt-icon-next-article").first();

		let prevPage = prevArticle.attr('href');
		let prevPageTitle = prevArticle.attr('title');

		let nextPage = nextArticle.attr('href');
		let nextPageTitle = nextArticle.attr('title');

		let backButton = document.createElement('a');
		let backTitle = document.createElement('div');
		let backTitleText = document.createElement('span');
		let nextButton = document.createElement('a');
		let nextTitle = document.createElement('div');
		let nextTitleText = document.createElement('span');

		backButton.href = prevPage;
		backButton.setAttribute('id', 'backButton');
		backButton.className = 'libreNavBtn';
		backButton.setAttribute('aria-label', prevPageTitle);

		backTitle.setAttribute('id', 'backTitle');
		backTitle.className = 'libreNavTitle';

		backTitleText.setAttribute('id', 'backTitleText');
		backTitleText.className = 'libreNavText';
		backTitleText.innerText = prevPageTitle;

		nextButton.href = nextPage;
		nextButton.setAttribute('id', 'nextButton');
		nextButton.className = 'libreNavBtn';
		nextButton.setAttribute('aria-label', nextPageTitle);

		nextTitle.setAttribute('id', 'nextTitle');
		nextTitle.className = 'libreNavTitle';

		nextTitleText.setAttribute('id', 'nextTitleText');
		nextTitleText.className = 'libreNavText';
		nextTitleText.innerText = nextPageTitle;

		$(backButton).html(`<i id='backButtonIcon' class='libreNavIcon fa fa-arrow-left'></i>`);
		$(nextButton).html(`<i id='nextButtonIcon' class='libreNavIcon fa fa-arrow-right'></i>`);

		$(backTitle).append(backTitleText);
		$(nextTitle).append(nextTitleText);

		$(backButton).hover(function () {
			$(backTitle).css('display', 'flex').fadeIn(200);
		}, function () {
			$(backTitle).css('display', 'none').fadeOut(200);
		});

		$(nextButton).hover(function () {
			$(nextTitle).css('display', 'flex').fadeIn(200);
		}, function () {
			$(nextTitle).css('display', 'none').fadeOut(200);
		});

		document.body.append(backButton);
		document.body.append(backTitle);
		document.body.append(nextButton);
		document.body.append(nextTitle);
	}
}
