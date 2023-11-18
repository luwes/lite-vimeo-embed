> 🙋 Using YouTube? Check out the original [lite-youtube-embed](https://github.com/paulirish/lite-youtube-embed).  
> 🦾 Need more power? Check out [playerx](https://github.com/playerxo/playerx).

# Lite Vimeo Embed

> #### Renders faster than a sneeze.

Provide videos with a supercharged focus on visual performance.
This custom element renders just like the real thing but approximately 224X faster.

## Comparison

| Normal `<iframe>` Vimeo embed |  `lite-vimeo` |
|---|---|
|  ![Screen Shot 2019-11-03 at 5 23 50 PM](https://user-images.githubusercontent.com/39191/68095560-5c930d00-fe5f-11e9-8104-e73e77a21287.png)   ![Screen Shot 2019-11-03 at 5 21 05 PM](https://user-images.githubusercontent.com/39191/68095562-5d2ba380-fe5f-11e9-8b5f-18f451b0716d.png)  ![Screen Shot 2019-11-03 at 5 19 35 PM](https://user-images.githubusercontent.com/39191/68095565-5d2ba380-fe5f-11e9-835d-85d37df71f52.png)  | ![Screen Shot 2019-11-03 at 5 23 27 PM](https://user-images.githubusercontent.com/39191/68095561-5d2ba380-fe5f-11e9-9393-e2206a64c8bf.png) ![Screen Shot 2019-11-03 at 5 20 55 PM](https://user-images.githubusercontent.com/39191/68095563-5d2ba380-fe5f-11e9-8f9a-f5c4a774cd56.png)  ![Screen Shot 2019-11-03 at 5 20 16 PM](https://user-images.githubusercontent.com/39191/68095564-5d2ba380-fe5f-11e9-908f-7e12eab8b2ad.png) |

## Basic usage

To use the custom embed you will need to:

1. Include the script
1. Use the element `lite-vimeo` markup and scripting
1. Be happy that you're providing a better user experience to your visitors

```html
<!-- Include the custom element script -->
<script type="module" src="https://cdn.jsdelivr.net/npm/lite-vimeo-embed/+esm"></script>

<!-- Use the element. You may define uses before the scripts are parsed and executed. -->
<lite-vimeo videoid="357274789"></lite-vimeo>
```

## Pro-usage

Use this as your HTML, load the script asynchronously, and let the JS progressively enhance it.

```html
<lite-vimeo videoid="357274789" style="background-image: url('https://i.vimeocdn.com/video/810965406.webp?mw=1600&mh=900&q=70');">
  <div class="ltv-playbtn"></div>
</lite-vimeo>
```
