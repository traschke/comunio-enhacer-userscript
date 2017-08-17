// ==UserScript==
// @name         Comunio Enhancer
// @namespace    https://github.com/traschke/comunio-enhacer-userscript/
// @downloadURL  https://github.com/traschke/comunio-enhacer-userscript/raw/master/ComunioEnhancer.user.js
// @version      0.2.1
// @description  Useful extension for comunio.de
// @author       Timo Raschke
// @match        http://www.comunio.de/*
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle('                                       \
.enhance-money-win {                                \
    color: #8CBF3F;                                 \
}                                                   \
                                                    \
.enhance-money-lose {                               \
    color: #E9322E                                  \
}                                                   \
                                                    \
.enhance-tradable-you {                             \
    background-color: #94c4d1 !important;           \
}                                                   \
                                                    \
.enhance-tradable-other {                           \
    background-color: #dbbfbe !important;           \
}                                                   \
');

(() => {
	console.log('Welcome to Comunio Enhancer!');
	console.log('You are on page', window.location.pathname);

	let pathname;

	let numberWithCommas = (x) => {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
	};

	class ExchangeMarket {

		constructor() { }

		initialize() {
			return new Promise(resolve => {
				this.getTradables().then(data => {
					this.tradables = data;
					resolve();
				});
			});
		}

		updateExchangeMarket() {
			return this.initialize()
				.then(this.addIconBoxToTradables.bind(this))
				.then(this.replaceTradablesHrefWithComstats.bind(this))
				.then(this.addComAnalyticsToTradablesIconBox.bind(this))
				.then(this.calculateWinMargin.bind(this))
				.then(this.markPlayers.bind(this));
		}

		getTradables() {
			return new Promise(resolve => {
				let tradablesMap = new Map();
				let tradables = $('.market .tradable');
				$.each(tradables, function (index, tradable) {
					let playerNameEle = $(tradable).find('.name')[0];
					let originalHref = $(playerNameEle).attr('href');
					let playerId = originalHref.split('-')[1];
					tradablesMap.set(playerId, tradable);
				});
				return resolve(tradablesMap);
			});
		}

		addIconBoxToTradables() {
			let actions = Array.from(this.tradables).map(tradable => {
				return new Promise(resolve => {
					let playerNameEle = $(tradable[1]).find('.name')[0];
					let playerNameEleParent = $(playerNameEle).parent();
					let divii = $('<div class="enhance-iconbox"></div>');
					$(playerNameEleParent).append($(divii));
					return resolve();
				});
			});

			return Promise.all(actions);
		}

		replaceTradablesHrefWithComstats() {
			let actions = Array.from(this.tradables).map(tradable => {
				let playerNameEle = $(tradable[1]).find('.name')[0];
				$(playerNameEle).attr('href', 'http://stats.comunio.de/profil.php?id=' + tradable[0]);
				return Helper.addPopupEvent(playerNameEle, 600, 630);
			});
			return Promise.all(actions);
		}

		addComAnalyticsToTradablesIconBox() {
			let actions = Array.from(this.tradables).map(tradable => {
				let comAnalyticsEntry = $('<a href="http://com-analytics.de/player/' + tradable[0] + '" title="ComAnalytics"><img src="http://com-analytics.de/favicon.ico" alt="ComAnalytics"></a>');
				let iconbox = $(tradable[1]).find('.enhance-iconbox');
				$(iconbox).append($(comAnalyticsEntry));
				return Helper.addPopupEvent(comAnalyticsEntry, 720, 630);
			});
			return Promise.all(actions);
		}

		calculateWinMargin() {
			let actions = Array.from(this.tradables).map(tradable => {
				return new Promise(resolve => {
					let quoteElems = $(tradable[1]).find('.quote');
					let recommendElems = $(tradable[1]).find('.recommend');

					let quote = parseInt(quoteElems[0].innerHTML.replace(/\./g, ''));
					let recommend = parseInt(recommendElems[0].innerHTML.replace(/\./g, ''));

					let winMargin = quote - recommend;

					let marketvalue = $(tradable[1]).find('.marketvalue')[0];
					let label = $(tradable[1]).find('.label')[0];

					if (winMargin !== 0) {
						winMargin = numberWithCommas(winMargin);
					} else {
						winMargin = '-';
					}
					let winElement = $('<div>' + winMargin + '</div>');
					$(winElement).addClass('recommend');

					if (winMargin > 0) {
						$(winElement).addClass('enhance-money-win');
					} else if (winMargin < 0) {
						$(winElement).addClass('enhance-money-lose');
					}

					$(winElement).appendTo(marketvalue);
					$('<div>Gewinn</div>').appendTo(label);

					return resolve();
				});
			});
			return Promise.all(actions);
		}

		markPlayers() {
			let actions = Array.from(this.tradables).map(tradable => {
				return new Promise(resolve => {
					let username = $(tradable[1]).find('.username-name')[0].innerText;

					if (username.includes('(Du)')) {
						$(tradable[1]).addClass('enhance-tradable-you');
					} else if (username !== 'Computer') {
						$(tradable[1]).addClass('enhance-tradable-other');
					}

					return resolve();
				});
			});
			return Promise.all(actions);
		}
	}

	let Helper = {
		addPopupEvent(element, width, height) {
			return new Promise(resolve => {
				$(element).click((event) => {
					event.preventDefault();
					let newWindow = window.open($(element).attr('href'), '', 'height=' + height + ',width=' + width);
					if (window.focus) {
						newWindow.focus();
					}
					return false;
				});
				return resolve();
			});
		}
	};

	let exchangeMarket = () => {
		console.log('Waiting for market being loaded...');
		checkIsAvailable('exchangemarket_purchase')
			.then(() => {
				console.log('Market loaded!');
				let exchangeMarket = new ExchangeMarket();
				exchangeMarket.updateExchangeMarket();
			});
	};

	let checkIsRemoved = (ele) => {
		return new Promise(resolve => {
			let appearsInterval = setInterval(() => {
				if ($(ele).length) {
					clearInterval(appearsInterval);
					let removedInterval = setInterval(() => {
						if (!$(ele).length) {
							clearInterval(removedInterval);
							resolve();
						}
					}, 100);
				}
			}, 100);
		});
	};

	let checkIsAvailable = (ele) => {
		return new Promise(resolve => {
			let appearsInterval = setInterval(() => {
				if ($(ele).length) {
					clearInterval(appearsInterval);
					resolve();
				}
			}, 100);
		});
	};

	// Check for url changes...
	checkIsRemoved('.isLoading')
		.then(() => {
			setInterval(() => {
				if (pathname !== window.location.pathname) {
					pathname = window.location.pathname;
					switch (pathname) {
					case '/exchangemarket':
						exchangeMarket();
						break;
					}
				}
			}, 1000);
		});
})();
