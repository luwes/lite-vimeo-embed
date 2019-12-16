import './lite-vimeo-embed.css';

/**
 * Ported from https://github.com/paulirish/lite-youtube-embed
 *
 * A lightweight vimeo embed. Still should feel the same to the user, just MUCH faster to initialize and paint.
 *
 * Thx to these as the inspiration
 *   https://storage.googleapis.com/amp-vs-non-amp/youtube-lazy.html
 *   https://autoplay-youtube-player.glitch.me/
 *
 * Once built it, I also found these:
 *   https://github.com/ampproject/amphtml/blob/master/extensions/amp-youtube (👍👍)
 *   https://github.com/Daugilas/lazyYT
 *   https://github.com/vb/lazyframe
 */
class LiteVimeoEmbed extends HTMLElement {
    constructor() {
        super();

        // Gotta encode the untrusted value
        // https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#rule-2---attribute-escape-before-inserting-untrusted-data-into-html-common-attributes
        this.videoId = encodeURIComponent(this.getAttribute('videoid'));

        /**
         * Lo, the vimeo placeholder image!  (aka the thumbnail, poster image, etc)
         * There is much internet debate on the reliability of thumbnail URLs. Weak consensus is that you
         * cannot rely on anything and have to use the Vimeo API.
         *
         * TODO: Consider using webp if supported, falling back to jpg
         * TODO: Use embed size for ideal thumb dimensions and quality
         */

        const api = 'https://lite-vimeo-embed.now.sh';
        this._posterUrl = `${api}/thumb/${this.videoId}?mw=1600&mh=900&q=70`;

        // Warm the connection for the poster image
        LiteVimeoEmbed._addPrefetch('preload', this._posterUrl, 'image');
        // TODO: support dynamically setting the attribute via attributeChangedCallback
    }

    connectedCallback() {
        this.style.backgroundImage = `url("${this._posterUrl}")`;

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.classList.add('ltv-playbtn');
        this.appendChild(playBtn);

        // On hover (or tap), warm up the TCP connections we're (likely) about to use.
        this.addEventListener('pointerover', LiteVimeoEmbed._warmConnections, {
            once: true
        });

        // Once the user clicks, add the real iframe and drop our play button
        // TODO: In the future we could be like amp-youtube and silently swap in the iframe during idle time
        //   We'd want to only do this for in-viewport or near-viewport ones: https://github.com/ampproject/amphtml/pull/5003
        this.addEventListener('click', e => this._addIframe());
    }

    // // TODO: Support the the user changing the [videoid] attribute
    // attributeChangedCallback() {
    // }

    /**
     * Add a <link rel={preload | preconnect} ...> to the head
     */
    static _addPrefetch(kind, url, as) {
        const linkElem = document.createElement('link');
        linkElem.rel = kind;
        linkElem.href = url;
        if (as) {
            linkElem.as = as;
        }
        linkElem.crossorigin = true;
        document.head.appendChild(linkElem);
    }

    /**
     * Begin pre-connecting to warm up the iframe load
     * Since the embed's network requests load within its iframe,
     *   preload/prefetch'ing them outside the iframe will only cause double-downloads.
     * So, the best we can do is warm up a few connections to origins that are in the critical path.
     *
     * Maybe `<link rel=preload as=document>` would work, but it's unsupported: http://crbug.com/593267
     * But TBH, I don't think it'll happen soon with Site Isolation and split caches adding serious complexity.
     */
    static _warmConnections() {
        if (LiteVimeoEmbed.preconnected) return;

        // The iframe document and most of its subresources come right off player.vimeo.com
        LiteVimeoEmbed._addPrefetch('preconnect', 'https://player.vimeo.com');
        // Images
        LiteVimeoEmbed._addPrefetch('preconnect', 'https://i.vimeocdn.com');
        // Files .js, .css
        LiteVimeoEmbed._addPrefetch('preconnect', 'https://f.vimeocdn.com');
        // Metrics
        LiteVimeoEmbed._addPrefetch('preconnect', 'https://fresnel.vimeocdn.com');

        LiteVimeoEmbed.preconnected = true;
    }

    _addIframe() {
        const iframeHTML = `
<iframe width="640" height="360" frameborder="0"
  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen
  src="https://player.vimeo.com/video/${this.videoId}?autoplay=1"
></iframe>`;
        this.insertAdjacentHTML('beforeend', iframeHTML);
        this.classList.add('ltv-activated');
    }
}
// Register custome element
customElements.define('lite-vimeo', LiteVimeoEmbed);
