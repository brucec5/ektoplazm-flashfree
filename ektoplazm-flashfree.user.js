// ==UserScript==
// @name        Ektoplazm Noflash
// @namespace   polyfloyd
// @include     https://ektoplazm.com/*
// @version     23-10-2014
// @grant       none
// ==/UserScript==

(function() {
    // Stole this from stackoverflow, lol.
    // Basically, this overcomes some issue where atob chokes on certain base64-encoded strings.
    // This one doesn't choke (as far as I'm aware), so I'm using it.
    var decodeBase64 = function(s) {
        var e={},i,b=0,c,x,l=0,a,r='',w=String.fromCharCode,L=s.length;
        var A="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for(i=0;i<64;i++){e[A.charAt(i)]=i;}
        for(x=0;x<L;x++){
            c=e[s.charAt(x)];b=(b<<6)+c;l+=6;
            while(l>=8){((a=(b>>>(l-=8))&0xff)||(x<(L-2)))&&(r+=w(a));}
        }
        return r;
    };

    Array.prototype.forEach.call(document.getElementsByClassName('post'), function(post) {
        var playerScript = post.querySelector('.audioplayer_container ~ p script')
        if (playerScript === null) {
            return;
        }

        var source = playerScript.innerHTML
        var encoded = source.match(/soundFile:\s*\"([^"]+)"/)[1]
        var decoded = decodeBase64(encoded)

        var store = {
            current: null,
            playing: false,
            files: decoded.split(',')
        }

        var mainAudio = document.createElement('audio')
        mainAudio.setAttribute('controls', 'controls')
        mainAudio.setAttribute('preload', 'none')
        mainAudio.style.width = '100%'

        var loadTrackAtIndex = (index) => {
            console.log(`Loading ${store.files[index]} into the player`)
            mainAudio.src = store.files[index]
            store.playing = true
            store.current = index

            mainAudio.pause()
            mainAudio.load()
            mainAudio.play()

            store.playing = true
            store.current = index

            console.log(store)
        }

        var renderButtonStates = () => {
            playButtons.forEach((button, index) => {
                if (index === store.current) {
                    button.style.color = "#F57A78"
                } else {
                    button.style.color = null
                }

                if (store.playing && index === store.current) {
                    button.textContent = "⏸ "
                } else {
                    button.textContent = "► "
                }
            });
        }

        var updatePlayerState = () => {
            if (store.playing) {
                mainAudio.play()
            } else {
                mainAudio.pause()
            }
        }

        mainAudio.addEventListener('ended', event => {
            let nextIndex = store.current + 1
            if (nextIndex >= store.files.length) {
                store.current = null
                console.log("Done with the playlist!")
            } else {
                loadTrackAtIndex(nextIndex)
            }
        })

        mainAudio.addEventListener('play', event => {
            store.playing = true
            renderButtonStates()
        })

        mainAudio.addEventListener('pause', event => {
            store.playing = false
            renderButtonStates()
        })

        var trackNumberElements = post.querySelector('.tl').getElementsByClassName('n')
        var playButtons = Array.prototype.map.call(trackNumberElements, (trackNumberElement, trackIndex) => {
            var button = document.createElement('a')
            button.href = "#"
            button.addEventListener('click', event => {
                event.preventDefault()
                if (trackIndex === store.current) {
                    store.playing = !store.playing
                    updatePlayerState()
                } else {
                    loadTrackAtIndex(trackIndex)
                }
            })

            trackNumberElement.parentNode.insertBefore(button, trackNumberElement)
            return button
        })
        renderButtonStates()

        var flashContainer = post.querySelector('.audioplayer_container')
        post.querySelector('.audioplayer_container').innerHTML = ''
        flashContainer.parentNode.insertBefore(mainAudio, flashContainer.nextSibling)
    });
})();
