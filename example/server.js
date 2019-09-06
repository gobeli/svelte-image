const fs = require('fs');
const path = require('path');
require('svelte/register')({
	extensions: ['.svelte']
});

const promise = (fn, ...args) => 
  new Promise((resolve, reject) => 
    fn(...args, (err, res) =>
      err ? reject(err) : resolve(res)
    )
  );

const app = require('./App.svelte');

(async () => {
  const src = path.join(__dirname, '..', '..', 'index.template.html');
  const dest = path.join(__dirname, '..', '..', 'index.html');
  let template = await promise(fs.readFile, src, 'utf8');
  template = template.replace(/{app}/g, app.render().html);
  console.log(app.render())
  await promise(fs.writeFile, dest, template, 'utf8');
})()

