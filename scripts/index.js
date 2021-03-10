"use strict";

let player;

const radioButtonInfoByType = {
  common: {
    inputId: "playback-rate-type-common",
    name: "playback-rate-common",
    sectionId: "playback-rate-select-field-section",
  },
  custom: {
    inputId: "playback-rate-type-custom",
    name: "playback-rate-custom",
    sectionId: "playback-rate-slider-section",
  },
};

const handleReadyPlayer = (event, parameters) => {
  const player = event.target;
  const { playbackRate } = parameters;
  player.setPlaybackRate(playbackRate);
};

const readParameters = () => {
  const urlSearchParams = new URLSearchParams(window.location.search);
  const playbackRateParam = urlSearchParams.get("playback_rate");
  const playbackRate = !!playbackRateParam ? parseFloat(playbackRateParam) : 1;
  const videoId = urlSearchParams.get("video_id");

  if (!videoId) {
    throw new Error("No video ID provided.");
  }

  const parameters = {
    playbackRate,
    videoId,
  };

  return parameters;
};

function onYouTubeIframeAPIReady() {
  const parameters = readParameters();
  player = new YT.Player("player", {
    events: {
      onReady: (event) => handleReadyPlayer(event, parameters),
    },
    height: "390",
    playerVars: {
      autoplay: 1,
    },
    videoId: parameters.videoId,
    width: "640",
  });
}

const loadYoutubeIframeApi = () => {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.insertAdjacentElement("afterend", tag);
};

const handleInputPlaybackRate = (event, playbackRateValue) => {
  const { value } = event.target;
  playbackRateValue.textContent = value;
};

const getClipboardWritePermission = async () => {
  let permissionResult;
  try {
    permissionResult = await navigator.permissions.query({
      name: "clipboard-write",
    });
  } catch (error) {
    // Assume that the permission is not supported and no permission is
    // required (default to permission granted).
    return true;
  }
  return (
    permissionResult.state === "granted" || permissionResult.state === "prompt"
  );
};

const copyToClipboard = async (text) => {
  if (!navigator.clipboard) {
    throw new Error("Clipboard API unsupported");
  }
  const isGranted = await getClipboardWritePermission();
  if (!isGranted) {
    throw new Error("Clipboard permission is not granted.");
  }
  await navigator.clipboard.writeText(text);
};

const copyToClipboardFallback = (textInput) => {
  textInput.select();
  document.execCommand("copy");
};

const handleClickCopyToClipboard = (event) => {
  const createdUrl = document.getElementById("created-url");
  copyToClipboard(createdUrl.value).catch((error) => {
    copyToClipboardFallback(createdUrl);
  });
};

const setUpCopyToClipboardButton = () => {
  const button = document.getElementById("copy-to-clipboard");
  button.addEventListener("click", handleClickCopyToClipboard);
};

const setUpPlaybackRateSlider = () => {
  const playbackRate = document.getElementById("playback-rate-slider");
  const playbackRateValue = document.getElementById(
    "playback-rate-slider-value"
  );
  playbackRateValue.textContent = playbackRate.value;
  playbackRate.addEventListener("input", (event) => {
    handleInputPlaybackRate(event, playbackRateValue);
  });
};

const setSectionIsVisible = (sectionId, isVisible) => {
  const section = document.getElementById(sectionId);
  section.style.display = isVisible ? "block" : "none";
};

const updatePlaybackRateTypeSectionVisibility = (checkedType) => {
  for (const type in radioButtonInfoByType) {
    const radioButtonInfo = radioButtonInfoByType[type];
    setSectionIsVisible(radioButtonInfo.sectionId, type === checkedType);
  }
};

const setPlaybackRateType = (type) => {
  const radioButtonInfo = radioButtonInfoByType[type];
  const radioButton = document.getElementById(radioButtonInfo.inputId);
  radioButton.checked = true;
  updatePlaybackRateTypeSectionVisibility(type);
};

const handleChangePlaybackRateType = (event) => {
  setPlaybackRateType(event.target.value);
};

const setUpPlaybackRateType = () => {
  for (const type in radioButtonInfoByType) {
    const radioButtonInfo = radioButtonInfoByType[type];
    const radioButton = document.getElementById(radioButtonInfo.inputId);
    radioButton.addEventListener("change", handleChangePlaybackRateType);
  }
};

const createUrl = (spec) => {
  const urlSearchParams = new URLSearchParams();
  urlSearchParams.set("playback_rate", spec.playbackRate);
  urlSearchParams.set("video_id", spec.videoId);
  return `https://vavassor.github.io/slowtube?${urlSearchParams.toString()}`;
};

const getYoutubeUrlType = (url) => {
  if (url.hostname === "youtu.be") {
    return "short";
  }
  if (url.pathname.slice(1, 6) === "embed") {
    return "embed";
  }
  return "basic";
};

const getVideoIdFromYoutubeUrl = (urlString) => {
  let url;
  try {
    url = new URL(urlString);
  } catch (error) {
    return null;
  }

  const type = getYoutubeUrlType(url);

  switch (type) {
    case "basic": {
      const urlSearchParams = new URLSearchParams(url.search);
      return urlSearchParams.get("v");
    }
    case "embed": {
      return url.pathname.slice(7);
    }
    case "short": {
      return url.pathname.slice(1);
    }
  }
};

const validateUrlCreation = (videoId) => {
  const invalidMessage = document.getElementById(
    "youtube-url__invalid-message"
  );
  const textFieldInput = document.getElementById("youtube-url");

  if (!videoId) {
    invalidMessage.textContent = "Please enter a valid YouTube video URL.";
    textFieldInput.classList.add("text-field__input--invalid");
    textFieldInput.setAttribute("aria-invalid", "true");
    return false;
  } else {
    invalidMessage.textContent = "";
    textFieldInput.classList.remove("text-field__input--invalid");
    textFieldInput.setAttribute("aria-invalid", "false");
  }

  return true;
};

const handleSubmitUrlCreation = (event) => {
  event.preventDefault();

  const { elements } = event.target;

  const playbackRateType = elements.namedItem("playback-rate-type").value;
  const radioButtonInfo = radioButtonInfoByType[playbackRateType];
  const playbackRate = elements.namedItem(radioButtonInfo.name).value;
  const youtubeUrl = elements.namedItem("youtube-url");
  const videoId = getVideoIdFromYoutubeUrl(youtubeUrl.value);

  const isValid = validateUrlCreation(videoId);
  if (isValid) {
    const generatedUrlOutput = document.getElementById("created-url");
    generatedUrlOutput.value = createUrl({ playbackRate, videoId });
  }
};

const setUrlCreationSubmissionHandler = () => {
  const form = document.getElementById("url-creation-form");
  form.addEventListener("submit", handleSubmitUrlCreation);
};

const setUpForm = () => {
  setPlaybackRateType("common");
  setUpPlaybackRateType();
  setUpPlaybackRateSlider();
  setUrlCreationSubmissionHandler();
  setUpCopyToClipboardButton();
};

const handleDomContentLoaded = () => {
  loadYoutubeIframeApi();
  setUpForm();
};

window.addEventListener("DOMContentLoaded", handleDomContentLoaded);
