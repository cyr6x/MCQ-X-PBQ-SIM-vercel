import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});


class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
});

// jsdom does not implement window.scrollTo; engines scroll to the top of each
// new question, so silence the not-implemented error in tests.
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: () => {},
});

// Element.prototype.scrollTo is also missing in jsdom.
if (!Element.prototype.scrollTo) {
  Element.prototype.scrollTo = () => {};
}
