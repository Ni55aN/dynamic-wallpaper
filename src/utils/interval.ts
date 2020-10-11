export function createInterval(cb: () => Promise<void>) {
  let timeout: NodeJS.Timeout | null = null
  let currentDelay = 0

  function exec() {
    timeout && clearTimeout(timeout)

    if (currentDelay !== 0) {
      timeout = setTimeout(async () => {
        await cb()
        exec()
      }, currentDelay * 1000)
    }
  }

  return {
    getDelay() {
      return currentDelay
    },
    set(delay: number) {
      currentDelay = delay
      exec()
    }
  }
}