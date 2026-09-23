import { FunctionDirective } from 'vue';
import StatusBarClickObserver from '@/utils/status-bar-click-observer';

const scrollViews = new Set<HTMLElement>();

StatusBarClickObserver.observe(() => {
  for (const sv of [...scrollViews]) {
    sv.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

const backToTop: FunctionDirective<HTMLElement, boolean> = (el, binding) => {
  if (binding.value) {
    scrollViews.add(el);
  } else {
    scrollViews.delete(el);
  }
};

export default backToTop;
