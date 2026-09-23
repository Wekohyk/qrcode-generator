const bucket = new Set<() => void>();

export const observe = (callback: () => void) => bucket.add(callback);
export const unobserve = (callback: () => void) => bucket.delete(callback);

// if (tw.observeStatusBarClicked) {
//   tw.observeStatusBarClicked(() => {
//     if (document.visibilityState === 'visible') {
//       for (const callback of [...bucket]) {
//         callback();
//       }
//     }
//   });
// }

const StatusBarClickObserver = {
  observe,
  unobserve,
};

export default StatusBarClickObserver;
