(async () => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  const formatNumber = number => Number.isFinite(number) ? number : String(number);
  const ranges = value => Array.from({ length: value.length }, (_, index) => [value.start(index), value.end(index)]);
  const once = (name, action, timeout = 15000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(Error('Timed out waiting for ' + name)); }, timeout);
    function cleanup() { clearTimeout(timer); video.removeEventListener(name, success); video.removeEventListener('error', failure); }
    function success() { cleanup(); resolve(); }
    function failure() { cleanup(); reject(Error('Media error: ' + video.error?.code + ' ' + video.error?.message)); }
    video.addEventListener(name, success, { once: true });
    video.addEventListener('error', failure, { once: true });
    action();
  });
  try {
    await once('loadedmetadata', async () => { video.src = await window.offlineDecoder.source(); video.load(); });
    const initialDuration = formatNumber(video.duration);
    if (!Number.isFinite(video.duration)) {
      await once('seeked', () => { video.currentTime = 1e7; });
    }
    const durationAfterIndexing = formatNumber(video.duration);
    const endSeekTime = video.currentTime;
    for (const requestedTime of [3, 40, 90]) {
      await once('seeked', () => { video.currentTime = requestedTime; });
      await delay(120);
      if (video.readyState < 2 || video.videoWidth < 1) throw Error('No decoded video image at ' + requestedTime);
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      await window.offlineDecoder.frame({ requestedTime, decodedTime: video.currentTime, width: canvas.width, height: canvas.height, dataURL: canvas.toDataURL('image/png') });
    }
    const quality = video.getVideoPlaybackQuality();
    await window.offlineDecoder.complete({
      initialDuration,
      durationAfterIndexing,
      endSeekTime,
      width: video.videoWidth,
      height: video.videoHeight,
      seekable: ranges(video.seekable),
      buffered: ranges(video.buffered),
      readyState: video.readyState,
      networkState: video.networkState,
      decodedVideoFrames: quality.totalVideoFrames,
      droppedVideoFrames: quality.droppedVideoFrames,
      canPlayVP8WebM: video.canPlayType('video/webm;codecs=vp8'),
      autoplayUsed: false,
      audioPlayed: false
    });
  } catch (error) { await window.offlineDecoder.error(error.stack); }
})();
