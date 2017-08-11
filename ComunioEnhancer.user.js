// ==UserScript==
// @name         Comunio Enhancer
// @namespace    http://tampermonkey.net/
// @downloadURL  https://github.com/traschke/comunio-enhacer-userscript/raw/master/ComunioEnhancer.user.js
// @version      0.1
// @description  Useful extension for comunio.de
// @author       Timo Raschke
// @match        http://www.comunio.de/*
// @grant        none
// ==/UserScript==

(() => {
    console.log('Welcome to Comunio Enhancer!');
    console.log('You are on page', window.location.pathname);

    let pathname;

    let numberWithCommas = (x) => {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    let exchangeMarket = () => {
        console.log('Waiting for market being loaded...');
        checkIsAvailable('exchangemarket_purchase')
        .then(() => {
            console.log('Market loaded!');
            exchangeMarketTools.updateExchangeMarket();
        });
    };

    let exchangeMarketTools = {
        updateExchangeMarket: () => {
            exchangeMarketTools.getTradablesMap()
                .then(exchangeMarketTools.calcGewinn)
                .then(exchangeMarketTools.markUsers)
                .then(exchangeMarketTools.updateHrefsToComstats)
                .then(exchangeMarketTools.addComAnalyticsLink);
        },
        getTradablesMap: () => {
            return new Promise((resolve, reject) => {
                let tradablesMap = new Map();
                let tradables = $('.market .tradable');
                $.each(tradables, function (index, tradable) {
                    let playerNameEle = $(tradable).find('.name')[0];
                    let originalHref = $(playerNameEle).attr("href");
                    let playerId = originalHref.split('-')[1];
                    tradablesMap.set(playerId, tradable);
                });
                return resolve(tradablesMap);
            });
        },
        addComAnalyticsLink: (tradablesMap) => {
            return new Promise((resolve, reject) => {
                tradablesMap.forEach((tradable, id, map) => {
                    let playerNameEle = $(tradable).find('.name')[0];
                    let playerNameEleParent = $(playerNameEle).parent();
                    let divii = $('<div></div>');
                    let comAnalyticsEntry = $('<a href="http://com-analytics.de/player/' + id + '"><img src="http://com-analytics.de/favicon.ico"></a>');
                    $(divii).append($(comAnalyticsEntry));
                    $(playerNameEleParent).append($(divii));
                    $(comAnalyticsEntry).click((event) => {
                        event.preventDefault();
                        let newWindow = window.open($(comAnalyticsEntry).attr('href'),'','height=630,width=720');
                        if (window.focus) {
                            newWindow.focus();
                        }
                        return false;
                    });
                });
                return resolve(tradablesMap);
            });
        },
        calcGewinn: (tradablesMap) => {
            return new Promise((resolve, reject) => {
                tradablesMap.forEach((tradable, id, map) => {
                    let quoteElems = $(tradable).find('.quote');
                    let recommendElems = $(tradable).find('.recommend');

                    let quote = parseInt(quoteElems[0].innerHTML.replace(/\./g,''));
                    let recommend = parseInt(recommendElems[0].innerHTML.replace(/\./g,''));

                    let gewinn = quote - recommend;

                    let marketvalue = $(tradable).find('.marketvalue')[0];
                    var label = $(tradable).find('.label')[0];

                    let color = '#000';

                    if (gewinn > 0) {
                        color = '#8CBF3F';
                    } else if (gewinn < 0) {
                        color = '#E9322E';
                    }

                    if (gewinn !== 0) {
                        gewinn = numberWithCommas(gewinn)
                    } else {
                        gewinn = '-';
                    }
                    $('<div class="recommend" style="color: ' + color + '">' + gewinn + '</div>').appendTo(marketvalue);
                    $('<div>Gewinn</div>').appendTo(label);
                });
                return resolve(tradablesMap);
            });
        },
        markUsers: (tradablesMap) => {
            return new Promise((resolve, reject) => {
                tradablesMap.forEach((tradable, id, map) => {
                    let username = $(tradable).find('.username-name')[0].innerText;

                    if (username.includes('(Du)')) {
                        $(tradable).css('background', '#94c4d1');
                    } else if (username !== 'Computer') {
                        $(tradable).css('background', '#dbbfbe');
                    }
                });
                return resolve(tradablesMap);
            });
        },
        updateHrefsToComstats: (tradablesMap) => {
            return new Promise((resolve, reject) => {
                tradablesMap.forEach((tradable, id, map) => {
                    let playerNameEle = $(tradable).find('.name')[0];
                    $(playerNameEle).attr('href', 'http://stats.comunio.de/profil.php?id=' + id);
                    $(playerNameEle).click((event) => {
                        event.preventDefault();
                        let newWindow = window.open($(playerNameEle).attr('href'),'','height=630,width=600');
                        if (window.focus) {
                            newWindow.focus();
                        }
                        return false;
                    });
                });
                return resolve(tradablesMap);
            });
        }
    };

    let checkIsRemoved = (ele) => {
        return new Promise((resolve, reject) => {
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
        return new Promise((resolve, reject) => {
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
