<script lang="typescript">
  const BASE_URL = 'http://fe5c6436f27b.eu.ngrok.io/';
  const VIDEO_URL = BASE_URL + 'view';
  // const VIDEO_URL = './video1.mkv';

  let time = 0;
  let duration: number;
  let paused = true;

  let showControls = true;
  let showControlsTimeout: any;

  let chat: any[] = [];
  let myUUID = '';

  let socket = io.connect(BASE_URL, {
    resource: 'nodejs',
  });

  socket.on('welcome', (uuid: string) => {
    myUUID = uuid;
  });

  socket.on('message', (data: any) => {
    chat = [...chat, data];
  });

  socket.on('sync-time', (data: any) => {
    console.log('Sync time:', data);

    if (data.uuid === myUUID) return;

    time = data.time;
  });

  socket.on('play-pause', (data: any) => {
    if (data.uuid === myUUID) return;

    paused = !data.play;
  });

  socket.on('seek', (data: any) => {
    if (data.uuid === myUUID) return;

    time += data.seekTime;
  });

  $: console.log(socket);

  const playOrPause = () => {
    paused = !paused;

    socket.emit('play-pause', {
      uuid: myUUID,
      play: !paused,
    });
  };

  const seek = (seekTime: number) => {
    time += seekTime;

    socket.emit('seek', {
      uuid: myUUID,
      seekTime,
    });
  };

  function handleMousemove(e: any) {
    // Make the controls visible, but fade out after
    // 2.5 seconds of inactivity
    clearTimeout(showControlsTimeout);
    showControlsTimeout = setTimeout(() => (showControls = false), 2500);
    showControls = true;

    if (!(e.buttons & 1)) return; // mouse not down
    if (!duration) return; // video not loaded yet

    const { left, right } = (this as any).getBoundingClientRect();
    time = (duration * (e.clientX - left)) / (right - left);
    socket.emit('sync-time', {
      uuid: myUUID,
      time,
    });
  }

  function handleMousedown(e: any) {
    // we can't rely on the built-in click event, because it fires
    // after a drag — we have to listen for clicks ourselves

    function handleMouseup() {
      if (paused) e.target.play();
      else e.target.pause();
      cancel();
    }

    function cancel() {
      e.target.removeEventListener('mouseup', handleMouseup);
    }

    e.target.addEventListener('mouseup', handleMouseup);

    setTimeout(cancel, 200);
  }

  function format(seconds: any) {
    if (isNaN(seconds)) return '...';

    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    if (seconds < 10) seconds = '0' + seconds;

    return `${minutes}:${seconds}`;
  }
</script>

<div class="w-screen h-screen flex flex-row bg-gray-800">
  <div class="w-full flex">
    <div class="my-auto w-full">
      <video
        src={VIDEO_URL}
        on:mousemove={handleMousemove}
        bind:currentTime={time}
        bind:duration
        bind:paused
        class="w-full"
      >
        >
        <track kind="captions" />
      </video>
      <div class="flex flex-col">
        <div
          class="flex flex-row justify-between text-white font-semibold text-xs w-3/5 mx-auto"
        >
          <p class="my-auto">{format(time)}</p>
          <div class="pt-1">
            <button on:click={() => seek(-30)}>
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                /></svg
              >
            </button>
            <button on:click={playOrPause}>
              {#if paused}
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  /><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  /></svg
                >
              {:else}
                <svg
                  class="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  /></svg
                >{/if}
            </button>
            <button on:click={() => seek(30)}>
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                ><path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                /></svg
              >
            </button>
          </div>
          <p class="my-auto">{format(duration)}</p>
        </div>

        <div class="pt-1 flex flex-row text-white">
          <div
            class="overflow-hidden h-1 text-xs flex rounded bg-gray-500 opacity-40 w-3/5 mx-auto z-10"
          >
            <div
              on:mousemove={handleMousemove}
              style="width:{(time / duration) * 100 || 0}%"
              class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="w-40 bg-red-200">
    <h1>Chat</h1>
    {#each chat as chatObject}
      <p><b>{chatObject.author}:</b> {chatObject.message}</p>
    {/each}
  </div>
</div>

<style>
  * {
    font-family: Verdana;
  }
</style>
