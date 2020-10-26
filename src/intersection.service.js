let observer
const elements = new Map()

const initObserver = () => {
  return new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const lazy = entry.target
        observer.unobserve(lazy)
        if (elements.has(lazy)) {
          elements.get(lazy)()
          elements.delete(lazy)
        }
      }
    })
  })
}

const getObserver = () => {
  if (!'IntersectionObserver' in window) {
    throw 'IntersectionObserver not supported'
  }
  if (!observer) {
    observer = initObserver()
  }
  return observer
}

export const observe = (element) => {
  try {
    const obs = getObserver()
    return new Promise((resolve) => {
      elements.set(element, resolve)
      obs.observe(element)
    })
  } catch (err) {
    console.warn(err)
    return true
  }
}
