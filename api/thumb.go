package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"time"
)

// Pictures internal object provides access to pictures.
type Pictures struct {
	URI         string         `json:"uri,omitempty"`
	Active      bool           `json:"active"`
	Type        string         `json:"type,omitempty"`
	Sizes       []*PictureSize `json:"sizes,omitempty"`
	Link        string         `json:"link,omitempty"`
	ResourceKey string         `json:"resource_key,omitempty"`
}

// PictureSize internal object provides access to picture size.
type PictureSize struct {
	Width              int    `json:"width,omitempty"`
	Height             int    `json:"height,omitempty"`
	Link               string `json:"link,omitempty"`
	LinkWithPlayButton string `json:"link_with_play_button,omitempty"`
}

// Embed internal object provides access to HTML embed code.
type Embed struct {
	HTML string `json:"html,omitempty"`
}

// Video represents a video.
type Video struct {
	URI           string        `json:"uri,omitempty"`
	Name          string        `json:"name,omitempty"`
	Description   string        `json:"description,omitempty"`
	Link          string        `json:"link,omitempty"`
	Duration      int           `json:"duration,omitempty"`
	Width         int           `json:"width,omitempty"`
	Height        int           `json:"height,omitempty"`
	Language      string        `json:"language,omitempty"`
	Embed         *Embed        `json:"embed,omitempty"`
	CreatedTime   time.Time     `json:"created_time,omitempty"`
	ModifiedTime  time.Time     `json:"modified_time,omitempty"`
	ReleaseTime   time.Time     `json:"release_time,omitempty"`
	ContentRating []string      `json:"content_rating,omitempty"`
	License       string        `json:"license,omitempty"`
	Pictures      *Pictures     `json:"pictures,omitempty"`
	Status        string        `json:"status,omitempty"`
	ResourceKey   string        `json:"resource_key,omitempty"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	rq := r.URL.Query()
    videoid := rq.Get("videoid")
    imageType := rq.Get("type")
    mw := rq.Get("mw")
    mh := rq.Get("mh")
    quality := rq.Get("q")

    if len(videoid) < 1 {
        log.Println("Url Param 'videoid' is missing")
        return
    }

	apiUrl := "https://api.vimeo.com/videos/" + videoid

	spaceClient := http.Client{
		Timeout: time.Second * 2, // Maximum of 2 secs
	}

	req, err := http.NewRequest(http.MethodGet, apiUrl, nil) 
	if err != nil {
		log.Fatal(err)
	}

	q := req.URL.Query()
    q.Add("fields", "pictures")
    req.URL.RawQuery = q.Encode()

	bearer := "Bearer " + os.Getenv("VIMEO_TOKEN")
    // add authorization header to the req
    req.Header.Add("Authorization", bearer)
	req.Header.Set("User-Agent", "lite-vimeo-embed")

	res, getErr := spaceClient.Do(req)
	if getErr != nil {
		log.Fatal(getErr)
	}

	body, readErr := ioutil.ReadAll(res.Body)
	if readErr != nil {
		log.Fatal(readErr)
	}

	video := Video{}
	jsonErr := json.Unmarshal(body, &video)
	if jsonErr != nil {
		log.Fatal(jsonErr)
	}

	imageId := path.Base(video.Pictures.URI)

	imageUrl, err := url.Parse(fmt.Sprintf("https://i.vimeocdn.com/video/%s.%s", imageId, imageType))
	if err != nil {
		log.Fatal(err)
	}

	q = imageUrl.Query()
    q.Add("mw", mw)
    q.Add("mh", mh)
    q.Add("q", quality)
    imageUrl.RawQuery = q.Encode()

    reqImg, imgErr := http.Get(imageUrl.String())
    if imgErr != nil {
        log.Fatal(imgErr)
    }

    // fmt.Fprintf(w, imageUrl.String())

    w.Header().Set("Content-Length", fmt.Sprint(reqImg.ContentLength))
    w.Header().Set("Content-Type", reqImg.Header.Get("Content-Type"))

    _, copyErr := io.Copy(w, reqImg.Body)
    if copyErr != nil {
        log.Fatal(copyErr)
    }

    defer reqImg.Body.Close()
}
