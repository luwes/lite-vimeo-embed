const style = document.head.appendChild(document.createElement('style'));
style.textContent = /*css*/`
  lite-vimeo {
    font-size: 10px;
    background-color: #000;
    position: relative;
    display: block;
    contain: content;
    background-position: center center;
    background-size: cover;
    cursor: pointer;
  }

  /* gradient, vimeo doesn't have this */

  /*lite-vimeo::before {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAADGCAYAAAAT+OqFAAAAdklEQVQoz42QQQ7AIAgEF/T/D+kbq/RWAlnQyyazA4aoAB4FsBSA/bFjuF1EOL7VbrIrBuusmrt4ZZORfb6ehbWdnRHEIiITaEUKa5EJqUakRSaEYBJSCY2dEstQY7AuxahwXFrvZmWl2rh4JZ07z9dLtesfNj5q0FU3A5ObbwAAAABJRU5ErkJggg==);
      background-position: top;
      background-repeat: repeat-x;
      height: 60px;
      padding-bottom: 50px;
      width: 100%;
      transition: all 0.2s cubic-bezier(0, 0, 0.2, 1);
  }*/

  /* responsive iframe with a 16:9 aspect ratio
      thanks https://css-tricks.com/responsive-iframes/
  */
  lite-vimeo::after {
    content: "";
    display: block;
    padding-bottom: calc(100% / (16 / 9));
  }

  lite-vimeo > iframe {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  /* play button */
  lite-vimeo > .ltv-playbtn {
    width: 6.5em;
    height: 4em;
    background: rgba(23, 35, 34, .75);
    z-index: 1;
    opacity: 0.8;
    border-radius: .5em; /* TODO: Consider replacing this with YT's actual svg. Eh. */
    transition: all 0.2s cubic-bezier(0, 0, 0.2, 1);
    outline: 0;
    border: 0;
    cursor: pointer;
  }

  lite-vimeo:hover > .ltv-playbtn {
    background-color: rgb(0, 173, 239);
    opacity: 1;
  }

  /* play button triangle */
  lite-vimeo > .ltv-playbtn::before {
    content: '';
    border-style: solid;
    border-width: 10px 0 10px 20px;
    border-color: transparent transparent transparent #fff;
  }

  lite-vimeo > .ltv-playbtn, lite-vimeo > .ltv-playbtn::before {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate3d(-50%, -50%, 0);
  }

  /* Post-click styles */
  lite-vimeo.ltv-activated {
    cursor: unset;
  }

  lite-vimeo.ltv-activated::before, lite-vimeo.ltv-activated > .ltv-playbtn {
    opacity: 0;
    pointer-events: none;
  }
`;

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
class LiteVimeo extends HTMLElement {

  connectedCallback() {
    // Gotta encode the untrusted value
    // https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#rule-2---attribute-escape-before-inserting-untrusted-data-into-html-common-attributes
    this.videoId = encodeURIComponent(this.getAttribute('videoid'));

    /**
     * Lo, the vimeo placeholder image!  (aka the thumbnail, poster image, etc)
     * We have to use the Vimeo API.
     */
    let { width, height } = getThumbnailDimensions(this.getBoundingClientRect());
    const devicePixelRatio = window.devicePixelRatio || 1;
    width *= devicePixelRatio;
    height *= devicePixelRatio;

    let thumbnailUrl = `https://lite-vimeo-embed.now.sh/thumb/${this.videoId}`;
    thumbnailUrl += `.${canUseWebP() ? 'webp' : 'jpg'}`;
    thumbnailUrl += `?mw=${width}&mh=${height}&q=${devicePixelRatio > 1 ? 70 : 85}`;

    this.style.backgroundImage = `url("${thumbnailUrl}")`;

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.classList.add('ltv-playbtn');
    this.appendChild(playBtn);

    // On hover (or tap), warm up the TCP connections we're (likely) about to use.
    this.addEventListener('pointerover', LiteVimeo._warmConnections, {
      once: true
    });

    // Once the user clicks, add the real iframe and drop our play button
    // TODO: In the future we could be like amp-youtube and silently swap in the iframe during idle time
    //   We'd want to only do this for in-viewport or near-viewport ones: https://github.com/ampproject/amphtml/pull/5003
    this.addEventListener('click', () => this._addIframe());
  }

  // // TODO: Support the the user changing the [videoid] attribute
  // attributeChangedCallback() {
  // }

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
    if (LiteVimeo.preconnected) return;

    // The iframe document and most of its subresources come right off player.vimeo.com
    addPrefetch('preconnect', 'https://player.vimeo.com');
    // Images
    addPrefetch('preconnect', 'https://i.vimeocdn.com');
    // Files .js, .css
    addPrefetch('preconnect', 'https://f.vimeocdn.com');
    // Metrics
    addPrefetch('preconnect', 'https://fresnel.vimeocdn.com');

    LiteVimeo.preconnected = true;
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

customElements.define('lite-vimeo', LiteVimeo);


/**
 * Add a <link rel={preload | preconnect} ...> to the head
 */
export function addPrefetch(kind, url, as) {
  const linkElem = document.createElement('link');
  linkElem.rel = kind;
  linkElem.href = url;
  if (as) {
    linkElem.as = as;
  }
  linkElem.crossorigin = true;
  document.head.appendChild(linkElem);
}

export function canUseWebP() {
  var elem = document.createElement('canvas');

  if (elem.getContext && elem.getContext('2d')) {
    // was able or not to get WebP representation
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // very old browser like IE 8, canvas not supported
  return false;
}

/**
 * Get the thumbnail dimensions to use for a given player size.
 *
 * @param {Object} options
 * @param {number} options.width The width of the player
 * @param {number} options.height The height of the player
 * @return {Object} The width and height
 */
export function getThumbnailDimensions({
  width,
  height
}) {
  let roundedWidth = width;
  let roundedHeight = height;

  // If the original width is a multiple of 320 then we should
  // not round up. This is to keep the native image dimensions
  // so that they match up with the actual frames from the video.
  //
  // For example 640x360, 960x540, 1280x720, 1920x1080
  //
  // Round up to nearest 100 px to improve cacheability at the
  // CDN. For example, any width between 601 pixels and 699
  // pixels will render the thumbnail at 700 pixels width.
  if (roundedWidth % 320 !== 0) {
    roundedWidth = Math.ceil(width / 100) * 100;
    roundedHeight = Math.round((roundedWidth / width) * height);
  }

  return {
    width: roundedWidth,
    height: roundedHeight
  };
}
