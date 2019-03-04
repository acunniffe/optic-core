import { FileSystemRenderer } from './cogent-core/react/file-system-renderer';

function render(component: JSX.Element) {
  const callback = jest.fn();
  const renderer = new FileSystemRenderer();
  renderer.renderSync(component, { callback });
  const [err, result] = callback.mock.calls[0];

  return {
    callback,
    err,
    result,
  };
}

// @ts-ignore
global.render = render;
