<script>
  export let page = 1;
  export let callback;

  let xDown;
  let yDown;

  document.addEventListener("keyup", keyUp);

  document.addEventListener("touchstart", touchStart, false);
  document.addEventListener("touchmove", touchMove, false);

  function keyUp(e) {
    if (e.keyCode === 39) {
      changePage(1);
    } else if (e.keyCode === 37) {
      changePage(-1);
    }
  }

  function touchStart(e) {
    xDown = e.touches[0].clientX;
    yDown = e.touches[0].clientY;
  }

  function touchMove(e) {
    if (!xDown) {
      return;
    }

    let xUp = e.touches[0].clientX;
    let yUp = e.touches[0].clientY;

    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      // HORIZONTAL SWIPE
      if (xDiff > 0) {
        // TO LEFT
        changePage(1);
      } else {
        // TO RIGHT
        changePage(-1);
      }
    }

    xDown = undefined;
    yDown = undefined;
  }

  function changePage(n) {
    page += n;

    if (page < 1) {
      page = 1;
    }

    if (callback) {
      callback(page);
    }
  }
</script>
