import {execSync} from 'child_process';
import {writeFileSync} from 'fs-extra';
import {resolve as resolvePath} from 'path';
import {rollup} from 'rollup';
import {cp} from 'shelljs';
import copyfiles from 'copyfiles';

import createConfig from '../config/rollup';

const root = resolvePath(__dirname, '..');
const build = resolvePath(root, './build');

execSync(`./node_modules/.bin/tsc --outDir ${resolvePath(build, 'src')}`, {
  stdio: 'inherit',
});

writeFileSync(resolvePath(build, '.babelrc'), `
  {
    "presets": [
      "shopify/react",
      ["shopify/web", {"modules": false}]
    ]
  }
`);

copy(['./src/**/*.{scss,svg,png,jpg,jpeg}', build])
  .then(() => runRollup({format: 'cjs', css: true}))
  .then(() => runRollup({format: 'es', css: false}))
  .then(() => Promise.all([
    cp('./build/quilt.js', './index.js'),
    cp('./build/quilt.es.js', './index.es.js'),
    cp('./build/quilt.css', './styles.css'),
  ]))
  // eslint-disable-next-line no-console
  .catch((error) => console.error(error));

function runRollup({format, css}) {
  const filename = format === 'cjs' ? 'quilt.js' : `quilt.${format}.js`;
  const config = createConfig({
    outputCSS: css && resolvePath(build, 'quilt.css'),
  });

  return rollup(config)
    .then((bundle) => bundle.write({
      format,
      dest: resolvePath(build, filename),
    }));
}

function copy(paths, flat = false) {
  return new Promise((resolve, reject) => {
    copyfiles(paths, flat, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}