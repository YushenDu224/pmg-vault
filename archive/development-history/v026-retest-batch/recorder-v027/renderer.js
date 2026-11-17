async function recordWindow() {
  let stream;
  try {
    const mimeType = ['video/webm;codecs=vp8', 'video/webm'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw Error('No built-in WebM MediaRecorder encoder is available');
    stream = await navigator.mediaDevices.getDisplayMedia({
      audio: false,
      video: { frameRate: { ideal: 15, max: 15 } }
    });
    if (stream.getAudioTracks().length !== 0 || stream.getVideoTracks().length !== 1) {
      throw Error('Capture returned unexpected tracks');
    }
    const track = stream.getVideoTracks()[0];
    const settings = track.getSettings();
    if (settings.displaySurface && settings.displaySurface !== 'window') {
      throw Error('Capture is not a native window surface');
    }
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3000000 });
    let writes = Promise.resolve();
    recorder.addEventListener('dataavailable', event => {
      if (!event.data.size) return;
      writes = writes.then(async () => window.recorderBridge.chunk(new Uint8Array(await event.data.arrayBuffer())));
    });
    recorder.addEventListener('error', event => window.recorderBridge.error(event.error?.message || 'MediaRecorder error'));
    recorder.addEventListener('stop', async () => {
      try {
        await writes;
        stream.getTracks().forEach(item => item.stop());
        await window.recorderBridge.finished();
      } catch (error) {
        await window.recorderBridge.error(error.message);
      }
    });
    window.recorderBridge.onStop(() => { if (recorder.state !== 'inactive') recorder.stop(); });
    track.addEventListener('ended', () => { if (recorder.state !== 'inactive') recorder.stop(); });
    await window.recorderBridge.started({
      mimeType,
      audioTracks: stream.getAudioTracks().length,
      videoTracks: stream.getVideoTracks().length,
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
      displaySurface: settings.displaySurface,
      trackLabel: track.label
    });
    recorder.start(1000);
  } catch (error) {
    stream?.getTracks().forEach(track => track.stop());
    await window.recorderBridge.error(error.name + ': ' + error.message);
  }
}
recordWindow();
