const express = require("express");
const axios = require("axios");

const router = express.Router();

const apiKey = process.env.YOUTUBE_API_KEY;
const githubUrl = "https://github.com/Vavassor/slowtube";
const websiteTitle = "Slowtube";
const websiteUrl = "https://slowtube.net";

const validateVideoListResponse = (videoListResponse) => {
  return (
    videoListResponse.kind === "youtube#videoListResponse" &&
    videoListResponse.items &&
    videoListResponse.items.length > 0
  );
};

const validateVideo = (video, videoId) => {
  return (
    video.kind === "youtube#video" &&
    video.id === videoId &&
    video.snippet &&
    video.snippet.thumbnails
  );
};

const getVideoInfo = (videoListResponse, videoId) => {
  let videoInfo = {};

  if (validateVideoListResponse(videoListResponse, videoId)) {
    const video = videoListResponse.items[0];
    if (validateVideo(video, videoId)) {
      const { description, thumbnails, title } = video.snippet;
      videoInfo = {
        description,
        thumbnailUrl: thumbnails.medium.url,
        title,
      };
    }
  }

  return videoInfo;
};

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    githubUrl,
    openGraphDescription: "YouTube videos that start slowed down or sped up.",
    openGraphImage: `${websiteUrl}/images/slowtube-card.png`,
    openGraphTitle: websiteTitle,
    title: websiteTitle,
    websiteUrl,
  });
});

router.get("/:videoId", async (request, response, next) => {
  const { videoId } = request.params;
  const parts = ["snippet"];
  const playbackRate = request.query["playback_rate"];

  const params = new URLSearchParams();
  params.append("id", videoId);
  params.append("key", apiKey);
  params.append("part", parts.join(","));
  const url = `https://www.googleapis.com/youtube/v3/videos?${params}`;

  try {
    const youtubeResponse = await axios.get(url);
    const videoInfo = getVideoInfo(youtubeResponse.data, videoId);
      response.render("index", {
        githubUrl,
        openGraphDescription: playbackRate
          ? `At ${playbackRate}x playback speed`
          : videoInfo.description,
        openGraphImage: videoInfo.thumbnailUrl,
        openGraphTitle: videoInfo.title,
        title: websiteTitle,
        websiteUrl,
      });
  } catch (error) {
    response.render("index", {
      githubUrl,
      openGraphDescription:
        "YouTube videos that start slowed down or sped up.",
      openGraphImage: `${websiteUrl}/images/slowtube-card.png`,
      openGraphTitle: websiteTitle,
      title: websiteTitle,
      websiteUrl,
    });
  }
});

module.exports = router;
